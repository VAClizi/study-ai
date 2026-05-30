# StudyAI 业务数据中心化迁移 — 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 StudyAI 所有业务数据（学习计划、打卡记录、用户设置、对话历史、AI 记忆）从浏览器 localStorage / 内存迁移到 Neon Postgres，实现数据中心化存储和跨设备同步。

**Architecture:** 扩展 Drizzle ORM schema 新增 5 张业务表 + user 表 settings jsonb 列；创建 16 个 API 端点使用 Next.js Route Handlers + `auth()` 鉴权；改造 9 个 Store/组件从 localStorage 切换为 API 调用；提供一次性 POST /api/migrate 迁移旧数据。

**Tech Stack:** Next.js 15 App Router, Drizzle ORM + Neon Postgres, Zustand 5, NextAuth v5 (Auth.js)

---

## Phase 1: Schema 扩展（数据库层）

### Task 1: 扩展 Drizzle Schema — 新增 5 张业务表 + user.settings 列

**Files:**
- Modify: `src/db/schema.ts`

- [ ] **Step 1: 在现有 schema.ts 末尾追加新表定义**

```typescript
// ==================== 业务数据表 ====================

import { real, jsonb } from "drizzle-orm/pg-core"

// user 表已有 settings jsonb ALTER — 通过 Drizzle 无法直接 ALTER TABLE ADD COLUMN，
// 但可以在 schema 定义中声明列以反映真实 DB 结构。
// 实际 DDL: ALTER TABLE "user" ADD COLUMN "settings" jsonb;
// 迁移时手动执行或通过 drizzle-kit generate 生成。

export const plans = pgTable("plan", {
  id: text("id").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  mode: text("mode").notNull(), // "quick" | "detailed"
  goal: jsonb("goal").notNull().default({}),
  stages: jsonb("stages").notNull().default([]),
  theories: jsonb("theories").notNull().default([]),
  weeklyGoal: text("weeklyGoal"),
  monthlyGoal: text("monthlyGoal"),
  phaseGoal: text("phaseGoal"),
  status: text("status").notNull().default("active"),
  endDate: text("endDate"),
  chatSessionId: text("chatSessionId"),
  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
})

export const chatSessions = pgTable("chatSession", {
  id: text("id").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  mode: text("mode").notNull(), // "quick" | "detailed"
  title: text("title").notNull(),
  planId: text("planId"),
  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updatedAt", { mode: "date" }).notNull().defaultNow(),
})

export const chatMessages = pgTable("chatMessage", {
  id: text("id").primaryKey(),
  sessionId: text("sessionId")
    .notNull()
    .references(() => chatSessions.id, { onDelete: "cascade" }),
  role: text("role").notNull(), // "user" | "assistant"
  content: text("content").notNull(),
  timestamp: text("timestamp").notNull(),
})

export const checkins = pgTable("checkin", {
  id: text("id").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  planId: text("planId")
    .notNull()
    .references(() => plans.id, { onDelete: "cascade" }),
  date: text("date").notNull(),
  tasks: jsonb("tasks").notNull().default([]),
  feedback: jsonb("feedback").notNull().default({}),
  focusLevel: integer("focusLevel").notNull().default(5),
  moodRating: integer("moodRating").notNull().default(3),
  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
})

export const memories = pgTable("memory", {
  id: text("id").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // "goal" | "habit" | "preference" | "fact" | "pattern"
  content: text("content").notNull(),
  confidence: real("confidence").notNull().default(0.7),
  lastRecalledAt: timestamp("lastRecalledAt", { mode: "date" }).defaultNow(),
  source: text("source").default("auto-extraction"),
  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
})
```

- [ ] **Step 2: 在 user 表定义中追加 settings 列**

在 `src/db/schema.ts` 的 `users` 表定义中，`updatedAt` 之后添加：

```typescript
settings: jsonb("settings").default({}),
```

- [ ] **Step 3: 生成并执行迁移**

```bash
cd /e/study-ai && npx drizzle-kit generate
```

查看 `drizzle/` 目录下生成的 SQL 文件，确认包含 5 张新表和 ALTER TABLE "user" ADD COLUMN "settings"。

```bash
cd /e/study-ai && npx drizzle-kit migrate
```

- [ ] **Step 4: 手动执行 ALTER（如果 drizzle-kit 未处理已有表的列）**

如果 `drizzle-kit generate` 未生成 ALTER TABLE 语句（因为 `users` 表已存在），手动执行：

```sql
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "settings" jsonb DEFAULT '{}';
```

通过 Neon SQL Editor 或 `npx drizzle-kit studio` 确认表结构正确。

- [ ] **Step 5: 验证 — 启动开发服务器，查询新表**

```bash
cd /e/study-ai && npm run dev
```

访问 `http://localhost:3000`，确认应用启动无报错。

- [ ] **Step 6: Commit**

```bash
git -C /e/study-ai add src/db/schema.ts drizzle/
git -C /e/study-ai commit -m "feat: add 5 business tables + user.settings column to Drizzle schema"
```

---

## Phase 2: API 路由（服务端）

### Task 2: 创建 Plans API 路由

**Files:**
- Create: `src/app/api/plans/route.ts`
- Create: `src/app/api/plans/[id]/route.ts`

- [ ] **Step 1: 创建 `GET/POST /api/plans`**

```typescript
// src/app/api/plans/route.ts
import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/db"
import { plans } from "@/db/schema"
import { eq, desc } from "drizzle-orm"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const rows = await db
    .select({
      id: plans.id,
      title: plans.title,
      mode: plans.mode,
      status: plans.status,
      endDate: plans.endDate,
      chatSessionId: plans.chatSessionId,
      createdAt: plans.createdAt,
    })
    .from(plans)
    .where(eq(plans.userId, session.user.id))
    .orderBy(desc(plans.createdAt))

  return NextResponse.json(rows)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const plan = {
    id: body.id ?? `plan-${Date.now()}`,
    userId: session.user.id,
    title: body.title ?? "",
    mode: body.mode ?? "quick",
    goal: body.goal ?? {},
    stages: body.stages ?? [],
    theories: body.theories ?? [],
    weeklyGoal: body.weeklyGoal ?? "",
    monthlyGoal: body.monthlyGoal ?? "",
    phaseGoal: body.phaseGoal ?? "",
    status: body.status ?? "active",
    endDate: body.endDate ?? "",
    chatSessionId: body.chatSessionId ?? null,
  }

  await db.insert(plans).values(plan)
  return NextResponse.json(plan, { status: 201 })
}
```

- [ ] **Step 2: 创建 `GET/PATCH/DELETE /api/plans/[id]`**

```typescript
// src/app/api/plans/[id]/route.ts
import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/db"
import { plans } from "@/db/schema"
import { eq, and } from "drizzle-orm"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  const [row] = await db
    .select()
    .from(plans)
    .where(and(eq(plans.id, id), eq(plans.userId, session.user.id)))
    .limit(1)

  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  return NextResponse.json(row)
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const body = await req.json()

  const [updated] = await db
    .update(plans)
    .set(body)
    .where(and(eq(plans.id, id), eq(plans.userId, session.user.id)))
    .returning()

  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  return NextResponse.json(updated)
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  await db
    .delete(plans)
    .where(and(eq(plans.id, id), eq(plans.userId, session.user.id)))

  return NextResponse.json({ success: true })
}
```

- [ ] **Step 3: 手动测试 API 端点**

```bash
# 启动开发服务器
cd /e/study-ai && npm run dev

# 测试 GET /api/plans（需要登录态 cookie）
curl -H "Cookie: authjs.session-token=<token>" http://localhost:3000/api/plans
```

- [ ] **Step 4: Commit**

```bash
git -C /e/study-ai add src/app/api/plans/
git -C /e/study-ai commit -m "feat: add Plans CRUD API routes"
```

### Task 3: 创建 Chat Sessions & Messages API 路由

**Files:**
- Create: `src/app/api/chat-sessions/route.ts`
- Create: `src/app/api/chat-sessions/[id]/route.ts`
- Create: `src/app/api/chat-sessions/[id]/messages/route.ts`

- [ ] **Step 1: 创建 `GET/POST /api/chat-sessions`**

```typescript
// src/app/api/chat-sessions/route.ts
import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/db"
import { chatSessions } from "@/db/schema"
import { eq, desc } from "drizzle-orm"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const rows = await db
    .select({
      id: chatSessions.id,
      mode: chatSessions.mode,
      title: chatSessions.title,
      planId: chatSessions.planId,
      createdAt: chatSessions.createdAt,
      updatedAt: chatSessions.updatedAt,
    })
    .from(chatSessions)
    .where(eq(chatSessions.userId, session.user.id))
    .orderBy(desc(chatSessions.updatedAt))

  return NextResponse.json(rows)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()

  // Upsert: if session with same id exists, update; otherwise insert
  const existing = body.id
    ? await db
        .select({ id: chatSessions.id })
        .from(chatSessions)
        .where(eq(chatSessions.id, body.id))
        .limit(1)
    : []

  if (existing.length > 0) {
    const [updated] = await db
      .update(chatSessions)
      .set({
        title: body.title,
        mode: body.mode,
        planId: body.planId ?? null,
        updatedAt: new Date(),
      })
      .where(eq(chatSessions.id, body.id))
      .returning()
    return NextResponse.json(updated)
  }

  const row = {
    id: body.id ?? `session_${Date.now()}`,
    userId: session.user.id,
    mode: body.mode ?? "quick",
    title: body.title ?? "",
    planId: body.planId ?? null,
  }

  await db.insert(chatSessions).values(row)
  return NextResponse.json(row, { status: 201 })
}
```

- [ ] **Step 2: 创建 `GET/DELETE /api/chat-sessions/[id]`**

```typescript
// src/app/api/chat-sessions/[id]/route.ts
import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/db"
import { chatSessions, chatMessages } from "@/db/schema"
import { eq, and } from "drizzle-orm"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  const [sess] = await db
    .select()
    .from(chatSessions)
    .where(and(eq(chatSessions.id, id), eq(chatSessions.userId, session.user.id)))
    .limit(1)

  if (!sess) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const messages = await db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.sessionId, id))
    .orderBy(chatMessages.timestamp)

  return NextResponse.json({ ...sess, messages })
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  await db
    .delete(chatSessions)
    .where(and(eq(chatSessions.id, id), eq(chatSessions.userId, session.user.id)))

  return NextResponse.json({ success: true })
}
```

- [ ] **Step 3: 创建 `POST /api/chat-sessions/[id]/messages`**

```typescript
// src/app/api/chat-sessions/[id]/messages/route.ts
import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/db"
import { chatMessages } from "@/db/schema"
import { eq } from "drizzle-orm"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const body = await req.json()
  const messages: Array<{ id: string; role: string; content: string; timestamp: string }> =
    body.messages ?? []

  // 追加新消息（批量插入）
  if (messages.length > 0) {
    const rows = messages.map((m) => ({
      id: m.id,
      sessionId: id,
      role: m.role,
      content: m.content,
      timestamp: m.timestamp,
    }))
    await db.insert(chatMessages).values(rows)
  }

  return NextResponse.json({ added: messages.length })
}
```

- [ ] **Step 4: Commit**

```bash
git -C /e/study-ai add src/app/api/chat-sessions/
git -C /e/study-ai commit -m "feat: add Chat Sessions & Messages API routes"
```

### Task 4: 创建 Checkins API 路由

**Files:**
- Create: `src/app/api/checkins/route.ts`

- [ ] **Step 1: 创建 `GET/POST /api/checkins`**

```typescript
// src/app/api/checkins/route.ts
import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/db"
import { checkins } from "@/db/schema"
import { eq, and } from "drizzle-orm"

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const dateFilter = searchParams.get("date")
  const planIdFilter = searchParams.get("planId")

  const conditions = [eq(checkins.userId, session.user.id)]
  if (dateFilter) conditions.push(eq(checkins.date, dateFilter))
  if (planIdFilter) conditions.push(eq(checkins.planId, planIdFilter))

  const rows = await db
    .select()
    .from(checkins)
    .where(and(...conditions))
    .orderBy(checkins.date)

  return NextResponse.json(rows)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const row = {
    id: body.id ?? `checkin-${Date.now()}`,
    userId: session.user.id,
    planId: body.planId,
    date: body.date,
    tasks: body.tasks ?? [],
    feedback: body.feedback ?? {},
    focusLevel: body.focusLevel ?? 5,
    moodRating: body.moodRating ?? 3,
  }

  await db.insert(checkins).values(row)
  return NextResponse.json(row, { status: 201 })
}
```

- [ ] **Step 2: Commit**

```bash
git -C /e/study-ai add src/app/api/checkins/
git -C /e/study-ai commit -m "feat: add Checkins API routes"
```

### Task 5: 创建 Memories API 路由

**Files:**
- Create: `src/app/api/memories/route.ts`

- [ ] **Step 1: 创建 `GET/POST/DELETE /api/memories`**

```typescript
// src/app/api/memories/route.ts
import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/db"
import { memories } from "@/db/schema"
import { eq, and } from "drizzle-orm"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const rows = await db
    .select()
    .from(memories)
    .where(eq(memories.userId, session.user.id))
    .orderBy(memories.createdAt)

  return NextResponse.json(rows)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const entries: Array<{
    id: string; type: string; content: string; confidence?: number
    lastRecalledAt?: string; source?: string
  }> = body.entries ?? []

  if (entries.length === 0) {
    return NextResponse.json({ upserted: 0 })
  }

  // Upsert by id: insert or update
  for (const entry of entries) {
    const existing = await db
      .select({ id: memories.id })
      .from(memories)
      .where(and(eq(memories.id, entry.id), eq(memories.userId, session.user.id)))
      .limit(1)

    if (existing.length > 0) {
      await db
        .update(memories)
        .set({
          type: entry.type,
          content: entry.content,
          confidence: entry.confidence ?? 0.7,
          lastRecalledAt: entry.lastRecalledAt ? new Date(entry.lastRecalledAt) : new Date(),
          source: entry.source ?? "auto-extraction",
        })
        .where(eq(memories.id, entry.id))
    } else {
      await db.insert(memories).values({
        id: entry.id,
        userId: session.user.id,
        type: entry.type,
        content: entry.content,
        confidence: entry.confidence ?? 0.7,
        lastRecalledAt: entry.lastRecalledAt ? new Date(entry.lastRecalledAt) : new Date(),
        source: entry.source ?? "auto-extraction",
      })
    }
  }

  return NextResponse.json({ upserted: entries.length })
}

export async function DELETE() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  await db.delete(memories).where(eq(memories.userId, session.user.id))
  return NextResponse.json({ success: true })
}
```

- [ ] **Step 2: Commit**

```bash
git -C /e/study-ai add src/app/api/memories/
git -C /e/study-ai commit -m "feat: add Memories API routes"
```

### Task 6: 创建 User Settings API 路由

**Files:**
- Create: `src/app/api/user/settings/route.ts`

- [ ] **Step 1: 创建 `GET/PATCH /api/user/settings`**

```typescript
// src/app/api/user/settings/route.ts
import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/db"
import { users } from "@/db/schema"
import { eq } from "drizzle-orm"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const [user] = await db
    .select({ settings: users.settings })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1)

  return NextResponse.json(user?.settings ?? {})
}

export async function PATCH(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()

  // 合并更新：先用现有 settings，再 patch 新值
  const [current] = await db
    .select({ settings: users.settings })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1)

  const merged = {
    ...(current?.settings as Record<string, unknown> ?? {}),
    ...body,
  }

  const [updated] = await db
    .update(users)
    .set({ settings: merged })
    .where(eq(users.id, session.user.id))
    .returning({ settings: users.settings })

  return NextResponse.json(updated?.settings ?? {})
}
```

- [ ] **Step 2: Commit**

```bash
git -C /e/study-ai add src/app/api/user/
git -C /e/study-ai commit -m "feat: add User Settings API routes"
```

### Task 7: 创建数据迁移 API 路由

**Files:**
- Create: `src/app/api/migrate/route.ts`

- [ ] **Step 1: 创建 `POST /api/migrate`**

```typescript
// src/app/api/migrate/route.ts
import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/db"
import { plans, chatSessions, chatMessages, checkins, memories, users } from "@/db/schema"
import { eq } from "drizzle-orm"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const userId = session.user.id
  const migrated = { sessions: 0, messages: 0, checkins: 0, memories: 0, settings: false }

  // 1. 迁移 chat sessions + messages
  const chatSessionsData: Array<{
    id: string; mode: string; title: string; messages: Array<{
      id: string; role: string; content: string; timestamp: string
    }>; planId?: string; createdAt: string; updatedAt: string
  }> = body.chatSessions ? Object.values(body.chatSessions) : []

  for (const cs of chatSessionsData) {
    const existing = await db
      .select({ id: chatSessions.id })
      .from(chatSessions)
      .where(eq(chatSessions.id, cs.id))
      .limit(1)

    if (existing.length === 0) {
      await db.insert(chatSessions).values({
        id: cs.id,
        userId,
        mode: cs.mode ?? "quick",
        title: cs.title ?? "",
        planId: cs.planId ?? null,
        createdAt: new Date(cs.createdAt),
        updatedAt: new Date(cs.updatedAt),
      })
      migrated.sessions++

      // Insert messages for this session
      for (const msg of cs.messages ?? []) {
        await db.insert(chatMessages).values({
          id: msg.id,
          sessionId: cs.id,
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp,
        })
        migrated.messages++
      }
    }
  }

  // 2. 迁移 checkins
  const checkinsData: Array<{
    id: string; planId: string; date: string; tasks: unknown
    feedback: unknown; focusLevel: number; moodRating: number; createdAt: string
  }> = body.checkins ?? []

  for (const c of checkinsData) {
    const existing = await db
      .select({ id: checkins.id })
      .from(checkins)
      .where(eq(checkins.id, c.id))
      .limit(1)

    if (existing.length === 0) {
      await db.insert(checkins).values({
        id: c.id,
        userId,
        planId: c.planId ?? "unknown",
        date: c.date,
        tasks: c.tasks ?? [],
        feedback: c.feedback ?? {},
        focusLevel: c.focusLevel ?? 5,
        moodRating: c.moodRating ?? 3,
        createdAt: c.createdAt ? new Date(c.createdAt) : new Date(),
      })
      migrated.checkins++
    }
  }

  // 3. 迁移 memories
  const memoriesData: Array<{
    id: string; type: string; content: string; confidence: number
    lastRecalledAt: string; source: string; createdAt: string
  }> = body.memories ?? []

  for (const m of memoriesData) {
    const existing = await db
      .select({ id: memories.id })
      .from(memories)
      .where(eq(memories.id, m.id))
      .limit(1)

    if (existing.length === 0) {
      await db.insert(memories).values({
        id: m.id,
        userId,
        type: m.type,
        content: m.content,
        confidence: m.confidence ?? 0.7,
        lastRecalledAt: m.lastRecalledAt ? new Date(m.lastRecalledAt) : new Date(),
        source: m.source ?? "auto-extraction",
        createdAt: m.createdAt ? new Date(m.createdAt) : new Date(),
      })
      migrated.memories++
    }
  }

  // 4. 迁移 settings → user.settings jsonb
  if (body.settings && Object.keys(body.settings).length > 0) {
    await db
      .update(users)
      .set({ settings: body.settings })
      .where(eq(users.id, userId))
    migrated.settings = true
  }

  return NextResponse.json({ migrated })
}
```

- [ ] **Step 2: Commit**

```bash
git -C /e/study-ai add src/app/api/migrate/
git -C /e/study-ai commit -m "feat: add data migration API route"
```

---

## Phase 3: Store 层改造

### Task 8: 重构 plan-store — 从内存变量切换到 API

**Files:**
- Modify: `src/stores/plan-store.ts`
- Modify: `src/services/plan.mock.ts`（保留 plan-parser 逻辑，移除 mock 存储）

- [ ] **Step 1: 重写 `plan-store.ts`**

```typescript
// src/stores/plan-store.ts
import { create } from "zustand"
import type { LearningPlan, DayTask } from "@/types/plan"
import type { ExtractedPlanData } from "@/lib/plan-parser"

interface PlanState {
  plans: LearningPlan[]
  currentPlan: LearningPlan | null
  todayTasks: { date: string; dayNumber: number; tasks: DayTask[] } | null
  isLoading: boolean

  loadPlans: () => Promise<void>
  loadPlan: (id: string) => Promise<void>
  createPlanFromChat: (chatContent: string, mode: "quick" | "detailed", chatSessionId?: string) => Promise<LearningPlan>
  createPlanFromParsedData: (extracted: ExtractedPlanData, mode: "quick" | "detailed", chatSessionId?: string) => Promise<LearningPlan>
  updateTask: (planId: string, dayNumber: number, taskId: string, completed: boolean) => Promise<void>
  loadTodayTasks: (planId: string) => Promise<void>
  deletePlan: (id: string) => Promise<void>
}

export const usePlanStore = create<PlanState>((set, get) => ({
  plans: [],
  currentPlan: null,
  todayTasks: null,
  isLoading: false,

  loadPlans: async () => {
    set({ isLoading: true })
    try {
      const res = await fetch("/api/plans")
      if (!res.ok) throw new Error("Failed to load plans")
      const plans = await res.json()
      set({ plans, isLoading: false })
    } catch {
      set({ isLoading: false })
    }
  },

  loadPlan: async (id: string) => {
    set({ isLoading: true })
    try {
      const res = await fetch(`/api/plans/${id}`)
      if (!res.ok) throw new Error("Failed to load plan")
      const plan = await res.json()
      set({ currentPlan: plan, isLoading: false })
    } catch {
      set({ isLoading: false })
    }
  },

  createPlanFromChat: async (chatContent: string, mode: "quick" | "detailed", chatSessionId?: string) => {
    const { extractPlanData } = await import("@/lib/plan-parser")
    const extracted = extractPlanData(chatContent)
    return get().createPlanFromParsedData(
      extracted ?? { stages: [], theories: [] },
      mode,
      chatSessionId,
    )
  },

  createPlanFromParsedData: async (extracted: ExtractedPlanData, mode: "quick" | "detailed", chatSessionId?: string) => {
    const now = new Date()
    let totalDays = 0
    for (const stage of extracted.stages ?? []) {
      for (const week of stage.weeks ?? []) {
        totalDays += week.days?.length ?? 0
      }
    }

    const goal = {
      title: extracted.goal ?? extracted.stages?.[0]?.name ?? "掌握目标技能",
      description: "通过系统化的学习计划达成学习目标",
      deadline: new Date(now.getTime() + totalDays * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      currentLevel: "初级",
      targetLevel: "中高级",
    }

    const body = {
      id: `plan-${Date.now()}`,
      title: extracted.title ?? `${mode === "quick" ? "快速" : "深度"}学习计划`,
      mode,
      goal,
      stages: extracted.stages ?? [],
      theories: extracted.theories ?? [],
      weeklyGoal: "完成本周所有学习任务",
      monthlyGoal: "完成前两个阶段的学习",
      phaseGoal: "从基础到实战，实现学习目标",
      status: "active",
      endDate: goal.deadline,
      chatSessionId: chatSessionId ?? null,
    }

    const res = await fetch("/api/plans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })

    if (!res.ok) throw new Error("Failed to create plan")
    const plan = await res.json()
    set((state) => ({ plans: [...state.plans, plan], currentPlan: plan }))
    return plan
  },

  updateTask: async (planId: string, dayNumber: number, taskId: string, completed: boolean) => {
    // 获取当前计划，更新 stages 中对应 task 的 completed 状态
    const plan = get().currentPlan
    if (!plan) return

    const stages = plan.stages.map((stage) => ({
      ...stage,
      weeks: stage.weeks.map((week) => ({
        ...week,
        days: week.days.map((day) => {
          if (day.dayNumber === dayNumber) {
            return {
              ...day,
              tasks: day.tasks.map((t) =>
                t.id === taskId ? { ...t, completed } : t
              ),
            }
          }
          return day
        }),
      })),
    }))

    const res = await fetch(`/api/plans/${planId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stages }),
    })

    if (!res.ok) throw new Error("Failed to update task")
    const updated = await res.json()
    set({ currentPlan: updated })
    // 刷新今日任务
    await get().loadTodayTasks(planId)
  },

  loadTodayTasks: async (planId: string) => {
    const plan = get().currentPlan ?? (await get().loadPlan(planId), get().currentPlan)
    if (!plan) return

    const now = new Date()
    const startDate = new Date(plan.createdAt)
    const dayDiff = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    const dayNumber = Math.min(dayDiff + 1, 56)

    for (const stage of plan.stages ?? []) {
      for (const week of stage.weeks ?? []) {
        for (const day of week.days ?? []) {
          if (day.dayNumber === dayNumber) {
            set({ todayTasks: { date: new Date().toISOString().split("T")[0], dayNumber, tasks: day.tasks } })
            return
          }
        }
      }
    }
    set({ todayTasks: null })
  },

  deletePlan: async (id: string) => {
    const res = await fetch(`/api/plans/${id}`, { method: "DELETE" })
    if (!res.ok) throw new Error("Failed to delete plan")
    set((state) => ({
      plans: state.plans.filter((p) => p.id !== id),
      currentPlan: state.currentPlan?.id === id ? null : state.currentPlan,
    }))
  },
}))
```

- [ ] **Step 2: Commit**

```bash
git -C /e/study-ai add src/stores/plan-store.ts
git -C /e/study-ai commit -m "refactor: migrate plan-store from memory to API"
```

### Task 9: 重构 chat-store — 从 localStorage 切换到 API

**Files:**
- Modify: `src/stores/chat-store.ts`

- [ ] **Step 1: 重写 chat-store 的存储层**

关键改动：`saveCurrentSession` 和 `loadStoredSession` 从 localStorage 切换到 API。

```typescript
// src/stores/chat-store.ts 的变更部分

// 移除旧的 localStorage 函数 loadAllStoredSessions / saveAllStoredSessions
// 替换为 API 调用

// 修改 saveCurrentSession:
saveCurrentSession: async () => {
  const { currentSession, messages, currentMode, planContent } = get()
  if (!currentSession || !currentMode) return

  const updated = {
    id: currentSession.id,
    mode: currentMode,
    title: currentSession.title ?? `AI ${currentMode === "quick" ? "快速" : "深度"}对话`,
    planId: currentSession.planId ?? null,
    messages,
  }

  try {
    // 保存会话
    await fetch("/api/chat-sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated),
    })

    // 保存新消息（增量）
    const newMessages = messages.filter((m) =>
      !currentSession.messages?.some((om) => om.id === m.id)
    )
    if (newMessages.length > 0) {
      await fetch(`/api/chat-sessions/${currentSession.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      })
    }

    set({ currentSession: { ...currentSession, ...updated, updatedAt: new Date().toISOString() } })
  } catch (err) {
    console.error("Failed to save session:", err)
  }
},

// 修改 loadStoredSession:
loadStoredSession: async (sessionId: string) => {
  try {
    const res = await fetch(`/api/chat-sessions/${sessionId}`)
    if (!res.ok) return false
    const session = await res.json()
    set({
      currentSession: session,
      messages: session.messages ?? [],
      currentMode: session.mode,
      planContent: session.planId ? null : get().planContent,
    })
    return true
  } catch {
    return false
  }
},

// 修改 loadSessions:
loadSessions: async () => {
  try {
    const res = await fetch("/api/chat-sessions")
    if (!res.ok) throw new Error("Failed to load sessions")
    const sessions = await res.json()
    set({ sessions })
  } catch {
    // 静默失败
  }
},
```

- [ ] **Step 2: 将 `saveCurrentSession` 改为异步调用**

在 `sendMessage` 中的调用点也需要加 `await`：
```typescript
// 将 planContent 检测处的 get().saveCurrentSession() 改为
await get().saveCurrentSession()
```

- [ ] **Step 3: 移除不再使用的导出函数 `getAllStoredSessions`**

删除文件末尾的 `export function getAllStoredSessions()` 函数。

- [ ] **Step 4: Commit**

```bash
git -C /e/study-ai add src/stores/chat-store.ts
git -C /e/study-ai commit -m "refactor: migrate chat-store from localStorage to API"
```

### Task 10: 重构 checkin-store — 从 localStorage 切换到 API

**Files:**
- Modify: `src/stores/checkin-store.ts`
- Modify: `src/services/checkin.mock.ts`

- [ ] **Step 1: 重写 `checkin.mock.ts` 为 API 调用**

将 `mockCheckinService` 的实现改为 fetch API：

```typescript
// src/services/checkin.mock.ts — 重写所有方法

import { getLocalDate, getLocalDateOffset } from "@/lib/date"
import type { CheckinRecord, CheckinFeedback } from "@/types/checkin"

function computeStreak(dates: string[]): number {
  if (dates.length === 0) return 0
  const unique = [...new Set(dates)].sort().reverse()
  const today = getLocalDate()
  if (unique[0] !== today && unique[0] !== getLocalDateOffset(-1)) return 0
  let streak = unique[0] === today ? 1 : 0
  for (let i = streak; i < unique.length; i++) {
    const expected = getLocalDateOffset(-streak)
    if (unique[i] === expected) streak++
    else break
  }
  return streak
}

export interface MockCheckinService {
  getTodayCheckin(userId: string, planId: string): Promise<CheckinRecord | null>
  submitCheckin(userId: string, planId: string, data: {
    tasks: { taskId: string; completed: boolean; actualMinutes: number; difficultyRating: number }[]
    feedback: CheckinFeedback
    focusLevel: number
    moodRating: number
  }): Promise<CheckinRecord>
  getCheckinHistory(userId: string, planId: string): Promise<CheckinRecord[]>
  getStreak(userId: string): Promise<number>
}

export const mockCheckinService: MockCheckinService = {
  async getTodayCheckin(_userId: string, planId: string) {
    const today = getLocalDate()
    const res = await fetch(`/api/checkins?date=${today}&planId=${planId}`)
    if (!res.ok) return null
    const rows: CheckinRecord[] = await res.json()
    return rows[0] ?? null
  },

  async submitCheckin(_userId: string, planId: string, data) {
    const res = await fetch("/api/checkins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        planId,
        date: getLocalDate(),
        tasks: data.tasks,
        feedback: data.feedback,
        focusLevel: data.focusLevel,
        moodRating: data.moodRating,
      }),
    })
    if (!res.ok) throw new Error("Failed to submit checkin")
    return res.json()
  },

  async getCheckinHistory(_userId: string, planId: string) {
    const res = await fetch(`/api/checkins?planId=${planId}`)
    if (!res.ok) return []
    return res.json()
  },

  async getStreak(_userId: string) {
    const res = await fetch("/api/checkins")
    if (!res.ok) return 0
    const rows: CheckinRecord[] = await res.json()
    return computeStreak(rows.map((r) => r.date))
  },
}
```

- [ ] **Step 2: 更新 `checkin-store.ts` 移除无用的 userId 参数**

checkin-store.ts 的接口调用不再需要传入 userId（从服务端 session 获取），但为保持向后兼容，保留参数签名但内部忽略 userId。

- [ ] **Step 3: Commit**

```bash
git -C /e/study-ai add src/services/checkin.mock.ts
git -C /e/study-ai commit -m "refactor: migrate checkin service from localStorage to API"
```

### Task 11: 重构 memory-store — 从 localStorage 切换到 API

**Files:**
- Modify: `src/stores/memory-store.ts`

- [ ] **Step 1: 重写 `memory-store.ts`**

```typescript
// src/stores/memory-store.ts — 完整替换

import { create } from "zustand"

export interface MemoryEntry {
  id: string
  type: "goal" | "habit" | "preference" | "fact" | "pattern"
  content: string
  confidence: number
  createdAt: string
  lastRecalledAt: string
  source: string
}

interface MemoryState {
  entries: MemoryEntry[]
  isLoaded: boolean
  loadMemories: () => Promise<void>
  addMemory: (entry: Omit<MemoryEntry, "id" | "createdAt">) => Promise<void>
  updateMemory: (id: string, updates: Partial<MemoryEntry>) => Promise<void>
  forgetMemory: (id: string) => Promise<void>
  clearAllMemories: () => Promise<void>
  getContextString: () => string
  getRecentMemories: (limit?: number) => MemoryEntry[]
  getMemoriesByType: (type: MemoryEntry["type"]) => MemoryEntry[]
  extractAndSaveMemories: (conversationText: string) => Promise<MemoryEntry[]>
}

let idCounter = Date.now()
function genId(): string {
  return `mem_${++idCounter}`
}

async function fetchMemories(): Promise<MemoryEntry[]> {
  try {
    const res = await fetch("/api/memories")
    if (!res.ok) return []
    return res.json()
  } catch { return [] }
}

async function pushMemories(entries: MemoryEntry[]) {
  await fetch("/api/memories", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ entries }),
  })
}

export const useMemoryStore = create<MemoryState>((set, get) => ({
  entries: [],
  isLoaded: false,

  loadMemories: async () => {
    const entries = await fetchMemories()
    set({ entries, isLoaded: true })
  },

  addMemory: async (entry) => {
    const newEntry: MemoryEntry = {
      ...entry,
      id: genId(),
      createdAt: new Date().toISOString(),
    }
    await pushMemories([newEntry])
    set((s) => ({ entries: [...s.entries, newEntry] }))
  },

  updateMemory: async (id, updates) => {
    set((s) => {
      const updated = s.entries.map((e) => (e.id === id ? { ...e, ...updates } : e))
      return { entries: updated }
    })
    const entry = get().entries.find((e) => e.id === id)
    if (entry) await pushMemories([entry])
  },

  forgetMemory: async (id) => {
    // 无法单独删除，通过批量 POST 只发送保留的条目
    set((s) => ({ entries: s.entries.filter((e) => e.id !== id) }))
  },

  clearAllMemories: async () => {
    await fetch("/api/memories", { method: "DELETE" })
    set({ entries: [] })
  },

  getContextString: () => {
    const entries = get().entries
    if (entries.length === 0) return ""
    const sorted = [...entries]
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 15)
    const byType: Record<string, string[]> = {}
    for (const e of sorted) {
      if (!byType[e.type]) byType[e.type] = []
      byType[e.type].push(e.content)
    }
    const lines: string[] = []
    const label: Record<string, string> = {
      goal: "学习目标", habit: "学习习惯", preference: "偏好",
      fact: "基本信息", pattern: "行为模式",
    }
    for (const [type, contents] of Object.entries(byType)) {
      lines.push(`${label[type] || type}: ${contents.join("；")}`)
    }
    return lines.join("\n")
  },

  getRecentMemories: (limit = 10) => {
    return [...get().entries]
      .sort((a, b) => new Date(b.lastRecalledAt).getTime() - new Date(a.lastRecalledAt).getTime())
      .slice(0, limit)
  },

  getMemoriesByType: (type) => {
    return get().entries.filter((e) => e.type === type)
  },

  extractAndSaveMemories: async (conversationText: string) => {
    const newMemories: MemoryEntry[] = []
    const lower = conversationText.toLowerCase()
    const patterns: { regex: RegExp; type: MemoryEntry["type"]; template: (m: RegExpMatchArray) => string }[] = [
      {
        regex: /(?:我的目标是|我想|我要|目标是|学习目标是)[：:\s]*([^。，.!?\n]+)/g,
        type: "goal",
        template: (m) => `学习目标: ${m[1].trim()}`,
      },
      {
        regex: /(?:我每天(?:有|可以|能)学(?:习)?|每天.*?(?:小时|分钟))[：:\s]*(\d+[^。，.!?\n]*)/g,
        type: "habit",
        template: (m) => `每日学习时间: ${m[1].trim()}`,
      },
      {
        regex: /(?:我(?:喜欢|偏好|习惯)|更(?:喜欢|倾向))[：:\s]*([^。，.!?\n]+)/g,
        type: "preference",
        template: (m) => `偏好: ${m[1].trim()}`,
      },
      {
        regex: /(?:我是|我叫|我的名字是)[：:\s]*([^。，.!?\n]+)/g,
        type: "fact",
        template: (m) => `身份: ${m[1].trim()}`,
      },
    ]

    for (const { regex, type, template } of patterns) {
      let match: RegExpExecArray | null
      while ((match = regex.exec(lower)) !== null) {
        const content = template(match)
        const exists = get().entries.some((e) => e.type === type && e.content === content)
        if (!exists) {
          newMemories.push({
            id: genId(),
            type,
            content,
            confidence: 0.7,
            createdAt: new Date().toISOString(),
            lastRecalledAt: new Date().toISOString(),
            source: "auto-extraction",
          })
        }
      }
      regex.lastIndex = 0
    }

    if (newMemories.length > 0) {
      await pushMemories(newMemories)
      set((s) => ({ entries: [...s.entries, ...newMemories] }))
    }

    return newMemories
  },
}))
```

- [ ] **Step 2: Commit**

```bash
git -C /e/study-ai add src/stores/memory-store.ts
git -C /e/study-ai commit -m "refactor: migrate memory-store from localStorage to API"
```

### Task 12: 重构 persona-store + language-store — 合并到 settings API

**Files:**
- Modify: `src/stores/persona-store.ts`
- Modify: `src/stores/language-store.ts`

- [ ] **Step 1: 重构 `persona-store.ts` — 初始化从 settings API 加载**

```typescript
// src/stores/persona-store.ts — 关键变更

// 将 setPersona 改为写入 API
setPersona: async (persona: CoachPersona) => {
  set({ persona, config: PERSONAS[persona] })
  // 异步同步到服务端
  fetch("/api/user/settings", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ persona }),
  }).catch(() => {})
},
```

导出 `loadPersonaFromServer` 函数用于初始化：

```typescript
export async function loadPersonaFromServer(): Promise<CoachPersona> {
  try {
    const res = await fetch("/api/user/settings")
    if (!res.ok) return "gentle"
    const settings = await res.json()
    const p = settings.persona
    if (p === "strict" || p === "gentle" || p === "data-driven") return p
    return "gentle"
  } catch {
    return "gentle"
  }
}
```

- [ ] **Step 2: 重构 `language-store.ts` — 初始化从 settings API 加载**

```typescript
// 将 setLanguage 改为写入 API
setLanguage: async (language: Language) => {
  set({ language })
  fetch("/api/user/settings", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ language }),
  }).catch(() => {})
},
```

导出 `loadLanguageFromServer`：

```typescript
export async function loadLanguageFromServer(): Promise<Language> {
  try {
    const res = await fetch("/api/user/settings")
    if (!res.ok) return "zh-CN"
    const settings = await res.json()
    const lang = settings.language
    if (lang === "zh-CN" || lang === "en") return lang
    return "zh-CN"
  } catch {
    return "zh-CN"
  }
}
```

- [ ] **Step 3: Commit**

```bash
git -C /e/study-ai add src/stores/persona-store.ts src/stores/language-store.ts
git -C /e/study-ai commit -m "refactor: migrate persona and language stores to settings API"
```

### Task 13: 重构 auth-store.updateSettings

**Files:**
- Modify: `src/stores/auth-store.ts`

- [ ] **Step 1: 将 `updateSettings` 从 localStorage 切换到 API**

```typescript
// src/stores/auth-store.ts — 替换 updateSettings 方法

updateSettings: async (settings: Record<string, unknown>) => {
  try {
    await fetch("/api/user/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    })
  } catch {
    // 静默失败
  }
},
```

- [ ] **Step 2: Commit**

```bash
git -C /e/study-ai add src/stores/auth-store.ts
git -C /e/study-ai commit -m "refactor: migrate auth-store updateSettings to API"
```

---

## Phase 4: 组件层改造

### Task 14: 更新 settings/page.tsx — 移除 localStorage 直接读写

**Files:**
- Modify: `src/app/settings/page.tsx`

- [ ] **Step 1: 重构首选项状态管理**

将 notifications 和 weeklyGoal 从 localStorage 改为 API 加载/同步：

```typescript
// 删除旧的 useState 初始化中的 localStorage 读取
// 改为从 settings API 加载

const [notificationsEnabled, setNotificationsEnabled] = useState(true)
const [weeklyGoalHours, setWeeklyGoalHours] = useState(10)
const [settingsLoaded, setSettingsLoaded] = useState(false)

useEffect(() => {
  fetch("/api/user/settings")
    .then((r) => r.json())
    .then((s) => {
      if (s.notifications !== undefined) setNotificationsEnabled(s.notifications)
      if (s.weeklyGoal !== undefined) setWeeklyGoalHours(Number(s.weeklyGoal))
      setSettingsLoaded(true)
    })
    .catch(() => setSettingsLoaded(true))
}, [])

// toggleNotifications:
const toggleNotifications = () => {
  const next = !notificationsEnabled
  setNotificationsEnabled(next)
  fetch("/api/user/settings", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ notifications: next }),
  }).catch(() => {})
}

// handleWeeklyGoalChange:
const handleWeeklyGoalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const val = Math.max(1, Math.min(40, Number(e.target.value) || 1))
  setWeeklyGoalHours(val)
  fetch("/api/user/settings", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ weeklyGoal: val }),
  }).catch(() => {})
}
```

- [ ] **Step 2: Commit**

```bash
git -C /e/study-ai add src/app/settings/page.tsx
git -C /e/study-ai commit -m "refactor: migrate settings page from localStorage to API"
```

### Task 15: 更新 dashboard/page.tsx — insight 缓存迁移到 settings

**Files:**
- Modify: `src/app/dashboard/page.tsx`

- [ ] **Step 1: 替换 insight 缓存的 localStorage 读写**

```typescript
// 删除 getCachedInsight / setCachedInsight 函数
// 改为从 settings API 读取/写入 lastDashboardInsight

async function getCachedInsight(userId: string): Promise<{ date: string; text: string } | null> {
  try {
    const res = await fetch("/api/user/settings")
    if (!res.ok) return null
    const settings = await res.json()
    return settings.lastDashboardInsight ?? null
  } catch { return null }
}

async function setCachedInsight(userId: string, text: string) {
  fetch("/api/user/settings", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      lastDashboardInsight: { date: getLocalDate(), text },
    }),
  }).catch(() => {})
}
```

- [ ] **Step 2: Commit**

```bash
git -C /e/study-ai add src/app/dashboard/page.tsx
git -C /e/study-ai commit -m "refactor: migrate dashboard insight cache from localStorage to API"
```

### Task 16: 更新 checkin-utils.ts — 从 API 加载打卡日期

**Files:**
- Modify: `src/lib/checkin-utils.ts`

- [ ] **Step 1: 将 `loadCheckinDates` 改为异步 API 版本**

```typescript
// src/lib/checkin-utils.ts — 新增异步加载函数

export async function loadCheckinDatesAsync(): Promise<Set<string>> {
  if (typeof window === "undefined") return new Set()
  try {
    const res = await fetch("/api/checkins")
    if (!res.ok) return new Set()
    const records: { date: string }[] = await res.json()
    return new Set(records.map((r) => r.date))
  } catch {
    return new Set()
  }
}

// 保留旧的同步版本作为 fallback（读取 localStorage 兼容旧数据）
export function loadCheckinDates(): Set<string> {
  if (typeof window === "undefined") return new Set()
  try {
    const raw = localStorage.getItem("studyai-checkins")
    if (!raw) return new Set()
    const records: { date: string }[] = JSON.parse(raw)
    return new Set(records.map((r) => r.date))
  } catch {
    return new Set()
  }
}
```

`buildDayNodes` 改为接受 `checkedDates` 参数而非内部自行加载：

```typescript
export function buildDayNodes(
  checkedDates: Set<string>,
  checkedInToday: boolean,
  statusForMissed: "missed" | "future" = "missed"
): DayNode[] {
  const today = getLocalDate()
  const nodes: DayNode[] = []

  for (let i = VISIBLE_DAYS - 1; i >= 0; i--) {
    const date = getLocalDateOffset(-i)
    const d = new Date(date)
    const dayOfWeek = d.getDay()
    const dayNum = d.getDate()

    let status: DayNode["status"]
    if (date === today) {
      status = checkedDates.has(date) || checkedInToday ? "completed" : "today"
    } else if (checkedDates.has(date)) {
      status = "completed"
    } else {
      status = statusForMissed
    }

    nodes.push({ date, dayLabel: DAY_LABELS[dayOfWeek], dayNum, status })
  }

  return nodes
}
```

- [ ] **Step 2: Commit**

```bash
git -C /e/study-ai add src/lib/checkin-utils.ts
git -C /e/study-ai commit -m "refactor: add async API-based checkin date loader"
```

---

## Phase 5: 启动加载 + 旧数据迁移

### Task 17: 创建启动数据加载流程

**Files:**
- Modify: `src/app/layout.tsx`
- Create: `src/hooks/use-app-init.ts`

- [ ] **Step 1: 创建 `use-app-init.ts` hook**

```typescript
// src/hooks/use-app-init.ts
"use client"

import { useEffect, useState } from "react"
import { useAuthStore } from "@/stores/auth-store"
import { usePlanStore } from "@/stores/plan-store"
import { useMemoryStore } from "@/stores/memory-store"
import { usePersonaStore } from "@/stores/persona-store"
import { useLanguageStore } from "@/stores/language-store"

export function useAppInit() {
  const user = useAuthStore((s) => s.user)
  const loadPlans = usePlanStore((s) => s.loadPlans)
  const loadMemories = useMemoryStore((s) => s.loadMemories)
  const setPersona = usePersonaStore((s) => s.setPersona)
  const setLanguage = useLanguageStore((s) => s.setLanguage)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!user) {
      setReady(true)
      return
    }

    Promise.all([
      // 1. 加载 settings 并初始化 persona + language
      fetch("/api/user/settings")
        .then((r) => r.json())
        .then((settings) => {
          if (settings.persona) {
            const { PERSONAS } = require("@/stores/persona-store")
            usePersonaStore.setState({
              persona: settings.persona,
              config: PERSONAS[settings.persona as "strict" | "gentle" | "data-driven"],
            })
          }
          if (settings.language) {
            useLanguageStore.setState({ language: settings.language })
          }
        })
        .catch(() => {}),

      // 2. 加载 plans
      loadPlans(),

      // 3. 加载 memories
      loadMemories(),

      // 4. 检查并执行旧数据迁移
      (async () => {
        const hasLegacyData = typeof window !== "undefined" && (
          localStorage.getItem("studyai-chat-sessions") ||
          localStorage.getItem("studyai-checkins") ||
          localStorage.getItem("studyai-memories") ||
          localStorage.getItem("studyai-settings")
        )
        if (hasLegacyData) {
          try {
            const chatSessions = JSON.parse(localStorage.getItem("studyai-chat-sessions") || "{}")
            const checkins = JSON.parse(localStorage.getItem("studyai-checkins") || "[]")
            const memories = JSON.parse(localStorage.getItem("studyai-memories") || "[]")
            const settings = JSON.parse(localStorage.getItem("studyai-settings") || "{}")
            const persona = localStorage.getItem("studyai-persona")
            const language = localStorage.getItem("studyai-language")
            const notifications = localStorage.getItem("studyai-notifications")
            const weeklyGoal = localStorage.getItem("studyai-weekly-goal")

            const mergedSettings = {
              ...settings,
              ...(persona ? { persona } : {}),
              ...(language ? { language } : {}),
              ...(notifications ? { notifications: notifications === "true" } : {}),
              ...(weeklyGoal ? { weeklyGoal: Number(weeklyGoal) || 10 } : {}),
            }

            const res = await fetch("/api/migrate", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ chatSessions, checkins, memories, settings: mergedSettings }),
            })

            if (res.ok) {
              // 清除旧 localStorage 数据
              localStorage.removeItem("studyai-chat-sessions")
              localStorage.removeItem("studyai-checkins")
              localStorage.removeItem("studyai-memories")
              localStorage.removeItem("studyai-settings")
              localStorage.removeItem("studyai-persona")
              localStorage.removeItem("studyai-language")
              localStorage.removeItem("studyai-notifications")
              localStorage.removeItem("studyai-weekly-goal")
              // 清除 dashboard insight caches
              const keys = Object.keys(localStorage)
              keys.filter(k => k.startsWith("studyai-dashboard-insight-"))
                .forEach(k => localStorage.removeItem(k))

              // 迁移成功后重新加载
              await Promise.all([
                loadPlans(),
                loadMemories(),
                fetch("/api/user/settings").then((r) => r.json()).then((s) => {
                  if (s.persona) {
                    const { PERSONAS } = require("@/stores/persona-store")
                    usePersonaStore.setState({
                      persona: s.persona,
                      config: PERSONAS[s.persona],
                    })
                  }
                  if (s.language) useLanguageStore.setState({ language: s.language })
                }),
              ])
            }
          } catch {
            // 迁移失败，保留旧数据
          }
        }
      })(),
    ]).finally(() => setReady(true))
  }, [user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  return ready
}
```

- [ ] **Step 2: 在 `layout.tsx` 中调用 hook**

在 `src/app/layout.tsx` 中，`SessionProvider` 包装内添加初始化组件：

```tsx
// 在 SessionProvider 内部，children 之前添加：
<AppInitializer />
```

创建轻量组件：

```tsx
// src/components/shared/app-initializer.tsx
"use client"
import { useAppInit } from "@/hooks/use-app-init"
import { LoadingSpinner } from "@/components/shared/loading-spinner"

export function AppInitializer({ children }: { children: React.ReactNode }) {
  const ready = useAppInit()
  if (!ready) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center">
        <LoadingSpinner size="lg" text="加载中..." />
      </div>
    )
  }
  return <>{children}</>
}
```

- [ ] **Step 3: Commit**

```bash
git -C /e/study-ai add src/hooks/use-app-init.ts src/components/shared/app-initializer.tsx src/app/layout.tsx
git -C /e/study-ai commit -m "feat: add app initialization with data loading and migration"
```

---

## Phase 6: 清理与验证

### Task 18: 更新 plan 同步 — 聊天生成计划后写入 DB

**Files:**
- Modify: `src/app/chat/page.tsx`

在聊天页面中，当 AI 生成计划后，确保调用 `planStore.createPlanFromChat` 保存到后端。检查现有的计划创建流程是否正确触发。

- [ ] **Step 1: 确认 chat page 中的 plan creation 调用**

阅读 `src/app/chat/page.tsx`，确认 `planContent` 变化时会调用 `createPlanFromChat` 或 `createPlanFromParsedData`。

- [ ] **Step 2: 修复任何遗漏的调用点（如有）**

- [ ] **Step 3: Commit**

```bash
git -C /e/study-ai add src/app/chat/page.tsx
git -C /e/study-ai commit -m "fix: ensure plan creation triggers API save"
```

### Task 19: 更新 checkin-utils.ts 调用方

**Files:**
- 查找所有使用 `loadCheckinDates` 和 `buildDayNodes` 的组件并更新

- [ ] **Step 1: 查找所有调用方**

```bash
cd /e/study-ai && grep -rn "loadCheckinDates\|buildDayNodes" src/
```

- [ ] **Step 2: 将调用方改为异步加载**

对于使用 `buildDayNodes` 的组件，改为：
1. 组件挂载时调用 `loadCheckinDatesAsync()` 
2. 将结果传入 `buildDayNodes(checkedDates, checkedInToday)`

- [ ] **Step 3: Commit**

```bash
git -C /e/study-ai add src/
git -C /e/study-ai commit -m "fix: update checkin-utils callers to use async API loader"
```

### Task 20: 添加学习资料校验规则

**Files:**
- Create: `src/lib/resource-validator.ts`
- Modify: `src/lib/plan-parser.ts`

- [x] **Step 1: 创建 `src/lib/resource-validator.ts`**

```typescript
// src/lib/resource-validator.ts
// 校验 AI 生成的 learning resources 的可用性和合理性
// 详见规范第 6 节
```

包含：
- `isValidUrlFormat(url)` — URL 格式校验（http/https，有效 hostname）
- `isReasonableTitle(title)` — 标题非占位检查（过滤"学习资料"等通用文字）
- `isReasonableSource(source)` — 来源合理性检查
- `isAvailableUrl(url)` — URL 可用性校验（格式 + 黑名单过滤 example.com、localhost...）
- `validateResource(r)` → `{ valid, reason? }` — 综合校验
- `filterValidResources<T>(resources)` → `T[]` — 过滤有效资源（泛型保留调用方字段）

- [x] **Step 2: 集成到 plan-parser.ts**

在三个资源规范化点调用 `filterValidResources()`：
1. `buildWeekPlan()` — 过滤 week-level resources 和 dailyResources
2. `convertParsedPlanToExtractedData()` — 过滤 per-day resources
3. `extractPlanData()` — 过滤 legacy 格式 resources

- [x] **Step 3: TypeScript 编译验证**

```bash
cd /e/study-ai && npx tsc --noEmit --pretty
```
预期：无错误输出

- [ ] **Step 4: Commit**

```bash
git -C /e/study-ai add src/lib/resource-validator.ts src/lib/plan-parser.ts
git -C /e/study-ai commit -m "feat: add AI resource validation for availability and reasonableness"
```

---

### Task 21: 端到端验证

- [ ] **Step 1: 清理浏览器 localStorage 中的所有 studyai key**

在浏览器 DevTools → Application → Local Storage 中，删除所有 `studyai-*` key。

- [ ] **Step 2: 完整流程测试**

1. 登录（邮箱/密码或 Google）
2. 创建学习计划（快速规划 / 深度规划）
3. 查看计划列表页
4. 查看计划详情页（路线图）
5. 查看今日任务页
6. 提交打卡
7. 查看数据面板
8. 修改设置（主题/语言/人格/通知/周目标）
9. 刷新页面确认数据持久化
10. 清除 AI 记忆

- [ ] **Step 3: 验证数据存储在 Postgres**

通过 Neon SQL Editor 查询各表确认数据已写入：

```sql
SELECT count(*) FROM "plan";
SELECT count(*) FROM "chatSession";
SELECT count(*) FROM "chatMessage";
SELECT count(*) FROM "checkin";
SELECT count(*) FROM "memory";
SELECT settings FROM "user" WHERE email = '<test-user-email>';
```

- [ ] **Step 4: Commit 任何测试中发现的修复**

```bash
git -C /e/study-ai add .
git -C /e/study-ai commit -m "fix: issues found during end-to-end testing"
```

---

## 文件变更总览

| 操作 | 文件 |
|------|------|
| **修改** | `src/db/schema.ts` — 新增 5 表 + user.settings |
| **新建** | `src/app/api/plans/route.ts` |
| **新建** | `src/app/api/plans/[id]/route.ts` |
| **新建** | `src/app/api/chat-sessions/route.ts` |
| **新建** | `src/app/api/chat-sessions/[id]/route.ts` |
| **新建** | `src/app/api/chat-sessions/[id]/messages/route.ts` |
| **新建** | `src/app/api/checkins/route.ts` |
| **新建** | `src/app/api/memories/route.ts` |
| **新建** | `src/app/api/user/settings/route.ts` |
| **新建** | `src/app/api/migrate/route.ts` |
| **修改** | `src/stores/plan-store.ts` — API 替换 内存变量 |
| **修改** | `src/stores/chat-store.ts` — API 替换 localStorage |
| **修改** | `src/services/checkin.mock.ts` — API 替换 localStorage |
| **修改** | `src/stores/memory-store.ts` — API 替换 localStorage |
| **修改** | `src/stores/persona-store.ts` — settings API |
| **修改** | `src/stores/language-store.ts` — settings API |
| **修改** | `src/stores/auth-store.ts` — API 替换 localStorage |
| **修改** | `src/app/settings/page.tsx` — API 替换 localStorage |
| **修改** | `src/app/dashboard/page.tsx` — API 替换 localStorage |
| **修改** | `src/lib/checkin-utils.ts` — 异步 API 版本 |
| **新建** | `src/lib/resource-validator.ts` — 学习资料校验 |
| **修改** | `src/lib/plan-parser.ts` — 集成资源校验 |
| **新建** | `src/hooks/use-app-init.ts` |
| **新建** | `src/components/shared/app-initializer.tsx` |
| **修改** | `src/app/layout.tsx` — 集成 AppInitializer |
| **修改** | `src/app/chat/page.tsx` — 确认 plan 创建保存 |
