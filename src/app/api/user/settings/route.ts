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

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  // Strip protected fields
  delete body.id
  delete body.email

  // Merge with existing settings
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
