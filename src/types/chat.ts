export type MessageRole = "user" | "assistant" | "system"

export type ChatMode = "quick" | "detailed"

export interface ChatMessage {
  id: string
  role: MessageRole
  content: string
  timestamp: string
  isStreaming?: boolean
}

export interface ChatSession {
  id: string
  userId: string
  mode: ChatMode
  title: string
  messages: ChatMessage[]
  planId?: string
  createdAt: string
  updatedAt: string
}

export interface ChatQuestion {
  id: string
  question: string
  field: string
  options?: string[]
  inputType: "text" | "select" | "number" | "slider"
}
