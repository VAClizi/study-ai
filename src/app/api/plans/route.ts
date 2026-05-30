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

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }
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

  await db.insert(plans).values(plan as typeof plans.$inferInsert)
  return NextResponse.json(plan, { status: 201 })
}
