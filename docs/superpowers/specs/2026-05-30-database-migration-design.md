# StudyAI 业务数据中心化迁移 — 设计文档

**日期：** 2026-05-30
**状态：** 已确认
**目标：** 将所有业务数据从浏览器 localStorage / 内存迁移到 Neon Postgres，实现用户数据中心化存储和跨设备同步。

---

## 1. 当前状态

### 1.1 数据库（Neon Postgres）

仅 4 张 NextAuth 表：

| 表 | 用途 |
|----|------|
| user | 用户基本信息（id, name, email, hashedPassword, image） |
| account | OAuth 账户关联（Google 等） |
| session | 数据库会话（当前使用 JWT 策略，此表未主用） |
| verificationToken | 邮箱验证 Token |

### 1.2 浏览器 localStorage（9 个 key）

| Key | 数据内容 | 类型 |
|-----|---------|------|
| `studyai-chat-sessions` | 聊天会话 + 消息历史 | `Record<string, ChatSession>` |
| `studyai-checkins` | 打卡记录 | `CheckinRecord[]` |
| `studyai-settings` | 用户偏好 | `Record<string, unknown>` |
| `studyai-persona` | AI 教练人格 | `"strict" \| "gentle" \| "data-driven"` |
| `studyai-memories` | AI 长期记忆 | `MemoryEntry[]` |
| `studyai-language` | 语言偏好 | `"zh-CN" \| "en"` |
| `studyai-notifications` | 通知开关 | `boolean` |
| `studyai-weekly-goal` | 每周目标小时数 | `number` |
| `studyai-dashboard-insight-*` | AI 洞察缓存 | `{ date, text }` |

### 1.3 内存（进程级）

| 数据 | 位置 | 问题 |
|------|------|------|
| `LearningPlan[]` | `plan.mock.ts` 模块级变量 | 刷新页面丢失，靠 chat session 的 planContent 重新解析恢复 |

---

## 2. 数据库 Schema 设计

扩展现有 Drizzle ORM schema，新增 5 张业务表 + 扩展 user 表。

### 2.1 `plan` — 学习计划

```sql
id          text PK      -- plan-xxx
userId      text FK      -- → user.id CASCADE
title       text
mode        text         -- "quick" | "detailed"
goal        jsonb        -- LearningGoal { title, description, deadline, currentLevel, targetLevel }
stages      jsonb        -- Stage[] 完整阶段→周→天的嵌套结构
theories    jsonb        -- PlanTheory[] 认知理论列表
weeklyGoal  text
monthlyGoal text
phaseGoal   text
status      text         -- "active" | "completed" | "paused"
endDate     text
chatSessionId text       -- 关联聊天会话 ID
createdAt   timestamp    -- DEFAULT NOW()
```

> **为什么 stages 用 jsonb？** Stage → Week → Day → Task 是 4 层嵌套，拆成独立表会让查询和写入极其复杂。jsonb 读写一次完成，且 PostgreSQL 支持 jsonb 索引。

### 2.2 `chatSession` — 聊天会话

```sql
id         text PK       -- session_xxx
userId     text FK       -- → user.id CASCADE
mode       text          -- "quick" | "detailed"
title      text
planId     text          -- 关联 plan.id（可选）
createdAt  timestamp     -- DEFAULT NOW()
updatedAt  timestamp     -- DEFAULT NOW()
```

### 2.3 `chatMessage` — 聊天消息

```sql
id         text PK       -- msg_xxx / ai_xxx
sessionId  text FK       -- → chatSession.id CASCADE
role       text          -- "user" | "assistant"
content    text          -- 消息全文（含 [PLAN_DATA] 等标记）
timestamp  text          -- ISO 8601
```

### 2.4 `checkin` — 打卡记录

```sql
id          text PK      -- checkin-xxx
userId      text FK      -- → user.id CASCADE
planId      text FK      -- → plan.id CASCADE
date        text         -- yyyy-mm-dd
tasks       jsonb        -- TaskCheckin[]
feedback    jsonb        -- CheckinFeedback { stuckPoints, difficulties, summary, focusScore, needAdjustment, tomorrowGoal }
focusLevel  integer      -- 1-10
moodRating  integer      -- 1-5
createdAt   timestamp    -- DEFAULT NOW()
```

### 2.5 `memory` — AI 长期记忆

```sql
id             text PK    -- mem_xxx
userId         text FK    -- → user.id CASCADE
type           text       -- "goal" | "habit" | "preference" | "fact" | "pattern"
content        text       -- 记忆内容
confidence     real       -- 0-1
lastRecalledAt timestamp
source         text       -- 来源标识
createdAt      timestamp  -- DEFAULT NOW()
```

### 2.6 扩展 `user` 表

在现有 `user` 表新增一列：

```sql
ALTER TABLE "user" ADD COLUMN "settings" jsonb;
-- settings 结构:
-- {
--   name: string,
--   persona: "strict" | "gentle" | "data-driven",
--   language: "zh-CN" | "en",
--   notifications: boolean,
--   weeklyGoal: number,
--   lastDashboardInsight: { date: string, text: string }
-- }
```

> 不建独立 settings 表。一行 jsonb 覆盖所有简单偏好，减少 JOIN。

### ER 关系图

```
user ──1:N── plan
user ──1:N── chatSession
chatSession ──1:N── chatMessage
user ──1:N── checkin
checkin ──N:1── plan
user ──1:N── memory
user.settings ── jsonb
```

---

## 3. API 路由设计

所有路由挂载在 `/api/` 下，需登录鉴权（`const session = await auth()`）。

### 3.1 计划 API

| 方法 | 路由 | 说明 |
|------|------|------|
| GET | `/api/plans` | 获取当前用户所有计划（不含 stages 详情） |
| POST | `/api/plans` | 从 ExtractedPlanData 创建新计划 |
| GET | `/api/plans/[id]` | 获取单个计划（含完整 stages） |
| PATCH | `/api/plans/[id]` | 更新任务完成状态、计划状态等 |
| DELETE | `/api/plans/[id]` | 删除计划（级联删除关联 checkin） |

### 3.2 会话 & 消息 API

| 方法 | 路由 | 说明 |
|------|------|------|
| GET | `/api/chat-sessions` | 获取用户所有会话（不含 messages） |
| POST | `/api/chat-sessions` | 创建或更新会话（upsert by id） |
| GET | `/api/chat-sessions/[id]` | 获取单个会话 + 全部消息 |
| DELETE | `/api/chat-sessions/[id]` | 删除会话及所有消息 |
| POST | `/api/chat-sessions/[id]/messages` | 向会话追加新消息（批量） |

### 3.3 打卡 API

| 方法 | 路由 | 说明 |
|------|------|------|
| GET | `/api/checkins` | 获取打卡记录（支持 `?date=&planId=` 过滤） |
| POST | `/api/checkins` | 提交今日打卡 |

### 3.4 记忆 API

| 方法 | 路由 | 说明 |
|------|------|------|
| GET | `/api/memories` | 获取用户所有记忆 |
| POST | `/api/memories` | 批量新增/更新记忆（upsert by id） |
| DELETE | `/api/memories` | 清空用户所有记忆 |

### 3.5 用户设置 API

| 方法 | 路由 | 说明 |
|------|------|------|
| GET | `/api/user/settings` | 获取当前用户 settings |
| PATCH | `/api/user/settings` | 合并更新用户 settings |

### 3.6 数据迁移 API

| 方法 | 路由 | 说明 |
|------|------|------|
| POST | `/api/migrate` | 客户端上传旧 localStorage 数据，服务端批量写入数据库 |

---

## 4. Store 层改造

### 4.1 改造对照

| Store / 组件 | 改造前数据源 | 改造后数据源 |
|-------------|-------------|-------------|
| `auth-store` | localStorage `studyai-settings` | `GET/PATCH /api/user/settings` |
| `chat-store` | localStorage `studyai-chat-sessions` | `/api/chat-sessions/*` |
| `checkin-store` | localStorage `studyai-checkins` | `/api/checkins` |
| `plan-store` | 内存变量 `let plans = []` | `/api/plans/*` |
| `persona-store` | localStorage `studyai-persona` | 合入 settings（`user.settings.persona`） |
| `memory-store` | localStorage `studyai-memories` | `/api/memories` |
| `language-store` | localStorage `studyai-language` | 合入 settings（`user.settings.language`） |
| `settings/page.tsx` | localStorage `notifications`/`weekly-goal` | 合入 settings API |
| `dashboard/page.tsx` | localStorage `insight-cache` | 合入 settings（`user.settings.lastDashboardInsight`） |

### 4.2 加载时序

```
App 挂载
  → auth() 获取 session（已有）
  → GET /api/user/settings   → 填充 persona / language / notifications / weeklyGoal
  → GET /api/plans            → 填充计划列表
  → GET /api/chat-sessions    → 填充会话列表（不含消息体，点击时懒加载）
  → 各 Store 完成填充
  → 页面渲染
```

### 4.3 旧数据迁移（一次性）

客户端检测到存在旧的 localStorage key 时，发起迁移请求：

```
POST /api/migrate
Body: { chatSessions, checkins, settings, memories }

服务端：
  1. 遍历 chatSessions → 写入 chatSession + chatMessage 表
  2. 遍历 checkins → 写入 checkin 表
  3. 写入 memories → memory 表
  4. 写入 settings → user.settings jsonb
  5. 返回 { migrated: { sessions, messages, checkins, memories } }

客户端：
  接到成功响应后，清除旧的 localStorage key
```

---

## 5. 错误策略

- **API 失败**：返回错误提示，不阻塞 UI。Store 保留本地副本作为缓存，下次请求成功后覆盖。
- **鉴权失败**：返回 401，客户端跳转登录页。
- **数据冲突**：以最后写入为准（last-write-wins），不实现冲突版本控制。

---

## 6. 学习资料校验规则

**规则：所有 AI 生成给用户的学习资料（resources），在展示/保存前必须经过可用性和合理性检查。**

### 6.1 可用性检查

- **URL 格式**：必须是合法的 `http://` 或 `https://` URL，hostname 长度 >= 4
- **URL 黑名单**：过滤占位 URL，如 `example.com`、`localhost`、`...`、`xxx`、`placeholder`、`sample`、`fake` 等

### 6.2 合理性检查

- **标题**：不能是通用占位文字（如"学习资料"、"参考资料"、"TBD"、"TODO"、"待定"、"未命名"、"无"等）
- **来源**：不能是无效占位文字（如"未知"、"其他"、"N/A"、"TBD"等）

### 6.3 处理方式

- 校验不通过的资源**静默丢弃**，不展示给用户
- 同时在浏览器 console 输出 warn 日志，便于调试 AI 输出质量
- 实现位置：`src/lib/resource-validator.ts`，在 `plan-parser.ts` 的资源规范化阶段调用

---

## 7. 不纳入本次范围

- WebSocket 实时同步（当前单设备使用场景，无需多端实时推送）
- 离线模式（不引入 Service Worker / IndexedDB 备份）
- 数据导出 / 导入（后续按需添加）
- 表分区 / 归档（用户量 < 1000 时无必要）
