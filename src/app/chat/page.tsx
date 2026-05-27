"use client"

import { useEffect, useState, Suspense, useRef, useCallback, useMemo } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import type { ChatMode } from "@/types/chat"
import { useChatStore } from "@/stores/chat-store"
import { usePlanStore } from "@/stores/plan-store"
import { useAuthStore } from "@/stores/auth-store"
import { ChatMessages } from "@/components/chat/chat-messages"
import { ChatInput } from "@/components/chat/chat-input"
import { ModeSelector } from "@/components/chat/mode-selector"
import { PlanSection } from "@/components/chat/plan-section"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { LoadingSpinner } from "@/components/shared/loading-spinner"
import { extractChoices } from "@/lib/choice-parser"
import { ArrowLeft, Plus, MessageSquare } from "lucide-react"
import Link from "next/link"

function ChatContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()

  const {
    messages, isStreaming, currentMode, currentSession, planContent,
    createSession, sendMessage, setMode, resetChat, loadStoredSession, saveCurrentSession,
  } = useChatStore()

  const { createPlanFromChat } = usePlanStore()
  const { user } = useAuthStore()

  const [hasStarted, setHasStarted] = useState(false)
  const [generatedPlanId, setGeneratedPlanId] = useState<string | null>(null)
  const [isThinking, setIsThinking] = useState(false)
  const initialPromptSent = useRef(false)

  // Start chat from URL mode parameter
  useEffect(() => {
    const modeParam = searchParams.get("mode")
    if (modeParam === "quick" || modeParam === "detailed") {
      handleModeSelect(modeParam)
    }
  }, [searchParams])

  // Handle ?session= from plans page (resume a previous conversation)
  useEffect(() => {
    const sessionId = searchParams.get("session")
    if (sessionId && !hasStarted) {
      const loaded = loadStoredSession(sessionId)
      if (loaded) {
        setHasStarted(true)
      }
    }
  }, [searchParams, hasStarted])

  // Handle ?prompt= from homepage
  useEffect(() => {
    const promptParam = searchParams.get("prompt")
    if (promptParam && hasStarted && !initialPromptSent.current && messages.length <= 1) {
      initialPromptSent.current = true
      // Small delay to let UI render first
      const timer = setTimeout(() => {
        handleSend(promptParam)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [searchParams, hasStarted, messages.length])

  const handleModeSelect = useCallback(async (mode: ChatMode) => {
    setMode(mode)
    await createSession(mode)
    setHasStarted(true)
  }, [setMode, createSession])

  const handleSend = useCallback(async (content: string) => {
    setIsThinking(true)
    await sendMessage(content)
    setIsThinking(false)
  }, [sendMessage])

  const handleGeneratePlan = useCallback(async () => {
    if (!planContent || !user) return null
    const mode = currentMode || "quick"
    const sessionId = currentSession?.id
    const plan = await createPlanFromChat(planContent, user.id, mode, sessionId)
    if (plan) {
      // Link the session back to the plan and persist
      useChatStore.setState((s) => {
        if (s.currentSession) {
          s.currentSession = { ...s.currentSession, planId: plan.id }
        }
        return {}
      })
      saveCurrentSession()
      router.push(`/plan/${plan.id}`)
    }
    return plan
  }, [planContent, currentMode, user, currentSession, createPlanFromChat, saveCurrentSession, router])

  const handleNewChat = useCallback(() => {
    resetChat()
    setHasStarted(false)
    setGeneratedPlanId(null)
    initialPromptSent.current = false
  }, [resetChat])

  // Extract choices from the last AI message (displayed outside the bubble)
  const lastChoices = useMemo(() => {
    if (isStreaming || planContent) return null
    const lastMsg = messages[messages.length - 1]
    if (!lastMsg || lastMsg.role !== "assistant" || !lastMsg.content) return null
    return extractChoices(lastMsg.content)
  }, [messages, isStreaming, planContent])

  // Not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-4">
        <Card className="max-w-md w-full p-8 text-center border-black/[0.06] dark:border-white/[0.06] bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl">
          <div className="w-16 h-16 rounded-2xl bg-purple-600/10 flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="h-8 w-8 text-purple-500 dark:text-purple-400" />
          </div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">开始 AI 规划</h2>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-6">
            登录后即可与 AI 对话，生成专属于你的学习计划
          </p>
          <Link href="/login" className="inline-flex items-center justify-center rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium h-9 px-4 py-2 transition-all">
            登录 / 注册
          </Link>
        </Card>
      </div>
    )
  }

  // Mode selection
  if (!hasStarted) {
    return <ModeSelector onSelect={handleModeSelect} />
  }

  return (
    <div className="flex flex-1 min-h-0">
      <div className="flex-1 flex flex-col min-w-0">
        {/* Chat Header */}
        <div className="border-b border-black/[0.04] dark:border-white/[0.04] bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl px-4 py-3">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="w-8 h-8" onClick={handleNewChat}>
                <ArrowLeft className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
              </Button>
              <div>
                <h2 className="text-sm font-medium text-zinc-900 dark:text-white">
                  {currentMode === "quick" ? "快速定制" : "深度规划"}
                </h2>
                <p className="text-xs text-zinc-400 dark:text-zinc-500">
                  {messages.length} 条消息
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={handleNewChat} className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white gap-1.5">
                <Plus className="h-3.5 w-3.5" />
                新对话
              </Button>
            </div>
          </div>
        </div>

        {/* Learning Plan Section */}
        {planContent && <PlanSection content={planContent} />}

        {/* Messages */}
        <ChatMessages
          messages={messages}
          isStreaming={isStreaming}
          isThinking={isThinking}
          planContent={planContent}
        />

        {/* Quick Reply Choices (rendered at page level, outside ScrollArea) */}
        {lastChoices && (
          <div className="max-w-3xl mx-auto w-full px-4 pb-2">
            <div className="flex flex-wrap gap-2">
              {lastChoices.choices.map((choice, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSend(choice.text)}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-purple-200 dark:border-purple-500/20 bg-white dark:bg-zinc-800 hover:bg-purple-50 dark:hover:bg-purple-500/10 hover:border-purple-300 dark:hover:border-purple-500/30 text-sm transition-all cursor-pointer shadow-sm"
                >
                  <span className="flex items-center justify-center w-5 h-5 rounded-md bg-purple-600/10 dark:bg-purple-500/15 text-purple-600 dark:text-purple-400 text-xs font-semibold shrink-0">
                    {choice.label}
                  </span>
                  <span className="text-zinc-700 dark:text-zinc-200">
                    {choice.text}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input or Plan Actions */}
        {planContent && !generatedPlanId ? (
          <div className="border-t border-black/[0.04] dark:border-white/[0.04] bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl p-4">
            <div className="max-w-md mx-auto text-center">
              <p className="text-sm text-purple-600 dark:text-purple-400 font-medium mb-3">计划已生成！</p>
              <Button
                onClick={() => handleGeneratePlan()}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white gap-2"
              >
                保存到我的计划
              </Button>
            </div>
          </div>
        ) : generatedPlanId ? (
          <div className="border-t border-black/[0.04] dark:border-white/[0.04] bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl p-4">
            <div className="max-w-md mx-auto flex gap-2">
              <Link href={`/plan/${generatedPlanId}`} className="flex-1 inline-flex items-center justify-center rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium h-9 px-4 py-2 transition-all">
                查看完整计划
              </Link>
              <Link href="/today" className="flex-1 inline-flex items-center justify-center rounded-lg border border-black/10 dark:border-white/10 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white text-sm font-medium h-9 px-4 py-2 transition-all">
                去打卡
              </Link>
            </div>
          </div>
        ) : (
          <ChatInput onSend={handleSend} isStreaming={isStreaming} />
        )}
      </div>
    </div>
  )
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center">
        <LoadingSpinner size="lg" text="加载中..." />
      </div>
    }>
      <ChatContent />
    </Suspense>
  )
}
