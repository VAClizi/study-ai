import { create } from "zustand"
import type { ChatMessage, ChatMode, ChatSession } from "@/types/chat"
import { mockChatService } from "@/services/chat.mock"
import { streamChat, type LLMMessage } from "@/services/llm"
import { usePersonaStore } from "./persona-store"
import { useMemoryStore } from "./memory-store"
import { useLanguageStore } from "./language-store"

interface ChatState {
  sessions: ChatSession[]
  currentSession: ChatSession | null
  messages: ChatMessage[]
  isStreaming: boolean
  currentMode: ChatMode | null
  planContent: string | null
  abortController: AbortController | null
  checkinReportContext: string | null

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
  setCheckinReportContext: (context: string | null) => void
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
  checkinReportContext: null,

  createSession: async (mode: ChatMode) => {
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
  },

  sendMessage: async (content: string) => {
    const { messages, currentMode } = get()
    if (!currentMode) return

    const userMsg: ChatMessage = {
      id: Math.random().toString(36).substring(2),
      role: "user",
      content,
      timestamp: new Date().toISOString(),
    }

    const updatedMessages = [...messages, userMsg]
    set({ messages: updatedMessages, isStreaming: true })

    const aiMsgId = `ai_${Date.now()}`
    const aiMsg: ChatMessage = {
      id: aiMsgId,
      role: "assistant",
      content: "",
      timestamp: new Date().toISOString(),
    }

    set({ messages: [...updatedMessages, aiMsg] })

    const personaStore = usePersonaStore.getState()
    const memoryStore = useMemoryStore.getState()
    const languageStore = useLanguageStore.getState()

    const memoryContext = memoryStore.getContextString()
    const { checkinReportContext } = get()

    const modePrompt = currentMode === "quick"
      ? personaStore.config.quickSystemPrompt
      : personaStore.config.detailedSystemPrompt

    const checkinContext = checkinReportContext
      ? `\n\n[学习报告分析模式] ${checkinReportContext}\n\n请根据以上学习报告信息生成今日总结报告。\n\n【判断逻辑】\n若用户填写了困难内容，或状态自评为「很吃力/一般般」，则走【有待提升】分支：\n1. 简短肯定（1-2句，认可用户的努力）\n2. 困难点深度解析（分析根本原因，给出针对性建议）\n3. 生成今日补充学习小计划（使用 [MINI_PLAN] 标记包裹），包含2-3个可在30分钟内完成的微任务，每个任务包含：任务名、具体操作步骤、预计时长。格式如下：\n[MINI_PLAN]\n### 📋 今日补充练习\n- **任务1**：xxx（预计10分钟）\n- **任务2**：xxx（预计10分钟）\n- **任务3**：xxx（预计10分钟）\n[/MINI_PLAN]\n4. 在末尾明确要求用户完成补充计划后返回汇报，例如：「完成后回来告诉我你的练习情况，我会给你反馈 ✨」\n\n若用户没有困难且状态良好，则走【完成优秀】分支：\n1. 个性化祝贺语（1-2句）\n2. 今日亮点总结（2-3个亮点）\n3. 回复末尾包含 [CHECKIN_COMPLETE] 标记\n\n【重要规则】\n- 走【有待提升】分支时，不要使用A/B/C/D选项格式，不要输出任何选择题\n- 语气亲切、专业、有鼓励性\n- 不重复展示原始填写内容，直接输出分析报告`
      : ""

    const CHOICE_FORMAT_INSTRUCTION = `\n\n[回复格式] 当需要用户做选择时，每个选项必须独占一行、不能挤在同一行：\n\n问题正文以？结尾\nA. 选项一\nB. 选项二\nC. 选项三\nD. 选项四\n\n严格遵守：问句独占一行，每个选项独占一行，以 "A." "B." "C." "D." 开头。`

    const LANG_INSTRUCTION = languageStore.language === "en"
      ? "\n\nIMPORTANT: The user is using the English interface. You MUST respond in English only. All questions, choices, and explanations must be in English."
      : ""

    const choiceInstruction = checkinReportContext ? "" : CHOICE_FORMAT_INSTRUCTION
    const systemContent = modePrompt + checkinContext + choiceInstruction + LANG_INSTRUCTION + "\n\n[系统功能] 生成完整学习计划后，对话将自动存档至「我的计划」页面，用户可随时回到当前对话继续讨论或调整计划。" + (memoryContext ? `\n\n[长期记忆]\n${memoryContext}` : "")

    // Clear checkin context after injecting it
    if (checkinReportContext) {
      set({ checkinReportContext: null })
    }

    const llmMessages: LLMMessage[] = [
      { role: "system", content: systemContent },
    ]

    const historyMessages = updatedMessages.slice(-20)
    for (const msg of historyMessages) {
      llmMessages.push({
        role: msg.role === "user" ? "user" : "assistant",
        content: msg.content,
      })
    }

    try {
      let fullContent = ""
      const generator = streamChat(llmMessages, {
        model: currentMode === "detailed" ? "mimo-v2.5-pro" : "mimo-v2.5",
      })

      for await (const chunk of generator) {
        fullContent += chunk
        set((s) => {
          const msgs = [...s.messages]
          const lastMsg = msgs[msgs.length - 1]
          if (lastMsg && lastMsg.id === aiMsgId) {
            msgs[msgs.length - 1] = { ...lastMsg, content: fullContent }
          }
          return { messages: msgs }
        })
      }

      // Strip [PLAN_DATA] block from displayed content so user doesn't see raw JSON
      const planDataRegex = /\[PLAN_DATA\][\s\S]*?\[\/PLAN_DATA\]/
      if (planDataRegex.test(fullContent)) {
        const displayContent = fullContent.replace(planDataRegex, "").trim()
        set((s) => {
          const msgs = [...s.messages]
          const lastMsg = msgs[msgs.length - 1]
          if (lastMsg && lastMsg.id === aiMsgId) {
            msgs[msgs.length - 1] = { ...lastMsg, content: displayContent }
          }
          return { messages: msgs }
        })
      }

      // Detect if the AI response is a detailed learning plan
      const firstChars = fullContent.slice(0, 600)
      const isOutline = /(?:大纲|概览|概述|纲要|提纲)/.test(firstChars)

      const headingCount = (fullContent.match(/^#{2,3} .+/gm) || []).length
      const boldCount = (fullContent.match(/\*\*[^*]+\*\*/g) || []).length
      const hasTable = fullContent.includes("|---") || fullContent.includes("| ---")
      const hasList = (fullContent.match(/^[-*] .+/gm) || []).length

      const timeMarkers = (fullContent.match(/\d+\s*(?:分钟|小时|天|周|个?月)/g) || []).length
      const tableRows = hasTable
        ? (fullContent.match(/^\|.+\|.+\|/gm) || []).filter(l => !l.includes("---")).length
        : 0

      const structureScore =
        headingCount * 2 +
        boldCount +
        (hasTable ? 5 : 0) +
        Math.min(hasList, 8)

      // Direct [PLAN_DATA] detection (fast path) OR old heuristic detection (fallback)
      const hasPlanData = /\[PLAN_DATA\]/.test(fullContent)
      const isDetailedPlan = hasPlanData || (
        !isOutline &&
        fullContent.length > 800 &&
        structureScore >= 10 &&
        (timeMarkers >= 2 || tableRows >= 3)
      )
      if (isDetailedPlan) {
        set({ planContent: fullContent })
        get().saveCurrentSession()
      }

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

  setCheckinReportContext: (context: string | null) => {
    set({ checkinReportContext: context })
  },
}))
