import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/db"
import { chatSessions, chatMessages, checkins, memories, users } from "@/db/schema"
import { eq } from "drizzle-orm"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: {
    chatSessions?: Record<string, { id: string; mode: string; title: string; messages: Array<{ id: string; role: string; content: string; timestamp: string }>; planId?: string; createdAt: string; updatedAt: string }>
    checkins?: Array<{ id: string; planId: string; date: string; tasks: unknown; feedback: unknown; focusLevel: number; moodRating: number; createdAt: string }>
    memories?: Array<{ id: string; type: string; content: string; confidence: number; lastRecalledAt: string; source: string; createdAt: string }>
    settings?: Record<string, unknown>
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const userId = session.user.id
  const migrated = { sessions: 0, messages: 0, checkins: 0, memories: 0, settings: false }

  // 1. Migrate chat sessions + messages
  const chatSessionsData = body.chatSessions ? Object.values(body.chatSessions) : []

  for (const cs of chatSessionsData) {
    const [existing] = await db
      .select({ id: chatSessions.id })
      .from(chatSessions)
      .where(eq(chatSessions.id, cs.id))
      .limit(1)

    if (!existing) {
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

  // 2. Migrate checkins
  const checkinsData = body.checkins ?? []
  for (const c of checkinsData) {
    const [existing] = await db
      .select({ id: checkins.id })
      .from(checkins)
      .where(eq(checkins.id, c.id))
      .limit(1)

    if (!existing) {
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

  // 3. Migrate memories
  const memoriesData = body.memories ?? []
  for (const m of memoriesData) {
    const [existing] = await db
      .select({ id: memories.id })
      .from(memories)
      .where(eq(memories.id, m.id))
      .limit(1)

    if (!existing) {
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

  // 4. Migrate settings
  if (body.settings && Object.keys(body.settings).length > 0) {
    await db
      .update(users)
      .set({ settings: body.settings })
      .where(eq(users.id, userId))
    migrated.settings = true
  }

  return NextResponse.json({ migrated })
}
