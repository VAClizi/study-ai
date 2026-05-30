export type LLMModel = "mimo-v2.5-pro" | "mimo-v2.5" | "mimo-v2-flash"

export interface LLMMessage {
  role: "system" | "user" | "assistant"
  content: string
}

export interface LLMOptions {
  model?: LLMModel
  temperature?: number
  maxTokens?: number
}

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
  options?: LLMOptions,
): AsyncGenerator<string, void, unknown> {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages,
      model: options?.model ?? "mimo-v2.5",
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 8192,
      stream: true,
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new LLMError(
      (error as { error?: string }).error || `API error: ${response.status}`,
      response.status,
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

  if (buffer.trim()) {
    const chunk = await parseSSELine(buffer.trim())
    if (chunk) yield chunk
  }
}

export async function chat(
  messages: LLMMessage[],
  options?: LLMOptions,
): Promise<string> {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages,
      model: options?.model ?? "mimo-v2.5",
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 8192,
      stream: false,
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new LLMError(
      (error as { error?: string }).error || `API error: ${response.status}`,
      response.status,
    )
  }

  const data = await response.json()
  return data.content || ""
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
