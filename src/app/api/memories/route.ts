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

  let body: { entries?: Array<{ id: string; type: string; content: string; confidence?: number; lastRecalledAt?: string; source?: string }> }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const entries = body.entries ?? []
  if (entries.length === 0) {
    return NextResponse.json({ upserted: 0 })
  }

  for (const entry of entries) {
    const [existing] = await db
      .select({ id: memories.id })
      .from(memories)
      .where(and(eq(memories.id, entry.id), eq(memories.userId, session.user.id)))
      .limit(1)

    if (existing) {
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
