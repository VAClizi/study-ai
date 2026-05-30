import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/db"
import { chatSessions, chatMessages, checkins, memories, users, plans } from "@/db/schema"
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
    plans?: Array<{ id: string; title: string; mode: string; goal: unknown; stages: unknown; theories: unknown; status: string; endDate: string; chatSessionId: string | null; createdAt: string }>
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const userId = session.user.id
  const migrated = { sessions: 0, messages: 0, checkins: 0, memories: 0, settings: false, plans: 0 }
  const errors: string[] = []

  try {
    // 0. Migrate plans first (needed for checkin FK references)
    const plansData = body.plans ? Object.values(body.plans) : []
    for (const p of plansData) {
      try {
        const [existing] = await db
          .select({ id: plans.id })
          .from(plans)
          .where(eq(plans.id, p.id))
          .limit(1)

        if (!existing) {
          await db.insert(plans).values({
            id: p.id,
            userId,
            title: p.title ?? "",
            mode: p.mode ?? "quick",
            goal: (p.goal ?? {}) as Record<string, unknown>,
            stages: (p.stages ?? []) as Array<Record<string, unknown>>,
            theories: (p.theories ?? []) as Array<Record<string, unknown>>,
            status: p.status ?? "active",
            endDate: p.endDate ?? "",
            chatSessionId: p.chatSessionId ?? null,
            createdAt: p.createdAt ? new Date(p.createdAt) : new Date(),
          })
          migrated.plans++
        }
      } catch (e) {
        errors.push(`plan[${p.id}]: ${String(e)}`)
      }
    }

    // 1. Migrate chat sessions + messages
    const chatSessionsData = body.chatSessions ? Object.values(body.chatSessions) : []

    for (const cs of chatSessionsData) {
      try {
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
      } catch (e) {
        errors.push(`session[${cs.id}]: ${String(e)}`)
      }
    }

    // 2. Migrate checkins (planId must reference an existing plan)
    const checkinsData = body.checkins ?? []
    for (const c of checkinsData) {
      try {
        // Validate planId references a real plan
        const [planExists] = await db
          .select({ id: plans.id })
          .from(plans)
          .where(eq(plans.id, c.planId))
          .limit(1)

        if (!planExists) {
          errors.push(`checkin[${c.id}]: skipped — plan ${c.planId} not found`)
          continue
        }

        const [existing] = await db
          .select({ id: checkins.id })
          .from(checkins)
          .where(eq(checkins.id, c.id))
          .limit(1)

        if (!existing) {
          await db.insert(checkins).values({
            id: c.id,
            userId,
            planId: c.planId,
            date: c.date,
            tasks: c.tasks ?? [],
            feedback: c.feedback ?? {},
            focusLevel: c.focusLevel ?? 5,
            moodRating: c.moodRating ?? 3,
            createdAt: c.createdAt ? new Date(c.createdAt) : new Date(),
          })
          migrated.checkins++
        }
      } catch (e) {
        errors.push(`checkin[${c.id}]: ${String(e)}`)
      }
    }

    // 3. Migrate memories
    const memoriesData = body.memories ?? []
    for (const m of memoriesData) {
      try {
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
      } catch (e) {
        errors.push(`memory[${m.id}]: ${String(e)}`)
      }
    }

    // 4. Migrate settings
    if (body.settings && Object.keys(body.settings).length > 0) {
      try {
        await db
          .update(users)
          .set({ settings: body.settings })
          .where(eq(users.id, userId))
        migrated.settings = true
      } catch (e) {
        errors.push(`settings: ${String(e)}`)
      }
    }

    return NextResponse.json({ migrated, errors: errors.length > 0 ? errors : undefined })
  } catch (error) {
    console.error("[migrate] 迁移失败:", error)
    return NextResponse.json(
      { error: "Migration failed", details: String(error) },
      { status: 500 },
    )
  }
}
