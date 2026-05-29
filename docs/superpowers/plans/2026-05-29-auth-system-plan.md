# 账户系统 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace mock authentication with NextAuth.js v5 + Vercel Postgres (Neon) + Drizzle ORM, supporting email/password login and Google OAuth, while keeping the auth store API unchanged.

**Architecture:** NextAuth.js v5 handles JWT sessions, credentials, and OAuth. Drizzle ORM manages the Neon Postgres schema. The Zustand auth store replaces its internal `mockAuthService` calls with a new `realAuthService` that wraps NextAuth's client-side `signIn`/`signOut`/`getSession`. A `SessionProvider` + `AuthWatcher` sync NextAuth session state into Zustand on page load. Middleware switches from `studyai_session` cookie check to NextAuth's `auth()` JWT verification. All consuming components (navbar, pages) remain untouched.

**Tech Stack:** next-auth@5, @auth/drizzle-adapter, drizzle-orm, @neondatabase/serverless, drizzle-kit, bcryptjs

**说明：** 本项目使用 Next.js 16.2（App Router）+ React 19 + Zustand 5 + TypeScript 5。无测试框架，计划不含测试步骤，改为手动验证。

---

### Task 1: 安装依赖

**Files:**
- Modify: `E:\study-ai\package.json`

- [ ] **Step 1: 安装运行时依赖**

```bash
cd E:/study-ai && npm install next-auth@5 @auth/drizzle-adapter drizzle-orm @neondatabase/serverless bcryptjs
```

- [ ] **Step 2: 安装 dev 依赖**

```bash
cd E:/study-ai && npm install -D drizzle-kit @types/bcryptjs
```

- [ ] **Step 3: 验证安装**

```bash
cd E:/study-ai && node -e "console.log(require('next-auth/package.json').version)" && node -e "console.log(require('drizzle-orm/package.json').version)" && node -e "console.log(require('bcryptjs/package.json').version)"
```
Expected: 三个版本号正常打印。

- [ ] **Step 4: Commit**

```bash
cd E:/study-ai && git add package.json package-lock.json && git commit -m "chore: add auth dependencies (next-auth, drizzle, neon, bcryptjs)"
```

---

### Task 2: 创建数据库 Schema

**Files:**
- Create: `E:\study-ai\src\db\schema.ts`

- [ ] **Step 1: 创建目录和 schema 文件**

```bash
mkdir -p E:/study-ai/src/db
```

Write `E:\study-ai\src\db\schema.ts`:

```ts
import {
  pgTable,
  text,
  timestamp,
  integer,
  primaryKey,
} from "drizzle-orm/pg-core"
import type { AdapterAccountType } from "next-auth/adapters"

export const users = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name"),
  email: text("email").unique().notNull(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  hashedPassword: text("hashedPassword"),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { mode: "date" }).defaultNow().notNull(),
})

export const accounts = pgTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (table) => ({
    compoundKey: primaryKey({
      columns: [table.provider, table.providerAccountId],
    }),
  })
)

export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
})

export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (table) => ({
    compoundKey: primaryKey({
      columns: [table.identifier, table.token],
    }),
  })
)
```

- [ ] **Step 2: TypeScript 类型检查**

```bash
cd E:/study-ai && npx tsc --noEmit 2>&1 | head -20
```
Expected: `src/db/schema.ts` 无报错。（忽略其他文件的既有报错。）

- [ ] **Step 3: Commit**

```bash
cd E:/study-ai && git add src/db/schema.ts && git commit -m "feat: add Drizzle schema for auth tables (user, account, session, verificationToken)"
```

---

### Task 3: 创建数据库连接和 Drizzle Kit 配置

**Files:**
- Create: `E:\study-ai\src\db\index.ts`
- Create: `E:\study-ai\drizzle.config.ts`

- [ ] **Step 1: 创建数据库连接**

Write `E:\study-ai\src\db\index.ts`:

```ts
import { neon } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"
import * as schema from "./schema"

const sql = neon(process.env.DATABASE_URL!)
export const db = drizzle(sql, { schema })
```

- [ ] **Step 2: 创建 Drizzle Kit 配置**

Write `E:\study-ai\drizzle.config.ts`:

```ts
import type { Config } from "drizzle-kit"

export default {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config
```

- [ ] **Step 3: TypeScript 类型检查**

```bash
cd E:/study-ai && npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 4: Commit**

```bash
cd E:/study-ai && git add src/db/index.ts drizzle.config.ts && git commit -m "feat: add Neon DB connection and Drizzle Kit config"
```

---

### Task 4: 创建 NextAuth 配置

**Files:**
- Create: `E:\study-ai\src\auth.ts`

- [ ] **Step 1: 创建 NextAuth 配置**

Write `E:\study-ai\src\auth.ts`:

```ts
import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"
import { DrizzleAdapter } from "@auth/drizzle-adapter"
import { compare } from "bcryptjs"
import { eq } from "drizzle-orm"
import { db } from "@/db"
import * as schema from "@/db/schema"

const { users } = schema

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: schema.users,
    accountsTable: schema.accounts,
    sessionsTable: schema.sessions,
    verificationTokensTable: schema.verificationTokens,
  }),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
      }
      return session
    },
  },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
    Credentials({
      credentials: {
        email: { label: "邮箱", type: "email" },
        password: { label: "密码", type: "password" },
      },
      authorize: async (credentials) => {
        const email = (credentials as { email: string }).email
        const password = (credentials as { password: string }).password

        if (!email || !password) return null

        const normalizedEmail = email.toLowerCase().trim()
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, normalizedEmail))
          .limit(1)

        if (!user?.hashedPassword) return null

        const valid = await compare(password, user.hashedPassword)
        if (!valid) return null

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        }
      },
    }),
  ],
})
```

- [ ] **Step 2: TypeScript 类型检查**

```bash
cd E:/study-ai && npx tsc --noEmit 2>&1 | head -30
```
Expected: `src/auth.ts` 无新报错。

- [ ] **Step 3: Commit**

```bash
cd E:/study-ai && git add src/auth.ts && git commit -m "feat: add NextAuth v5 config with Credentials and Google providers"
```

---

### Task 5: 创建 NextAuth API 路由

**Files:**
- Create: `E:\study-ai\src\app\api\auth\[...nextauth]\route.ts`

- [ ] **Step 1: 创建路由目录和文件**

```bash
mkdir -p "E:/study-ai/src/app/api/auth/[...nextauth]"
```

Write `E:\study-ai\src\app\api\auth\[...nextauth]\route.ts`:

```ts
import { handlers } from "@/auth"

export const { GET, POST } = handlers
```

- [ ] **Step 2: 验证文件存在**

```bash
ls "E:/study-ai/src/app/api/auth/[...nextauth]/route.ts"
```

- [ ] **Step 3: Commit**

```bash
cd E:/study-ai && git add "src/app/api/auth/[...nextauth]/route.ts" && git commit -m "feat: add NextAuth API route handler"
```

---

### Task 6: 创建注册 API

**Files:**
- Create: `E:\study-ai\src\app\api\auth\register\route.ts`

- [ ] **Step 1: 创建注册 API**

Write `E:\study-ai\src\app\api\auth\register\route.ts`:

```ts
import { NextResponse } from "next/server"
import { hash } from "bcryptjs"
import { eq } from "drizzle-orm"
import { db } from "@/db"
import { users } from "@/db/schema"

export async function POST(request: Request) {
  try {
    const { name, email, password } = (await request.json()) as {
      name: string
      email: string
      password: string
    }

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "请填写所有必填字段" },
        { status: 400 }
      )
    }

    const normalizedEmail = email.toLowerCase().trim()

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return NextResponse.json(
        { error: "邮箱格式不正确" },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "密码至少需要6位" },
        { status: 400 }
      )
    }

    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1)

    if (existing) {
      return NextResponse.json(
        { error: "邮箱已注册，请直接登录" },
        { status: 409 }
      )
    }

    const hashedPassword = await hash(password, 12)
    const id = crypto.randomUUID()

    await db.insert(users).values({
      id,
      name,
      email: normalizedEmail,
      hashedPassword,
    })

    return NextResponse.json({ success: true }, { status: 201 })
  } catch {
    return NextResponse.json(
      { error: "服务暂时不可用，请稍后重试" },
      { status: 500 }
    )
  }
}
```

- [ ] **Step 2: TypeScript 类型检查**

```bash
cd E:/study-ai && npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 3: Commit**

```bash
cd E:/study-ai && git add src/app/api/auth/register/route.ts && git commit -m "feat: add registration API with validation"
```

---

### Task 7: 创建用户设置 API

**Files:**
- Create: `E:\study-ai\src\app\api\user\settings\route.ts`

- [ ] **Step 1: 创建设置 PATCH 路由**

Write `E:\study-ai\src\app\api\user\settings\route.ts`:

```ts
import { NextResponse } from "next/server"
import { auth } from "@/auth"

export async function PATCH(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 })
  }

  try {
    const body = (await request.json()) as Record<string, unknown>
    const allowed = ["theme", "notifications", "coachMode", "language", "weeklyGoalHours"]
    const settings: Record<string, unknown> = {}
    for (const key of allowed) {
      if (key in body) settings[key] = body[key]
    }

    return NextResponse.json({
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      image: session.user.image,
      settings,
    })
  } catch {
    return NextResponse.json(
      { error: "更新失败，请稍后重试" },
      { status: 500 }
    )
  }
}
```

- [ ] **Step 2: TypeScript 类型检查**

```bash
cd E:/study-ai && npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 3: Commit**

```bash
cd E:/study-ai && git add src/app/api/user/settings/route.ts && git commit -m "feat: add user settings PATCH endpoint"
```

---

### Task 8: 创建客户端 auth 封装和真实 auth service

**Files:**
- Create: `E:\study-ai\src\auth\client.ts`
- Create: `E:\study-ai\src\services\auth.real.ts`

- [ ] **Step 1: 创建客户端 auth 封装**

```bash
mkdir -p E:/study-ai/src/auth
```

Write `E:\study-ai\src\auth\client.ts`:

```ts
import { getSession, signIn as nextAuthSignIn, signOut as nextAuthSignOut } from "next-auth/react"
import type { User, UserSettings } from "@/types/user"

export function mapSessionToUser(
  session: { user?: { id?: string; email?: string | null; name?: string | null; image?: string | null } } | null
): User | null {
  if (!session?.user) return null
  return {
    id: session.user.id ?? "",
    email: session.user.email ?? "",
    name: session.user.name ?? "",
    avatarUrl: session.user.image ?? "",
    createdAt: "",
    settings: {
      theme: "dark",
      notifications: true,
      coachMode: "active",
      language: "zh-CN",
      weeklyGoalHours: 20,
    },
  }
}

export async function clientSignInCredentials(email: string, password: string) {
  const result = await nextAuthSignIn("credentials", {
    email,
    password,
    redirect: false,
  })
  if (result?.error) {
    throw new Error(result.error === "CredentialsSignin" ? "邮箱或密码错误" : result.error)
  }
  return result
}

export async function clientSignInGoogle() {
  await nextAuthSignIn("google", { callbackUrl: "/chat" })
}

export async function clientSignOut() {
  await nextAuthSignOut({ redirect: false })
}

export async function clientGetSessionUser(): Promise<User | null> {
  const session = await getSession()
  return mapSessionToUser(session)
}

export async function clientRegisterAndSignIn(
  email: string, password: string, name: string
): Promise<User> {
  const res = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  })

  const data = await res.json()
  if (!res.ok) throw new Error(data.error || "注册失败")

  await clientSignInCredentials(email, password)

  const user = await clientGetSessionUser()
  if (!user) throw new Error("注册成功但获取用户信息失败")
  return user
}

export async function clientUpdateSettings(
  settings: Partial<UserSettings>
): Promise<User> {
  const res = await fetch("/api/user/settings", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(settings),
  })

  if (!res.ok) {
    const data = await res.json()
    throw new Error(data.error || "更新设置失败")
  }

  const data = await res.json()
  return {
    id: data.id,
    email: data.email ?? "",
    name: data.name ?? "",
    avatarUrl: data.image ?? "",
    createdAt: data.createdAt ?? "",
    settings: {
      theme: data.settings?.theme ?? "dark",
      notifications: data.settings?.notifications ?? true,
      coachMode: data.settings?.coachMode ?? "active",
      language: data.settings?.language ?? "zh-CN",
      weeklyGoalHours: data.settings?.weeklyGoalHours ?? 20,
    },
  }
}
```

- [ ] **Step 2: 创建真实 auth service**

Write `E:\study-ai\src\services\auth.real.ts`:

```ts
import type { AuthService } from "./types"
import type { User, UserSettings } from "@/types/user"
import {
  clientSignInCredentials,
  clientSignInGoogle,
  clientSignOut,
  clientGetSessionUser,
  clientRegisterAndSignIn,
  clientUpdateSettings,
} from "@/auth/client"

export const realAuthService: AuthService = {
  async login(email: string, password: string): Promise<User> {
    await clientSignInCredentials(email, password)
    const user = await clientGetSessionUser()
    if (!user) throw new Error("登录失败，无法获取用户信息")
    return user
  },

  async loginWithGoogle(): Promise<User> {
    await clientSignInGoogle()
    throw new Error("redirecting")
  },

  async register(email: string, password: string, name: string): Promise<User> {
    return clientRegisterAndSignIn(email, password, name)
  },

  async logout(): Promise<void> {
    await clientSignOut()
  },

  async getCurrentUser(): Promise<User | null> {
    return clientGetSessionUser()
  },

  async updateSettings(settings: Partial<UserSettings>): Promise<User> {
    return clientUpdateSettings(settings)
  },
}
```

- [ ] **Step 3: TypeScript 类型检查**

```bash
cd E:/study-ai && npx tsc --noEmit 2>&1 | head -30
```
Expected: `src/auth/client.ts` 和 `src/services/auth.real.ts` 无新报错。

- [ ] **Step 4: Commit**

```bash
cd E:/study-ai && git add src/auth/client.ts src/services/auth.real.ts && git commit -m "feat: add real auth service wrapping NextAuth client APIs"
```

---

### Task 9: 创建 SessionProvider 和 AuthWatcher

**Files:**
- Create: `E:\study-ai\src\components\shared\session-provider.tsx`
- Create: `E:\study-ai\src\components\shared\auth-watcher.tsx`
- Modify: `E:\study-ai\src\app\layout.tsx`

- [ ] **Step 1: 创建 AuthWatcher**

Write `E:\study-ai\src\components\shared\auth-watcher.tsx`:

```tsx
"use client"

import { useEffect } from "react"
import { useSession } from "next-auth/react"
import { useAuthStore } from "@/stores/auth-store"
import { mapSessionToUser } from "@/auth/client"

export function AuthWatcher() {
  const { data: session, status } = useSession()
  const setUser = useAuthStore((s) => s.setUser)

  useEffect(() => {
    if (status === "loading") return
    if (session) {
      const user = mapSessionToUser(session)
      if (user) setUser(user)
    } else {
      setUser(null)
    }
  }, [session, status, setUser])

  return null
}
```

- [ ] **Step 2: 创建 SessionProvider**

Write `E:\study-ai\src\components\shared\session-provider.tsx`:

```tsx
"use client"

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react"
import { AuthWatcher } from "./auth-watcher"

export function SessionProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextAuthSessionProvider>
      <AuthWatcher />
      {children}
    </NextAuthSessionProvider>
  )
}
```

- [ ] **Step 3: 修改根 layout 包裹 SessionProvider**

Read `E:\study-ai\src\app\layout.tsx` first. Add import at top:

```tsx
import { SessionProvider } from "@/components/shared/session-provider"
```

Find `<body>` 内的 `{children}` 并包裹：

Before:
```tsx
<body className={...}>
  ...
  {children}
  ...
</body>
```

After:
```tsx
<body className={...}>
  ...
  <SessionProvider>
    {children}
  </SessionProvider>
  ...
</body>
```

- [ ] **Step 4: TypeScript 类型检查**

```bash
cd E:/study-ai && npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 5: Commit**

```bash
cd E:/study-ai && git add src/components/shared/session-provider.tsx src/components/shared/auth-watcher.tsx src/app/layout.tsx && git commit -m "feat: add SessionProvider and AuthWatcher to sync NextAuth session with Zustand"
```

---

### Task 10: 更新 Auth Store 使用真实服务

**Files:**
- Modify: `E:\study-ai\src\stores\auth-store.ts`

- [ ] **Step 1: 切换导入和引用**

Read `E:\study-ai\src\stores\auth-store.ts`。

将第 3 行从：
```ts
import { mockAuthService } from "@/services/auth.mock"
```
改为：
```ts
import { realAuthService } from "@/services/auth.real"
```

将所有 6 处 `mockAuthService` 替换为 `realAuthService`：
- 第 23 行: `const user = await realAuthService.login(email, password)`
- 第 28 行: `const user = await realAuthService.loginWithGoogle()`
- 第 33 行: `const user = await realAuthService.register(email, password, name)`
- 第 38 行: `await realAuthService.logout()`
- 第 44 行: `const user = await realAuthService.getCurrentUser()`
- 第 52 行: `const user = await realAuthService.updateSettings(settings)`

在 `AuthState` 接口中添加 `setUser` 方法（供 AuthWatcher 使用）：

```ts
setUser: (user: User | null) => void
```

在 store 的 `create` 回调中添加实现：

```ts
setUser: (user) => {
  set({ user, isAuthenticated: !!user, isLoading: false })
},
```

- [ ] **Step 2: TypeScript 类型检查**

```bash
cd E:/study-ai && npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 3: Commit**

```bash
cd E:/study-ai && git add src/stores/auth-store.ts && git commit -m "refactor: switch auth store from mock to real NextAuth service"
```

---

### Task 11: 更新中间件使用 NextAuth JWT 验证

**Files:**
- Modify: `E:\study-ai\src\proxy.ts`

- [ ] **Step 1: 重写中间件**

Read `E:\study-ai\src\proxy.ts`，然后覆盖为：

```ts
import { auth } from "@/auth"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const publicRoutes = ["/", "/login"]
const staticPattern = /\.(svg|png|jpg|jpeg|gif|ico|json|xml|txt|html|webmanifest)$/
const ZH_REGIONS = new Set(["CN", "HK", "TW", "SG", "MO"])

function ensureLanguageCookie(request: NextRequest, response: NextResponse): NextResponse {
  if (!request.cookies.get("studyai-language")) {
    const country = request.headers.get("x-vercel-ip-country") ?? ""
    const lang = ZH_REGIONS.has(country) ? "zh-CN" : "en"
    response.cookies.set("studyai-language", lang, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    })
  }
  return response
}

export default auth(function middleware(
  request: NextRequest & { auth?: { user?: { id?: string } } | null }
) {
  const { pathname } = request.nextUrl

  let response = NextResponse.next()
  response = ensureLanguageCookie(request, response)

  if (staticPattern.test(pathname) || pathname.startsWith("/_next")) {
    return response
  }

  if (pathname.startsWith("/api/")) {
    return response
  }

  if (publicRoutes.includes(pathname)) {
    return response
  }

  if (!request.auth) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("redirect", pathname)
    const redirect = NextResponse.redirect(loginUrl)
    const langCookie = request.cookies.get("studyai-language")?.value ?? "en"
    redirect.cookies.set("studyai-language", langCookie, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    })
    return redirect
  }

  return response
})

export const config = {
  matcher: ["/((?!_next|api/auth|favicon.ico).*)"],
}
```

- [ ] **Step 2: TypeScript 类型检查**

```bash
cd E:/study-ai && npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 3: Commit**

```bash
cd E:/study-ai && git add src/proxy.ts && git commit -m "refactor: switch middleware from session cookie to NextAuth JWT auth()"
```

---

### Task 12: 登录页面添加客户端密码校验

**Files:**
- Modify: `E:\study-ai\src\app\login\page.tsx`

- [ ] **Step 1: 添加密码长度校验**

Read `E:\study-ai\src\app\login\page.tsx`。在 `handleSubmit` 函数中，`setError("")` 之后、`setLoading(true)` 之前添加：

```ts
if (password.length < 6) {
  setError("密码至少需要6位")
  return
}
```

修改后的 `handleSubmit` 完整代码：

```ts
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  setError("")

  if (password.length < 6) {
    setError("密码至少需要6位")
    return
  }

  setLoading(true)

  try {
    if (mode === "login") {
      await login(email, password)
    } else {
      await register(email, password, name)
    }
    router.push("/chat")
  } catch (err) {
    setError(err instanceof Error ? err.message : t("login.loginFailed"))
  } finally {
    setLoading(false)
  }
}
```

- [ ] **Step 2: 确认无 mock 引用**

```bash
grep -n "mock\|auth\.mock\|mockAuthService" "E:/study-ai/src/app/login/page.tsx"
```
Expected: 无输出。

- [ ] **Step 3: Commit**

```bash
cd E:/study-ai && git add src/app/login/page.tsx && git commit -m "feat: add client-side password length validation to login page"
```

---

### Task 13: 添加环境变量

**Files:**
- Modify: `E:\study-ai\.env.local`
- Modify: `E:\study-ai\.env.example` (如果存在)

- [ ] **Step 1: 更新 .env.local**

Read `E:\study-ai\.env.local`，在末尾追加：

```env
# NextAuth
AUTH_SECRET=study-ai-dev-secret-change-in-production-1234567890
AUTH_URL=http://localhost:3000

# Google OAuth (开发环境占位符)
AUTH_GOOGLE_ID=placeholder-client-id
AUTH_GOOGLE_SECRET=placeholder-client-secret

# Neon Postgres (占位符 — 需要替换为真实连接字符串)
DATABASE_URL=postgresql://user:pass@ep-example.us-east-2.aws.neon.tech/studyai?sslmode=require
```

- [ ] **Step 2: 同步更新 .env.example**

```bash
cat "E:/study-ai/.env.example" 2>/dev/null || echo "NO_ENV_EXAMPLE"
```

如果存在，将 Step 1 中同样的 key（值留空）追加到 `.env.example`。

- [ ] **Step 3: Commit**

```bash
cd E:/study-ai && git add .env.local .env.example 2>/dev/null; git commit -m "chore: add auth and database env variables" || echo "nothing to commit"
```

---

### Task 14: 删除 Mock Auth Service

**Files:**
- Delete: `E:\study-ai\src\services\auth.mock.ts`

- [ ] **Step 1: 确认无残留引用**

```bash
grep -r "auth\.mock\|mockAuthService" "E:/study-ai/src/" --include="*.ts" --include="*.tsx"
```
Expected: 无输出。

- [ ] **Step 2: 删除文件**

```bash
rm "E:/study-ai/src/services/auth.mock.ts"
```

- [ ] **Step 3: 全量 TypeScript 检查**

```bash
cd E:/study-ai && npx tsc --noEmit 2>&1 | tail -20
```
Expected: auth 相关文件无报错。

- [ ] **Step 4: Commit**

```bash
cd E:/study-ai && git add src/services/auth.mock.ts && git commit -m "refactor: remove mock auth service, fully replaced by NextAuth"
```

---

### Task 15: 构建验证

**Files:**
- 无（仅验证）

- [ ] **Step 1: 生产构建**

```bash
cd E:/study-ai && npm run build 2>&1
```
Expected: 构建成功。

- [ ] **Step 2: 确认所有新文件存在**

```bash
ls E:/study-ai/src/auth.ts E:/study-ai/src/auth/client.ts E:/study-ai/src/db/schema.ts E:/study-ai/src/db/index.ts E:/study-ai/drizzle.config.ts E:/study-ai/src/services/auth.real.ts E:/study-ai/src/components/shared/session-provider.tsx E:/study-ai/src/components/shared/auth-watcher.tsx "E:/study-ai/src/app/api/auth/[...nextauth]/route.ts" E:/study-ai/src/app/api/auth/register/route.ts "E:/study-ai/src/app/api/user/settings/route.ts"
```
Expected: 全部 11 个文件存在。

- [ ] **Step 3: 检查 git status**

```bash
cd E:/study-ai && git status
```
如有未提交的更改，审查并提交。

---

## 部署步骤（实施完成后手动执行）

1. **生成 AUTH_SECRET**: 运行 `npx auth secret` → 将输出设置到 Vercel 环境变量
2. **创建 Neon 数据库**: neon.tech → 创建项目 → 复制连接字符串 → 设置 `DATABASE_URL` 到 Vercel
3. **推送数据库 Schema**: 配置好 `DATABASE_URL` 后运行 `npx drizzle-kit push`
4. **创建 Google OAuth 应用**: Google Cloud Console → OAuth 同意屏幕 → 凭据 → 设置 `AUTH_GOOGLE_ID` 和 `AUTH_GOOGLE_SECRET` 到 Vercel
5. **设置 AUTH_URL**: 设置为 `https://<your-domain>.vercel.app` 到 Vercel 环境变量
6. **更新本地 .env.local**: 将占位符值替换为真实的开发数据库凭据
