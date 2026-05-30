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
  loadStoredSession: (sessionId: string) => Promise<boolean>
  saveCurrentSession: () => Promise<void>
  getCoachMessage: (type: "streak" | "reminder" | "encouragement", params?: Record<string, number>) => string
  resetChat: () => void
  appendToLastMessage: (chunk: string) => void
  finalizeLastMessage: () => void
  replaceLastMessage: (content: string) => void
  setCheckinReportContext: (context: string | null) => void
}

export async function getAllStoredSessions(): Promise<ChatSession[]> {
  try {
    const res = await fetch("/api/chat-sessions")
    if (!res.ok) return []
    return res.json()
  } catch {
    return []
  }
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

    const isReviewMode = checkinReportContext === "[REVIEW_MODE]"

    const checkinContext = isReviewMode
      ? `\n\n[学习报告反馈审核模式]\n用户之前收到了AI的学习报告分析，现在正在回复。\n\n【核心原则】先倾听用户，理解真实情况后再决定行动。用户可能因为太累、太忙、内容太难、状态不好等原因导致学习效果不佳，这些都是正常的。\n\n【响应逻辑】\n首先检查对话历史中是否已有 [MINI_PLAN]：\n\n→ 如果对话中已有 [MINI_PLAN]（说明用户之前收到了补充计划，现在正在反馈完成情况）：\n从宽审核用户的反馈：\n- 用户如实反馈了完成情况（无论全部完成、部分完成、还是没做），即判定通过\n- 用户表达了真实感受（「太累了没做」「状态不好」「只做了一部分」「今天不想做」等），也判定通过\n- 用户说明了原因（「加班没时间」「有其他事情」等），也判定通过\n- 只有用户完全没有提及补充计划相关内容时（如聊了完全不相关的话题），才不通过\n\n通过后：1-2句理解和支持的简短回应 + 回复末尾包含 [CHECKIN_COMPLETE] 标记\n绝对不要生成新的学习计划或迷你计划！\n不通过：正常回答用户问题，不输出 [CHECKIN_COMPLETE]\n\n→ 如果对话中没有 [MINI_PLAN]（说明用户正在解释自己的困难，AI还没有给补充计划）：\n1. 先认可用户的坦诚表达，表达理解\n2. 根据用户的具体情况判断如何回应：\n   - 用户表达了想加强练习 / 需要帮助 → 生成 [MINI_PLAN]（2-3个可在30分钟内完成的微任务），邀请用户按自己的节奏试试，不强制完成\n   - 用户只是状态不好 / 太忙 / 太累 / 今天不想做 → 表达理解和支持，鼓励休息和调整，回复末尾加 [CHECKIN_COMPLETE]\n   - 用户的回复不够清楚，需要更多信息才能判断 → 温和地再问一个跟进问题\n3. 如果生成了 [MINI_PLAN]，格式如下：\n[MINI_PLAN]\n### 📋 今日补充练习\n- **任务1**：xxx（预计10分钟）\n- **任务2**：xxx（预计10分钟）\n- **任务3**：xxx（预计10分钟）\n[/MINI_PLAN]\n末尾友好邀请用户按自己的节奏来反馈，不强制完成\n\n【重要规则】\n- 不要使用A/B/C/D选项格式，不要输出任何选择题\n- 语气亲切、专业、有鼓励性\n- 不要输出 [CHECKIN_COMPLETE] 除非用户的情况已经被妥善回应`
      : checkinReportContext
        ? `\n\n[学习报告分析模式] ${checkinReportContext}\n\n请根据以上学习报告信息生成今日总结报告。\n\n【判断逻辑】\n若用户填写了困难内容，或状态自评为「很吃力/一般般」，则走【有待提升】分支：\n1. 简短肯定（1-2句，认可用户的努力）\n2. 困难点深度解析（分析根本原因，给出针对性建议）\n3. 用关心的语气询问用户1-2个关于困难的开放问题，了解用户今天的真实情况。例如：「今天具体是哪个部分让你觉得比较吃力？」、「是内容太难、时间不够、还是今天状态不太好？你自己觉得是什么原因呢？」\n4. 绝对不要在这一步生成任何学习计划、补充计划或 [MINI_PLAN]！先倾听用户，等用户回复后再判断是否需要补充练习。\n\n若用户没有困难且状态良好，则走【完成优秀】分支：\n1. 个性化祝贺语（1-2句）\n2. 今日亮点总结（2-3个亮点）\n3. 回复末尾包含 [CHECKIN_COMPLETE] 标记\n\n【重要规则】\n- 走【有待提升】分支时，不要使用A/B/C/D选项格式，不要输出任何选择题\n- 语气亲切、专业、有鼓励性\n- 不重复展示原始填写内容，直接输出分析报告`
        : ""

    const CHOICE_FORMAT_INSTRUCTION = `\n\n[回复格式] 当需要用户做选择时，每个选项必须独占一行、不能挤在同一行：\n\n问题正文以？结尾\nA. 选项一\nB. 选项二\nC. 选项三\nD. 选项四\n\n严格遵守：问句独占一行，每个选项独占一行，以 "A." "B." "C." "D." 开头。`

    const LANG_INSTRUCTION = languageStore.language === "en"
      ? "\n\nIMPORTANT: The user is using the English interface. You MUST respond in English only. All questions, choices, and explanations must be in English."
      : ""

    const choiceInstruction = checkinReportContext ? "" : CHOICE_FORMAT_INSTRUCTION
    const systemContent = modePrompt + checkinContext + choiceInstruction + LANG_INSTRUCTION + "\n\n[系统功能] 生成完整学习计划后，对话将自动存档至「我的计划」页面，用户可随时回到当前对话继续讨论或调整计划。" + (memoryContext ? `\n\n[长期记忆]\n${memoryContext}` : "")

    // After first checkin turn: switch to review mode for feedback follow-up
    if (checkinReportContext && !isReviewMode) {
      set({ checkinReportContext: "[REVIEW_MODE]" })
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
      const planDataIdx = fullContent.indexOf("[PLAN_DATA]")
      if (planDataIdx !== -1) {
        const after = fullContent.slice(planDataIdx + 11)
        const endIdx = after.indexOf("[/PLAN_DATA]")
        const stripped = endIdx !== -1
          ? fullContent.slice(0, planDataIdx) + after.slice(endIdx + 13)
          : fullContent.slice(0, planDataIdx)
        const displayContent = stripped.trim()
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
        await get().saveCurrentSession()
      }

      // Clear checkin review mode when AI signals completion
      if (isReviewMode && /\[CHECKIN_COMPLETE\]/.test(fullContent)) {
        set({ checkinReportContext: null })
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
    const res = await fetch("/api/chat-sessions")
    if (res.ok) {
      const sessions: ChatSession[] = await res.json()
      set({ sessions })
    }
  },

  loadSession: async (id: string) => {
    const session = await mockChatService.getSession(id)
    if (session) {
      set({ currentSession: session, messages: session.messages })
    }
  },

  loadStoredSession: async (sessionId: string) => {
    const res = await fetch(`/api/chat-sessions/${sessionId}`)
    if (!res.ok) return false
    const session: ChatSession = await res.json()
    set({
      currentSession: session,
      messages: session.messages,
      currentMode: session.mode,
      planContent: session.planId ? null : get().planContent,
    })
    return true
  },

  saveCurrentSession: async () => {
    const { currentSession, messages, currentMode } = get()
    if (!currentSession || !currentMode) return

    // Upsert session metadata
    await fetch("/api/chat-sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: currentSession.id,
        userId: currentSession.userId,
        mode: currentMode,
        title: currentSession.title,
        planId: currentSession.planId,
        updatedAt: new Date().toISOString(),
      }),
    })

    // Post new messages (not already in currentSession.messages)
    const existingIds = new Set(currentSession.messages.map((m) => m.id))
    const newMessages = messages.filter((m) => !existingIds.has(m.id))
    if (newMessages.length > 0) {
      await fetch(`/api/chat-sessions/${currentSession.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      })
    }

    const updated: ChatSession = {
      ...currentSession,
      mode: currentMode,
      messages,
      planId: currentSession.planId,
      updatedAt: new Date().toISOString(),
    }
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
