import { NextResponse } from "next/server"

export async function POST() {
  const apiKey = process.env.MIMO_API_KEY
  if (!apiKey) {
    return NextResponse.json({ ok: false, error: "Server API key not configured" }, { status: 500 })
  }

  try {
    const response = await fetch("https://api.xiaomimimo.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "mimo-v2.5-pro",
        messages: [{ role: "user", content: "hi" }],
        max_tokens: 5,
        stream: false,
      }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      return NextResponse.json({ ok: false, error: (error as { message?: string }).message || `HTTP ${response.status}` })
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message })
  }
}
