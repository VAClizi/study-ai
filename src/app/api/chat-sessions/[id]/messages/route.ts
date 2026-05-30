import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/db"
import { chatMessages } from "@/db/schema"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  let body: { messages?: Array<{ id: string; role: string; content: string; timestamp: string }> }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const messages = body.messages ?? []
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
