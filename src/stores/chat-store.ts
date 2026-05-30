import { create } from "zustand"
import type { ChatMessage, ChatMode, ChatSession } from "@/types/chat"
import type { CheckinInitData } from "@/types/checkin"
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
  checkinInitData: CheckinInitData | null

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
  setCheckinInitData: (data: CheckinInitData | null) => void
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

function buildCheckinPrompt(data: CheckinInitData): string {
  const taskList = data.tasks.map((t) =>
    `  * ${t.title}（${t.difficulty === "hard" ? "困难" : t.difficulty === "medium" ? "中等" : "简单"}）- ${t.completed ? "已完成" : "未完成"}，预计 ${t.durationMinutes} 分钟`
  ).join("\n")

  return `
[每日打卡模式]

你是用户的个人AI学习教练。用户刚刚完成了今日学习任务，来进行每日打卡复盘。

【用户今日学习背景】
- 学习计划：${data.planTitle}
- 今天是学习的第 ${data.todayDayNumber} 天
- 今日任务：
${taskList}
- 当前连续打卡：${data.streak} 天

【你的任务】

阶段一：生成定制学习问卷
根据用户今日的具体学习内容，在对话中逐步提问，生成一份高度个性化的学习复盘问卷。
- 问题必须与用户今日实际学习的具体内容紧密相关（必须提到具体的知识点、技能点、概念名称）
- 一次只问一个问题，像自然对话一样推进，不要一次抛出所有问题
- 需要覆盖的维度（按顺序逐步推进）：今日学了什么 → 理解程度 → 遇到的困难 → 时间投入和专注度 → 知识盲区自查
- 问题要具体，比如"今天你在学[具体知识点]的时候，有没有哪个概念让你觉得理解起来比较模糊？"而不是"今天学得怎么样？"
- 总共 3-5 个核心问题，逐步推进

【快捷通道（极其重要！最高优先级！）】
如果用户在对话中（包括首条消息）明确表示以下任一情况，立即走快捷通道：
- "忙"、"没时间"、"今天比较忙"、"今天没空"
- "有事"、"有事情"、"临时有事"、"今天有事"
- "今天不想"、"今天算了"、"改天"、"下次"、"不想填"、"不想回答"
- "太累了"、"状态不好"、"今天很累"、"没精力"
- "直接打卡"、"快速打卡"、"简单打卡"、"跳过"
- 任何表示今天不想深入填写问卷、想快速完成打卡的信号

快捷通道处理（严格遵守！）：
1. 1-2 句理解和支持的简短回应（如"完全理解，今天辛苦了"），绝对不要追问原因
2. 在回复末尾直接输出 [CHECKIN_COMPLETE]
3. 不要继续问问卷问题，不要分析，不要给建议

阶段二：分析复盘
当用户完成了问卷所有回答（回答了 3-5 个问题）后：
- 综合分析用户的学习质量，识别哪些知识点是真正掌握的，哪些理解还比较模糊
- 明确指出具体的知识盲区和未完全理解的知识点（必须说出知识点名称，不能笼统地说"有些地方还需要加强"）
- 用关心但专业的语气告知用户具体的薄弱环节和潜在影响
- 然后询问用户："你想针对这些薄弱点做一些补充练习再打卡，还是今天先到这里？"

阶段三：补充指导（用户选择补充练习时）
- 针对已识别的知识盲区，给出 2-3 个具体的、可操作的补充学习建议
- 每个建议要对应一个具体的知识点，用"去做什么"的方式表述（如"去看XX教程的第3章关于YY的部分"），而不是笼统的"去学XX"
- 控制在 30 分钟内可以完成
- 用户完成后回来汇报结果 → 简短确认用户反馈 → [CHECKIN_COMPLETE]

阶段三备选：直接完成（用户不补充，或分析后没有发现明显问题）
- 简短的学习总结（2-3 句今日亮点概括 + 1 个明天的小建议）
- [CHECKIN_COMPLETE]

【重要规则】
- 不要使用 A/B/C/D 选择题格式进行问卷提问，采用开放式问题
- 语气专业、有温度、有督导感（像一位真正关心你成长的教练）
- 绝对不要在问卷阶段生成任何学习计划、补充计划或 [MINI_PLAN]
- 绝对不要在用户还没回答完问卷时就输出 [CHECKIN_COMPLETE]（除非触发快捷通道）
- [CHECKIN_COMPLETE] 只能出现在打卡确认完成的回复末尾
`
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
  checkinInitData: null,

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
    const { checkinInitData } = get()

    const modePrompt = currentMode === "quick"
      ? personaStore.config.quickSystemPrompt
      : personaStore.config.detailedSystemPrompt

    const checkinContext = checkinInitData ? buildCheckinPrompt(checkinInitData) : ""

    const CHOICE_FORMAT_INSTRUCTION = `\n\n[回复格式] 当需要用户做选择时，每个选项必须独占一行、不能挤在同一行：\n\n问题正文以？结尾\nA. 选项一\nB. 选项二\nC. 选项三\nD. 选项四\n\n严格遵守：问句独占一行，每个选项独占一行，以 "A." "B." "C." "D." 开头。`

    const LANG_INSTRUCTION = languageStore.language === "en"
      ? "\n\nIMPORTANT: The user is using the English interface. You MUST respond in English only. All questions, choices, and explanations must be in English."
      : ""

    const choiceInstruction = checkinInitData ? "" : CHOICE_FORMAT_INSTRUCTION
    const systemContent = modePrompt + checkinContext + choiceInstruction + LANG_INSTRUCTION + "\n\n[系统功能] 生成完整学习计划后，对话将自动存档至「我的计划」页面，用户可随时回到当前对话继续讨论或调整计划。" + (memoryContext ? `\n\n[长期记忆]\n${memoryContext}` : "")

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

      // Note: checkinInitData is preserved after [CHECKIN_COMPLETE] so chat page can save the checkin record.
      // It will be cleared by the chat page after celebration completes.

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

  setCheckinInitData: (data: CheckinInitData | null) => {
    set({ checkinInitData: data })
  },
}))
