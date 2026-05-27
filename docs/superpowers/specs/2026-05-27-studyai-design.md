# StudyAI 产品设计文档

## 概述

StudyAI 是一个 AI 驱动的智能学习规划与自律成长平台。用户通过与 AI 对话，获得个性化、科学化的学习计划，并每日追踪完成情况。

## 技术栈

| 层级 | 技术 | 版本 |
|------|------|------|
| 框架 | Next.js (App Router) | 15.x |
| UI库 | shadcn/ui + TailwindCSS | latest |
| 语言 | TypeScript | strict |
| 状态管理 | Zustand + React Context | latest |
| 图表 | Recharts | latest |
| 部署 | Vercel | - |

## 架构设计

### 服务抽象层

所有外部依赖通过服务接口访问，当前使用 Mock 实现，后续可替换为真实服务：

```
services/
  ├── auth/          # 认证服务 (Mock → Supabase)
  ├── chat/          # AI对话服务 (Mock → OpenAI)
  ├── plan/          # 学习计划服务 (Mock → Supabase)
  ├── checkin/       # 打卡服务 (Mock → Supabase)
  └── analytics/     # 数据分析服务 (Mock → Supabase)
```

### 路由结构

| 路由 | 页面 | 说明 |
|------|------|------|
| `/` | 首页 | AI对话框 + Slogan |
| `/login` | 登录页 | 邮箱/Google登录 |
| `/chat` | AI规划聊天 | 核心规划对话 |
| `/plan/[id]` | 计划详情 | 查看学习计划 |
| `/today` | 今日任务 | 打卡页面 |
| `/dashboard` | 数据面板 | 成长数据图表 |
| `/settings` | 设置页 | 用户偏好设置 |

### 组件树

```
RootLayout (ThemeProvider + AuthProvider)
├── HomePage
│   ├── HeroSection (Logo + Slogan)
│   ├── ModeSelector (快速版/细致版)
│   └── ChatPreview (首页轻量对话)
├── ChatPage
│   ├── ChatSidebar (历史记录)
│   ├── ChatMessages (对话气泡 + 打字机)
│   ├── ChatInput (输入框)
│   └── PlanCard (生成的计划卡片)
├── PlanPage
│   ├── PlanTimeline (阶段时间线)
│   ├── DayCard (每日任务卡片)
│   └── TheoryPanel (AI规划依据)
├── TodayPage
│   ├── TaskList (今日任务列表)
│   ├── CheckinDialog (打卡追问弹窗)
│   └── ProgressRing (完成进度环)
├── DashboardPage
│   ├── StreakCounter (连续天数)
│   ├── CompletionChart (完成率趋势)
│   ├── FocusChart (专注度趋势)
│   └── AIScoreCard (AI评分卡)
└── SettingsPage
    ├── ProfileForm
    ├── ThemeToggle
    └── NotificationSettings
```

### 数据流

```
用户输入 → AI服务(模拟) → 返回计划JSON → 存储到状态 → 渲染UI
                                                    ↓
                                          打卡服务 ← 用户打卡
                                                    ↓
                                         分析服务 → 数据面板
```

### 模拟数据策略

- Mock 数据具有真实延迟 (300-1500ms) 模拟网络请求
- AI 对话使用预定义对话树 + 随机变体
- 学习计划使用模板 + 参数化生成
- 打卡记录使用 localStorage 持久化

## 数据库设计 (后续 Supabase 迁移用)

### 表结构

```sql
-- 用户表
users (
  id uuid PRIMARY KEY,
  email text UNIQUE,
  name text,
  avatar_url text,
  created_at timestamp,
  settings jsonb
)

-- 学习计划表
plans (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES users,
  title text,
  goal text,
  mode text, -- 'quick' | 'detailed'
  stages jsonb, -- 阶段数据
  daily_tasks jsonb, -- 每日任务
  theories_used jsonb, -- 使用的学习理论
  status text,
  created_at timestamp,
  end_date date
)

-- 打卡记录表
checkins (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES users,
  plan_id uuid REFERENCES plans,
  task_id text,
  date date,
  completed boolean,
  feedback jsonb, -- AI追问的回答
  focus_level int,
  difficulty_rating int,
  created_at timestamp
)

-- 聊天记录表
chat_history (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES users,
  plan_id uuid REFERENCES plans,
  role text,
  content text,
  created_at timestamp
)

-- 用户画像表
user_profiles (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES users UNIQUE,
  sleep_pattern text,
  focus_duration int,
  best_time text,
  procrastination_triggers jsonb,
  learning_style text,
  stress_level int,
  updated_at timestamp
)

-- 成长数据表
growth_metrics (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES users,
  date date,
  streak_days int,
  completion_rate float,
  total_minutes int,
  focus_score int,
  ai_score int,
  UNIQUE(user_id, date)
)
```

## AI Prompt 架构

### 系统级 Prompt

```
你是 StudyAI 的学习规划教练。你融合了认知科学、行为心理学、神经科学的学习理论。
你的风格：专业但温暖，简洁但有深度，像一位懂科学的私人教练。
每个建议都会附带科学依据，但不会过度解释。
```

### Prompt 模板

1. **学习规划Prompt** - 根据用户画像生成个性化学习计划
2. **自律教练Prompt** - 主动检测用户状态并提供干预
3. **打卡追问Prompt** - 每日打卡后的智能追问
4. **动态调整Prompt** - 根据完成情况动态调整计划
5. **鼓励机制Prompt** - 基于进度的智能鼓励
6. **拖延识别Prompt** - 识别拖延模式并提供对策

### Prompt 调用流程

```
Quick Mode: 3-5轮对话 → 收集关键信息 → 生成计划
Detail Mode: 15-20轮对话 → 深度画像 → 生成个性化计划
Daily Checkin: 打卡 → 追问 → 反馈 → 动态调整
```

## UI 设计系统

### 颜色方案

```
深色模式 (默认):
- 背景: #0a0a0f, #12121a
- 卡片: rgba(255,255,255,0.03) 毛玻璃
- 文字: #e4e4e7, #a1a1aa
- 强调: #a855f7 (紫色), #7c3aed (深紫)
- 发光: 紫色系 box-shadow glow

浅色模式:
- 背景: #fafafa, #ffffff
- 文字: #18181b, #52525b
- 强调: 同上紫色系
```

### 组件风格

- 卡片: rounded-2xl, 毛玻璃 backdrop-blur
- 按钮: rounded-xl, 紫色渐变, hover发光
- 输入框: 暗色背景, 聚焦紫色边框发光
- 动画: transition-all duration-300 ease-out
- 对话气泡: 用户紫色, AI灰色, 圆角不对称
- 打字机效果: 逐字显示 + 光标闪烁

## 项目目录结构

```
study-ai/
├── src/
│   ├── app/                    # App Router 页面
│   │   ├── layout.tsx          # 根布局
│   │   ├── page.tsx            # 首页
│   │   ├── login/page.tsx
│   │   ├── chat/page.tsx
│   │   ├── plan/[id]/page.tsx
│   │   ├── today/page.tsx
│   │   ├── dashboard/page.tsx
│   │   └── settings/page.tsx
│   ├── components/             # 组件
│   │   ├── ui/                 # shadcn 基础组件
│   │   ├── layout/             # 布局组件
│   │   ├── chat/               # 聊天组件
│   │   ├── plan/               # 计划组件
│   │   ├── checkin/            # 打卡组件
│   │   ├── dashboard/          # 数据面板组件
│   │   └── shared/             # 共享组件
│   ├── services/               # 服务抽象层
│   │   ├── auth/
│   │   ├── chat/
│   │   ├── plan/
│   │   ├── checkin/
│   │   └── analytics/
│   ├── stores/                 # Zustand 状态管理
│   ├── prompts/                # AI Prompt 模板
│   ├── hooks/                  # 自定义 Hooks
│   ├── lib/                    # 工具函数
│   ├── types/                  # TypeScript 类型
│   └── styles/                 # 全局样式
├── public/                     # 静态资源
├── docs/                       # 文档
├── .env.example                # 环境变量示例
├── tailwind.config.ts
├── next.config.ts
├── package.json
├── tsconfig.json
└── README.md
```

## 实施计划概要

1. 初始化 Next.js 项目 + shadcn/ui + TailwindCSS
2. 搭建布局和主题系统
3. 实现服务抽象层 + Mock 数据
4. 首页开发
5. 登录页开发
6. AI 聊天页开发（核心）
7. 学习计划详情页
8. 今日任务打卡页
9. 数据面板页
10. 设置页
11. 状态管理集成
12. 动画和交互打磨
13. README + 部署配置
