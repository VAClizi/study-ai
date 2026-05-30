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

  const [deleted] = await db
    .delete(plans)
    .where(and(eq(plans.id, id), eq(plans.userId, session.user.id)))
    .returning()

  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  return NextResponse.json({ success: true })
}
