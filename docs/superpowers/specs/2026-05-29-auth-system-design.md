# StudyAI 账号系统设计文档

## 目标

将现有 mock 认证系统替换为基于 NextAuth.js v5 + Vercel Postgres (Neon) + Drizzle ORM 的真实账号系统，支持邮箱密码登录和 Google OAuth 登录，同时保持前端 UI 和业务逻辑尽量不变。

## 技术栈

- **认证框架**: NextAuth.js v5 (Auth.js) — 处理 session、JWT、OAuth
- **数据库**: Vercel Postgres (Neon) — serverless 原生支持，免费额度充足
- **ORM**: Drizzle ORM — 类型安全、轻量、与 Next.js 配合好
- **密码哈希**: bcryptjs — cost=12
- **Provider**: Credentials (邮箱+密码) + Google OAuth

## 架构

```
前端 (Next.js)
  Login/Register UI → signIn() / signUp()
  Auth Store (Zustand) → 包装 NextAuth session
  Middleware (proxy.ts) → auth() JWT 验证

NextAuth.js v5 (src/auth.ts)
  ├── Credentials Provider (email + password)
  ├── Google Provider (OAuth)
  ├── JWT session strategy
  └── Drizzle Adapter (Neon)

Vercel Postgres (Neon)
  ├── users table
  ├── accounts table (OAuth)
  └── sessions table
```

**核心原则：** 最小侵入替换。只换认证底层，auth store API 对外保持不变，所有业务页面无需修改。

## 数据模型

### users 表

| 列名 | 类型 | 说明 |
|------|------|------|
| id | text PK | UUID |
| name | text | 用户名 |
| email | text UNIQUE | 邮箱 |
| emailVerified | timestamp | 邮箱验证时间 |
| image | text | 头像 URL |
| hashedPassword | text nullable | bcrypt 哈希，Google OAuth 用户为 null |
| createdAt | timestamp | 创建时间 |
| updatedAt | timestamp | 更新时间 |

### accounts 表（NextAuth 标准，OAuth 关联）

| 列名 | 类型 | 说明 |
|------|------|------|
| userId | text FK | 关联 users.id |
| type | text | oauth / email |
| provider | text | google |
| providerAccountId | text | Google 用户 ID |
| access_token | text | OAuth access token |
| refresh_token | text | OAuth refresh token |
| expires_at | int | Token 过期时间 |

### sessions 表（NextAuth 标准）

由 NextAuth Drizzle Adapter 自动管理，存储 session token。

## 文件变更

| 操作 | 文件 | 说明 |
|------|------|------|
| 新建 | `src/db/schema.ts` | Drizzle schema 定义 |
| 新建 | `src/db/index.ts` | Neon 数据库连接 |
| 新建 | `drizzle.config.ts` | Drizzle Kit 配置 |
| 新建 | `src/auth.ts` | NextAuth 配置 |
| 新建 | `src/auth/client.ts` | 客户端 auth() 封装 |
| 新建 | `src/app/api/auth/[...nextauth]/route.ts` | NextAuth API 路由 |
| 新建 | `src/app/api/auth/register/route.ts` | 注册 API（NextAuth 不内置注册） |
| 新建 | `src/services/auth.real.ts` | 真实认证服务 |
| 修改 | `src/proxy.ts` | 中间件改为 JWT 验证 |
| 修改 | `src/stores/auth-store.ts` | 切换真实服务 |
| 修改 | `src/app/login/page.tsx` | 接入 NextAuth signIn |
| 修改 | `src/components/layout/navbar.tsx` | 适配新 session |
| 修改 | `package.json` | 添加依赖 |
| 删除 | `src/services/auth.mock.ts` | 上线后清理 |

### 不修改的文件

- `src/app/chat/page.tsx` — 只消费 auth store，接口不变
- `src/app/settings/page.tsx` — 只消费 auth store，接口不变
- `src/app/plan/[id]/page.tsx` — 只消费 auth store
- `src/components/home/hero-section.tsx` — 只消费 auth store
- 所有其他页面和组件

## 认证流程

### 邮箱注册

```
1. 用户填写 name, email, password
2. 前端校验: password.length >= 6
3. POST /api/auth/register → body: { name, email, password }
4. 服务端校验: email 格式、密码长度、邮箱是否已注册
5. bcrypt 哈希密码 (cost=12)
6. INSERT INTO users
7. 返回 201 → 前端自动调用 signIn("credentials", { email, password })
8. NextAuth 验证密码 → 创建 session → 设置 JWT cookie
9. 前端跳转到 /chat
```

### 邮箱登录

```
1. 用户填写 email, password
2. signIn("credentials", { email, password }) → NextAuth authorize()
3. 查找用户 → bcrypt.compare() → 返回 user 或 null
4. 成功: NextAuth 设置 session cookie → 跳转 /chat
5. 失败: 返回 "邮箱或密码错误"（不区分原因）
```

### Google OAuth 登录

```
1. 用户点击 "Google 登录" → signIn("google")
2. 重定向到 Google 授权页
3. 授权成功 → 回调 /api/auth/callback/google
4. NextAuth 查找已有 account 或创建新用户
5. 如果邮箱已注册 → 自动关联 account 到已有 users 行
6. 设置 session cookie → 跳转 /chat
```

### Session 验证（中间件）

```
1. 每个请求: proxy.ts 调用 auth()
2. 验证 JWT 有效且未过期: 放行
3. JWT 无效/过期/不存在: 重定向到 /login?redirect=原路径
4. 公开路由 (/, /login): 不验证
```

## 错误处理

| 场景 | UI 行为 |
|------|--------|
| 邮箱已注册 | 红色提示"邮箱已注册，请直接登录" |
| 密码错误/用户不存在 | 统一提示"邮箱或密码错误"，不区分原因 |
| 密码过短 (< 6) | 客户端即时校验，红色提示 |
| Google OAuth 用户取消 | 静默回到 /login，不显示错误 |
| Google OAuth 服务异常 | "Google 登录失败，请稍后重试" |
| 数据库连接失败 | "服务暂时不可用，请稍后重试"（不重试） |
| Session 过期 | 自动重定向到 /login，登录后跳回原页面 |

## 安全措施

- 密码 bcrypt 哈希，cost=12，明文从不落盘
- 认证失败不区分具体原因，防止用户枚举
- 中间件用 `auth()` 验证完整 JWT，非仅检查 cookie 存在
- HTTPS 生产环境强制（Vercel 默认）
- Session cookie 为 httpOnly + secure + sameSite=lax

## 迁移策略

**阶段 1: 基础设施搭建（不影响现有功能）**

1. 安装依赖 (next-auth, drizzle, bcryptjs, @auth/drizzle-adapter)
2. 创建数据库 schema 文件
3. 配置 NextAuth（开发环境）
4. 开发环境验证：注册、登录、session

**阶段 2: 切换上线**

1. 替换 auth store 调用真实服务
2. 手动执行 `drizzle-kit push` 创建数据库表
3. Push 到 master，Vercel 自动部署
4. 部署后设置环境变量 (DATABASE_URL, AUTH_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET)

**阶段 3: 清理**

1. 删除 `src/services/auth.mock.ts`
2. 可选：删除 `src/lib/mock-delay.ts` 中 auth 相关逻辑

**对现有用户影响：** mock 阶段数据在 localStorage 中，无真实账号。用户需重新注册，影响可接受。

## 环境变量

```env
DATABASE_URL=           # Neon 连接字符串
AUTH_SECRET=            # npx auth secret 生成
AUTH_GOOGLE_ID=         # Google OAuth Client ID
AUTH_GOOGLE_SECRET=     # Google OAuth Client Secret
AUTH_URL=               # 生产环境 https://yourdomain.vercel.app
```

## 依赖添加

```json
{
  "next-auth": "5.0.0-beta",
  "@auth/drizzle-adapter": "latest",
  "drizzle-orm": "latest",
  "drizzle-kit": "latest",
  "@neondatabase/serverless": "latest",
  "bcryptjs": "latest",
  "@types/bcryptjs": "latest"
}
```
