import { create } from "zustand"
import type { ChatMessage, ChatMode, ChatSession } from "@/types/chat"
import { mockChatService } from "@/services/chat.mock"
import { streamChat, type LLMMessage } from "@/services/llm"
import { useAPIKeyStore } from "./api-key-store"
import { usePersonaStore } from "./persona-store"
import { useMemoryStore } from "./memory-store"

interface ChatState {
  sessions: ChatSession[]
  currentSession: ChatSession | null
  messages: ChatMessage[]
  isStreaming: boolean
  currentMode: ChatMode | null
  planContent: string | null
  abortController: AbortController | null

  createSession: (mode: ChatMode) => Promise<void>
  sendMessage: (content: string) => Promise<void>
  cancelStreaming: () => void
  setMode: (mode: ChatMode) => void
  loadSessions: () => Promise<void>
  loadSession: (id: string) => Promise<void>
  loadStoredSession: (sessionId: string) => boolean
  saveCurrentSession: () => void
  getCoachMessage: (type: "streak" | "reminder" | "encouragement", params?: Record<string, number>) => string
  resetChat: () => void
  appendToLastMessage: (chunk: string) => void
  finalizeLastMessage: () => void
  replaceLastMessage: (content: string) => void
}

const STORAGE_KEY = "studyai-chat-sessions"

function loadAllStoredSessions(): Record<string, ChatSession> {
  if (typeof window === "undefined") return {}
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveAllStoredSessions(sessions: Record<string, ChatSession>) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions))
  } catch { /* storage full */ }
}

export function getAllStoredSessions(): ChatSession[] {
  const map = loadAllStoredSessions()
  return Object.values(map).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  )
}

export const useChatStore = create<ChatState>((set, get) => ({
  sessions: [],
  currentSession: null,
  messages: [],
  isStreaming: false,
  currentMode: null,
  planContent: null,
  abortController: null,

  createSession: async (mode: ChatMode) => {
    // Try creating a real session if LLM is configured, fallback to mock
    const apiKey = useAPIKeyStore.getState().apiKey
    const isLLMConfigured = !!apiKey

    if (isLLMConfigured) {
      const personaStore = usePersonaStore.getState()
      const welcomeMsg = personaStore.config.welcomeMessage["zh-CN"]

      const sessionId = `session_${Date.now()}`
      const session: ChatSession = {
        id: sessionId,
        userId: "demo-user",
        mode,
        title: `AI ${mode === "quick" ? "快速" : "深度"}对话`,
        messages: [
          {
            id: `msg_${Date.now()}`,
            role: "assistant",
            content: welcomeMsg,
            timestamp: new Date().toISOString(),
          },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      set({
        currentSession: session,
        messages: session.messages,
        currentMode: mode,
        planContent: null,
      })
    } else {
      const session = await mockChatService.createSession(mode)
      set({
        currentSession: session,
        messages: session.messages,
        currentMode: mode,
        planContent: null,
      })
    }
  },

  sendMessage: async (content: string) => {
    const { messages, currentMode } = get()
    if (!currentMode) return

    const apiKey = useAPIKeyStore.getState().apiKey
    const isLLMConfigured = !!apiKey

    // Add user message
    const userMsg: ChatMessage = {
      id: Math.random().toString(36).substring(2),
      role: "user",
      content,
      timestamp: new Date().toISOString(),
    }

    const updatedMessages = [...messages, userMsg]
    set({ messages: updatedMessages, isStreaming: true })

    // Create empty AI message placeholder
    const aiMsgId = `ai_${Date.now()}`
    const aiMsg: ChatMessage = {
      id: aiMsgId,
      role: "assistant",
      content: "",
      timestamp: new Date().toISOString(),
    }

    set({ messages: [...updatedMessages, aiMsg] })

    if (isLLMConfigured) {
      // Real LLM call with streaming
      const personaStore = usePersonaStore.getState()
      const memoryStore = useMemoryStore.getState()
      const { model } = useAPIKeyStore.getState()

      const memoryContext = memoryStore.getContextString()

      // Use mode-specific custom instructions if set, otherwise preset
      const quickCustom = personaStore.quickCustomInstructions
      const detailedCustom = personaStore.detailedCustomInstructions
      const modePrompt = currentMode === "quick"
        ? (quickCustom || personaStore.config.quickSystemPrompt)
        : (detailedCustom || personaStore.config.detailedSystemPrompt)

      // Format instruction for clickable choice buttons (injected, not part of persona)
      const CHOICE_FORMAT_INSTRUCTION = `\n\n[回复格式] 当需要用户从选项中选择时，用 —————— 标记包裹选项区域：\n\n——————\n- A. 选项一\n- B. 选项二\n- C. 选项三\n——————\n\n每个选项以 "- A."、"- B." 等开头独占一行。不要在 —————— 标记内写其他文字。`

      // Build messages for LLM
      const llmMessages: LLMMessage[] = [
        { role: "system", content: modePrompt + CHOICE_FORMAT_INSTRUCTION + "\n\n[系统功能] 生成完整学习计划后，对话将自动存档至「我的计划」页面，用户可随时回到当前对话继续讨论或调整计划。" + (memoryContext ? `\n\n[长期记忆]\n${memoryContext}` : "") },
      ]

      // Add conversation history (last 20 messages for context window)
      const historyMessages = updatedMessages.slice(-20)
      for (const msg of historyMessages) {
        llmMessages.push({
          role: msg.role === "user" ? "user" : "assistant",
          content: msg.content,
        })
      }

      try {
        let fullContent = ""
        const generator = streamChat(llmMessages, apiKey, { model })

        for await (const chunk of generator) {
          fullContent += chunk
          // Update the AI message content incrementally
          set((s) => {
            const msgs = [...s.messages]
            const lastMsg = msgs[msgs.length - 1]
            if (lastMsg && lastMsg.id === aiMsgId) {
              msgs[msgs.length - 1] = { ...lastMsg, content: fullContent }
            }
            return { messages: msgs }
          })
        }

        // Detect if the AI response is a detailed learning plan (not an outline)
        //
        // Outlines share the same structural markers (headings, lists, bold) as detailed
        // plans, so structure scoring alone is insufficient. We need three layers:
        //   1. Explicitly reject outlines (labeled with 大纲/概览/概述/纲要/提纲)
        //   2. Require minimum length + structure score
        //   3. Require "depth signals" — time allocations or data tables that only
        //      appear in fleshed-out detailed plans
        const firstChars = fullContent.slice(0, 600)
        const isOutline = /(?:大纲|概览|概述|纲要|提纲)/.test(firstChars)

        const headingCount = (fullContent.match(/^#{2,3} .+/gm) || []).length
        const boldCount = (fullContent.match(/\*\*[^*]+\*\*/g) || []).length
        const hasTable = fullContent.includes("|---") || fullContent.includes("| ---")
        const hasList = (fullContent.match(/^[-*] .+/gm) || []).length

        // Depth signals: concrete time allocations and data-rich tables
        const timeMarkers = (fullContent.match(/\d+\s*(?:分钟|小时|天|周|个?月)/g) || []).length
        const tableRows = hasTable
          ? (fullContent.match(/^\|.+\|.+\|/gm) || []).filter(l => !l.includes("---")).length
          : 0

        const structureScore =
          headingCount * 2 +
          boldCount +
          (hasTable ? 5 : 0) +
          Math.min(hasList, 8)

        const isDetailedPlan =
          !isOutline &&
          fullContent.length > 800 &&
          structureScore >= 10 &&
          (timeMarkers >= 2 || tableRows >= 3)
        if (isDetailedPlan) {
          // Always overwrite — the latest detailed plan wins over any earlier outline
          set({ planContent: fullContent })
          // Persist session for later resumption from plans page
          get().saveCurrentSession()
        }

        // Auto-extract memories
        if (fullContent.length > 0) {
          memoryStore.extractAndSaveMemories(content + "\n" + fullContent)
        }
      } catch (error) {
        const errorMsg = (error as Error).message || "AI 响应失败"
        set((s) => {
          const msgs = [...s.messages]
          const lastMsg = msgs[msgs.length - 1]
          if (lastMsg && lastMsg.id === aiMsgId) {
            msgs[msgs.length - 1] = { ...lastMsg, content: `抱歉，遇到了问题: ${errorMsg}` }
          }
          return { messages: msgs }
        })
      }
    } else {
      // Fallback to mock service (no API key configured)
      const questions = currentMode === "quick"
        ? await mockChatService.getQuickQuestions()
        : await mockChatService.getDetailedQuestions()

      const questionCount = updatedMessages.filter((m) => m.role === "user").length

      if (questionCount <= questions.length) {
        if (questionCount >= questions.length) {
          // Generate mock plan as final response
          const answers: Record<string, string> = {}
          updatedMessages
            .filter((m) => m.role === "user")
            .forEach((m, i) => {
              if (i < questions.length) {
                answers[questions[i].field] = m.content
              }
            })

          const planContent = await mockChatService.generatePlan(answers, currentMode)

          set((s) => {
            const msgs = [...s.messages]
            msgs[msgs.length - 1] = { ...msgs[msgs.length - 1], content: planContent }
            return { messages: msgs, planContent, isStreaming: false }
          })
          get().saveCurrentSession()
          return
        }

        // Next question
        const nextQ = questions[questionCount]
        set((s) => {
          const msgs = [...s.messages]
          msgs[msgs.length - 1] = { ...msgs[msgs.length - 1], content: nextQ.question }
          return { messages: msgs, isStreaming: false }
        })
      } else {
        // Freeform fallback when no LLM: echo with coach persona
        const personaStore = usePersonaStore.getState()
        set((s) => {
          const msgs = [...s.messages]
          msgs[msgs.length - 1] = {
            ...msgs[msgs.length - 1],
            content: `[${personaStore.config.name["zh-CN"]}模式] 收到你的消息：「${content}」\n\n💡 提示：配置 DeepSeek API Key 后，我将能真正理解你的需求并给出个性化回复。请在设置页面配置 API Key。`,
          }
          return { messages: msgs, isStreaming: false }
        })
      }
    }

    set({ isStreaming: false })
  },

  cancelStreaming: () => {
    const { abortController } = get()
    if (abortController) {
      abortController.abort()
    }
    set({ isStreaming: false, abortController: null })
  },

  setMode: (mode: ChatMode) => {
    set({ currentMode: mode })
  },

  loadSessions: async () => {
    const sessions = await mockChatService.getSessions()
    set({ sessions })
  },

  loadSession: async (id: string) => {
    const session = await mockChatService.getSession(id)
    if (session) {
      set({ currentSession: session, messages: session.messages })
    }
  },

  loadStoredSession: (sessionId: string) => {
    const all = loadAllStoredSessions()
    const session = all[sessionId]
    if (!session) return false
    set({
      currentSession: session,
      messages: session.messages,
      currentMode: session.mode,
      planContent: session.planId ? null : get().planContent,
    })
    return true
  },

  saveCurrentSession: () => {
    const { currentSession, messages, currentMode, planContent } = get()
    if (!currentSession || !currentMode) return
    const all = loadAllStoredSessions()
    const updated: ChatSession = {
      ...currentSession,
      mode: currentMode,
      messages,
      planId: currentSession.planId,
      updatedAt: new Date().toISOString(),
    }
    all[currentSession.id] = updated
    saveAllStoredSessions(all)
    set({ currentSession: updated })
  },

  getCoachMessage: (type: "streak" | "reminder" | "encouragement", params?: Record<string, number>) => {
    return mockChatService.getCoachMessage(type, params)
  },

  resetChat: () => {
    const { abortController } = get()
    if (abortController) {
      abortController.abort()
    }
    set({
      currentSession: null,
      messages: [],
      currentMode: null,
      planContent: null,
      isStreaming: false,
      abortController: null,
    })
  },

  appendToLastMessage: (chunk: string) => {
    set((s) => {
      const msgs = [...s.messages]
      const last = msgs[msgs.length - 1]
      if (last) {
        msgs[msgs.length - 1] = { ...last, content: last.content + chunk }
      }
      return { messages: msgs }
    })
  },

  finalizeLastMessage: () => {
    // No-op: streaming is handled by sendMessage
  },

  replaceLastMessage: (content: string) => {
    set((s) => {
      const msgs = [...s.messages]
      const last = msgs[msgs.length - 1]
      if (last) {
        msgs[msgs.length - 1] = { ...last, content }
      }
      return { messages: msgs }
    })
  },
}))
