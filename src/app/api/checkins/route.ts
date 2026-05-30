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

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const row = {
    id: (body.id as string) ?? `checkin-${Date.now()}`,
    userId: session.user.id,
    planId: body.planId as string,
    date: body.date as string,
    tasks: body.tasks ?? [],
    feedback: body.feedback ?? {},
    focusLevel: (body.focusLevel as number) ?? 5,
    moodRating: (body.moodRating as number) ?? 3,
  }

  await db.insert(checkins).values(row)
  return NextResponse.json(row, { status: 201 })
}
