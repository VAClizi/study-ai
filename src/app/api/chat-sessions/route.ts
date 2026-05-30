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

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const now = new Date()
  const rowData = {
    id: (body.id as string) ?? `session_${Date.now()}`,
    userId: session.user.id,
    mode: (body.mode as string) ?? "quick",
    title: (body.title as string) ?? "",
    planId: (body.planId as string) ?? null,
    updatedAt: now,
  }

  // Upsert: check if session exists
  const [existing] = await db
    .select({ id: chatSessions.id })
    .from(chatSessions)
    .where(eq(chatSessions.id, rowData.id))
    .limit(1)

  if (existing) {
    const [updated] = await db
      .update(chatSessions)
      .set({ title: rowData.title, mode: rowData.mode, planId: rowData.planId, updatedAt: now })
      .where(eq(chatSessions.id, rowData.id))
      .returning()
    return NextResponse.json(updated)
  }

  await db.insert(chatSessions).values(rowData)
  return NextResponse.json(rowData, { status: 201 })
}
