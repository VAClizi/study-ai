export type LLMModel = "deepseek-chat" | "deepseek-reasoner"

export interface LLMMessage {
  role: "system" | "user" | "assistant"
  content: string
}

export interface LLMOptions {
  model?: LLMModel
  temperature?: number
  maxTokens?: number
}

const BASE_URL = process.env.NEXT_PUBLIC_DEEPSEEK_API_URL
  ? `${process.env.NEXT_PUBLIC_DEEPSEEK_API_URL}/chat/completions`
  : "https://api.deepseek.com/v1/chat/completions"

export class LLMError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string,
  ) {
    super(message)
    this.name = "LLMError"
  }
}

async function parseSSELine(line: string): Promise<string | null> {
  if (!line.startsWith("data: ")) return null
  const data = line.slice(6).trim()
  if (data === "[DONE]") return null
  try {
    const parsed = JSON.parse(data)
    const content = parsed.choices?.[0]?.delta?.content
    return content || null
  } catch {
    return null
  }
}

export async function* streamChat(
  messages: LLMMessage[],
  apiKey: string,
  options?: LLMOptions,
): AsyncGenerator<string, void, unknown> {
  const body = {
    model: options?.model ?? "deepseek-chat",
    messages,
    temperature: options?.temperature ?? 0.7,
    max_tokens: options?.maxTokens ?? 4096,
    stream: true,
  }

  const response = await fetch(BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new LLMError(
      (error as { message?: string }).message || `API error: ${response.status}`,
      response.status,
      (error as { code?: string }).code,
    )
  }

  const reader = response.body?.getReader()
  if (!reader) throw new LLMError("No response body")

  const decoder = new TextDecoder()
  let buffer = ""

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split("\n")
    buffer = lines.pop() || ""

    for (const line of lines) {
      const chunk = await parseSSELine(line.trim())
      if (chunk) yield chunk
    }
  }

  // Process remaining buffer
  if (buffer.trim()) {
    const chunk = await parseSSELine(buffer.trim())
    if (chunk) yield chunk
  }
}

export async function chat(
  messages: LLMMessage[],
  apiKey: string,
  options?: LLMOptions,
): Promise<string> {
  const body = {
    model: options?.model ?? "deepseek-chat",
    messages,
    temperature: options?.temperature ?? 0.7,
    max_tokens: options?.maxTokens ?? 4096,
    stream: false,
  }

  const response = await fetch(BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new LLMError(
      (error as { message?: string }).message || `API error: ${response.status}`,
      response.status,
      (error as { code?: string }).code,
    )
  }

  const data = await response.json()
  return data.choices?.[0]?.message?.content || ""
}

export async function testConnection(apiKey: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const response = await fetch(BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [{ role: "user", content: "hi" }],
        max_tokens: 5,
        stream: false,
      }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      return { ok: false, error: (error as { message?: string }).message || `HTTP ${response.status}` }
    }

    return { ok: true }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

export function buildSystemPrompt(
  personaPrompt: string,
  memoryContext: string,
): string {
  const parts = [personaPrompt]
  if (memoryContext) {
    parts.push(`\n[用户长期记忆]\n${memoryContext}`)
  }
  return parts.join("\n")
}
