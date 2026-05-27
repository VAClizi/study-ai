const DEEPSEEK_BASE = "https://api.deepseek.com/v1/chat/completions"

export async function POST(req: Request) {
  const apiKey = process.env.DEEPSEEK_API_KEY
  if (!apiKey) {
    return Response.json({ error: "Server API key not configured" }, { status: 500 })
  }

  let body: {
    messages: { role: string; content: string }[]
    model?: string
    temperature?: number
    max_tokens?: number
    stream?: boolean
  }

  try {
    body = await req.json()
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  if (!body.messages?.length) {
    return Response.json({ error: "messages array is required" }, { status: 400 })
  }

  const stream = body.stream ?? false

  const response = await fetch(DEEPSEEK_BASE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: body.model ?? "deepseek-chat",
      messages: body.messages,
      temperature: body.temperature ?? 0.7,
      max_tokens: body.max_tokens ?? 4096,
      stream,
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    return Response.json(
      { error: (error as { message?: string }).message || `DeepSeek API error: ${response.status}` },
      { status: response.status },
    )
  }

  if (stream && response.body) {
    return new Response(response.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    })
  }

  const data = await response.json()
  return Response.json({
    content: data.choices?.[0]?.message?.content || "",
  })
}
