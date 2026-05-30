"use client"

import { useCallback } from "react"
import { useChatStore } from "@/stores/chat-store"
import { usePlanStore } from "@/stores/plan-store"
import { useAuthStore } from "@/stores/auth-store"

export function useChat() {
  const {
    messages,
    isStreaming,
    currentMode,
    currentSession,
    planContent,
    createSession,
    sendMessage,
    setMode,
    resetChat,
  } = useChatStore()

  const { createPlanFromChat } = usePlanStore()
  const { user } = useAuthStore()

  const startChat = useCallback(
    async (mode: "quick" | "detailed") => {
      await createSession(mode)
    },
    [createSession]
  )

  const handleSendMessage = useCallback(
    async (content: string) => {
      await sendMessage(content)
    },
    [sendMessage]
  )

  const generatePlan = useCallback(async () => {
    if (!planContent || !user) return null
    const mode = currentMode || "quick"
    return await createPlanFromChat(planContent, mode)
  }, [planContent, currentMode, user, createPlanFromChat])

  return {
    messages,
    isStreaming,
    currentMode,
    currentSession,
    planContent,
    startChat,
    sendMessage: handleSendMessage,
    setMode,
    generatePlan,
    resetChat,
  }
}
