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
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { LoadingSpinner } from "@/components/shared/loading-spinner"
import { extractChoices } from "@/lib/choice-parser"
import { parsePlanTextWithAI } from "@/services/plan-ai-parser"
import { convertParsedPlanToExtractedData, extractPlanData, type ExtractedPlanData } from "@/lib/plan-parser"
import { replenishResources } from "@/lib/resource-replenisher"
import type { LearningResource } from "@/types/plan"
import { ArrowLeft, Plus, MessageSquare, Loader2, CheckCircle } from "lucide-react"
import { StreakCelebration } from "@/components/checkin/streak-celebration"
import { useCheckinStore } from "@/stores/checkin-store"
import Link from "next/link"
import { useT } from "@/lib/i18n"

function ChatContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const t = useT()
  const { isAuthenticated } = useAuthStore()

  const {
    messages, isStreaming, currentMode, currentSession, planContent,
    createSession, sendMessage, setMode, resetChat, loadStoredSession, saveCurrentSession,
  } = useChatStore()

  const { createPlanFromParsedData } = usePlanStore()
  const { user } = useAuthStore()

  const [hasStarted, setHasStarted] = useState(false)
  const [isThinking, setIsThinking] = useState(false)
  const [isParsingPlan, setIsParsingPlan] = useState(false)
  const [parsedPlanData, setParsedPlanData] = useState<ExtractedPlanData | null>(null)
  const [showCelebration, setShowCelebration] = useState(false)
  const [celebrationStreakDays, setCelebrationStreakDays] = useState(0)
  const [showCheckinButton, setShowCheckinButton] = useState(false)
  const [planSaveError, setPlanSaveError] = useState<string | null>(null)
  const [isSavingPlan, setIsSavingPlan] = useState(false)
  const isCheckinSource = searchParams.get("source") === "checkin"
  const initialPromptSent = useRef(false)
  const lastParsedContent = useRef<string | null>(null)
  const lastStreamingRef = useRef(false)
  const replenishAbortRef = useRef(false)

  // 触发 AI 补生成被丢弃的学习资料，并合并回 plan data
  const replenishAndUpdate = useCallback(async (data: ExtractedPlanData) => {
    const contexts = data.droppedResourceContexts
    if (!contexts?.length) return
    if (!Array.isArray(data.stages)) return

    replenishAbortRef.current = false

    // 注入计划标题到每个 context
    const fullContexts = contexts.map(ctx => ({
      ...ctx,
      planTitle: data.title ?? "",
    }))

    const groups = await replenishResources(fullContexts)
    if (replenishAbortRef.current) return

    // 构建 dayNumber → 补生成资源的映射
    const replenishByDay = new Map<number, LearningResource[]>()
    for (let i = 0; i < contexts.length; i++) {
      const resources = groups[i] ?? []
      if (resources.length > 0) {
        replenishByDay.set(contexts[i].dayNumber, resources)
      }
    }

    if (replenishByDay.size === 0) return

    // 将补生成资源合并回对应 day
    const updatedStages = data.stages.map(stage => ({
      ...stage,
      weeks: stage.weeks.map(week => ({
        ...week,
        days: week.days.map(day => {
          const extras = replenishByDay.get(day.dayNumber)
          if (extras?.length) {
            return {
              ...day,
              resources: [...(day.resources ?? []), ...extras],
            }
          }
          return day
        }),
      })),
    }))

    setParsedPlanData(prev => prev ? {
      ...prev,
      stages: updatedStages,
      droppedResourceContexts: undefined,
    } : null)
  }, [])

  // When planContent is set, parse it into structured plan data
  useEffect(() => {
    if (!planContent || planContent === lastParsedContent.current) return
    lastParsedContent.current = planContent
    replenishAbortRef.current = true

    // Fast path: direct [PLAN_DATA] extraction (instant, no API call)
    const directExtract = extractPlanData(planContent)
    if (directExtract) {
      setParsedPlanData(directExtract)
      setIsParsingPlan(false)
      replenishAndUpdate(directExtract)
      return
    }

    // Slow path: AI parsing fallback (only if AI didn't include [PLAN_DATA] block)
    let cancelled = false
    setIsParsingPlan(true)
    setParsedPlanData(null)

    const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 15000))
    Promise.race([parsePlanTextWithAI(planContent), timeout]).then((result) => {
      if (cancelled) return
      if (result) {
        const extracted = convertParsedPlanToExtractedData(result)
        setParsedPlanData(extracted)
        replenishAndUpdate(extracted)
      } else {
        const fallback = extractPlanData(planContent)
        if (fallback) { setParsedPlanData(fallback); replenishAndUpdate(fallback) }
      }
      setIsParsingPlan(false)
    }).catch(() => {
      if (cancelled) return
      const fallback = extractPlanData(planContent)
      if (fallback) { setParsedPlanData(fallback); replenishAndUpdate(fallback) }
      setIsParsingPlan(false)
    })

    return () => { cancelled = true }
  }, [planContent])

  // Detect [CHECKIN_COMPLETE] marker in AI response for celebration
  useEffect(() => {
    const wasStreaming = lastStreamingRef.current
    lastStreamingRef.current = isStreaming

    if (wasStreaming && !isStreaming && isCheckinSource) {
      const lastMsg = messages[messages.length - 1]
      if (lastMsg?.role === "assistant" && lastMsg.content.includes("[CHECKIN_COMPLETE]")) {
        // Show the checkin complete button
        setShowCheckinButton(true)
        // Strip the marker from displayed content only — celebration waits for manual button click
        const cleaned = lastMsg.content.replace(/\[CHECKIN_COMPLETE\]/g, "").trim()
        useChatStore.setState((s) => {
          const msgs = [...s.messages]
          const last = msgs[msgs.length - 1]
          if (last) msgs[msgs.length - 1] = { ...last, content: cleaned }
          return { messages: msgs }
        })
      }
    }
  }, [isStreaming, messages, isCheckinSource])

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

  // Start chat from URL mode parameter
  useEffect(() => {
    const modeParam = searchParams.get("mode")
    if (modeParam === "quick" || modeParam === "detailed") {
      handleModeSelect(modeParam)
    }
  }, [searchParams, handleModeSelect])

  // Handle ?session= from plans page (resume a previous conversation)
  useEffect(() => {
    const sessionId = searchParams.get("session")
    if (sessionId && !hasStarted) {
      loadStoredSession(sessionId).then((loaded) => {
        if (loaded) {
          setHasStarted(true)
        }
      })
    }
  }, [searchParams, hasStarted])

  // Handle ?prompt= from homepage
  useEffect(() => {
    const promptParam = searchParams.get("prompt")
    if (promptParam && hasStarted && !initialPromptSent.current && messages.length <= 1) {
      initialPromptSent.current = true
      setShowCheckinButton(false)
      const timer = setTimeout(() => {
        handleSend(promptParam)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [searchParams, hasStarted, messages.length, handleSend])

  const handleGeneratePlan = useCallback(async () => {
    if (!user) return null
    setPlanSaveError(null)
    setIsSavingPlan(true)

    // If parsing succeeded, use the extracted data; otherwise build a minimal fallback
    const data = parsedPlanData ?? {
      title: currentMode === "quick" ? "快速学习计划" : "深度学习计划",
      goal: "系统化学习计划",
      stages: [],
      theories: [],
    }

    try {
      const mode = currentMode || "quick"
      const sessionId = currentSession?.id
      const plan = await createPlanFromParsedData(data, mode, sessionId)
      if (plan) {
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
    } catch (err) {
      console.error("Failed to save plan:", err)
      setPlanSaveError("保存计划失败，请重试")
      return null
    } finally {
      setIsSavingPlan(false)
    }
  }, [parsedPlanData, currentMode, user, currentSession, createPlanFromParsedData, saveCurrentSession, router])

  const handleNewChat = useCallback(() => {
    resetChat()
    setHasStarted(false)
    setParsedPlanData(null)
    lastParsedContent.current = null
    initialPromptSent.current = false
    setShowCheckinButton(false)
    setShowCelebration(false)
  }, [resetChat])

  // Extract choices from the last AI message (displayed outside the bubble)
  // Skip choice extraction for checkin source — coach analysis should not be parsed as choices
  const lastChoices = useMemo(() => {
    if (isStreaming) return null
    if (isCheckinSource) return null
    const lastMsg = messages[messages.length - 1]
    if (!lastMsg || lastMsg.role !== "assistant" || !lastMsg.content) return null
    return extractChoices(lastMsg.content)
  }, [messages, isStreaming, isCheckinSource])

  // Not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-4">
        <Card className="max-w-md w-full p-8 text-center border-black/[0.06] dark:border-white/[0.06] bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl">
          <div className="w-16 h-16 rounded-2xl bg-purple-600/10 flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="h-8 w-8 text-purple-500 dark:text-purple-400" />
          </div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">{t("chat.startPlan")}</h2>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-6">
            {t("chat.loginPrompt")}
          </p>
          <Link href="/login" className="inline-flex items-center justify-center rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium h-9 px-4 py-2 transition-all">
            {t("chat.loginRegister")}
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
                  {currentMode === "quick" ? t("chat.quickPlan") : t("chat.detailedPlan")}
                  <span className="text-[9px] text-zinc-400 ml-1 font-normal">v6</span>
                </h2>
                <p className="text-xs text-zinc-400 dark:text-zinc-500">
                  {messages.length} {t("chat.messages")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={handleNewChat} className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white gap-1.5">
                <Plus className="h-3.5 w-3.5" />
                {t("chat.newChat")}
              </Button>
            </div>
          </div>
        </div>

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

        {/* Checkin complete button (shown only after AI approves feedback with [CHECKIN_COMPLETE]) */}
        {isCheckinSource && !isStreaming && showCheckinButton && (
          <div className="max-w-3xl mx-auto w-full px-4 pb-2">
            <button
              onClick={() => {
                const streakStore = useCheckinStore.getState()
                setCelebrationStreakDays(streakStore.streak)
                setShowCelebration(true)
              }}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold text-sm shadow-lg shadow-green-500/25 hover:shadow-green-500/40 transition-all active:scale-[0.98]"
            >
              <CheckCircle className="h-5 w-5" />
              完成今日打卡
            </button>
          </div>
        )}

        {/* Plan parsing / save banner */}
        {planContent && (
          <div className="max-w-3xl mx-auto w-full px-4 pb-1 space-y-2">
            {isParsingPlan ? (
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-purple-200/60 dark:border-purple-500/20 bg-purple-50/60 dark:bg-purple-500/5">
                <Loader2 className="h-4 w-4 text-purple-500 animate-spin" />
                <span className="text-sm text-purple-700 dark:text-purple-300 font-medium">
                  {t("chat.parsingPlan")}
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3 px-4 py-2 rounded-xl border border-purple-200/60 dark:border-purple-500/20 bg-purple-50/60 dark:bg-purple-500/5">
                <span className="text-sm text-purple-700 dark:text-purple-300 font-medium">
                  {parsedPlanData ? t("chat.planReady") : t("chat.planParseFailed")}
                </span>
                <Button
                  onClick={() => handleGeneratePlan()}
                  size="sm"
                  disabled={isSavingPlan}
                  className="bg-purple-600 hover:bg-purple-700 text-white text-xs h-8 disabled:opacity-50"
                >
                  {isSavingPlan ? (
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      保存中...
                    </span>
                  ) : (
                    t("chat.saveToMyPlan")
                  )}
                </Button>
              </div>
            )}
            {planSaveError && (
              <div className="px-4 py-2 rounded-xl border border-red-200/60 dark:border-red-500/20 bg-red-50/60 dark:bg-red-500/5">
                <span className="text-sm text-red-600 dark:text-red-400">{planSaveError}</span>
              </div>
            )}
          </div>
        )}

        {/* Input */}
        <ChatInput onSend={handleSend} isStreaming={isStreaming} />

        {/* Celebration overlay */}
        <StreakCelebration
          show={showCelebration}
          streakDays={celebrationStreakDays}
          userName={user?.name}
          onComplete={() => {
            setShowCelebration(false)
            router.push("/today")
          }}
        />

      </div>
    </div>
  )
}

export default function ChatPage() {
  const t = useT()
  return (
    <Suspense fallback={
      <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center">
        <LoadingSpinner size="lg" text={t("chat.loading")} />
      </div>
    }>
      <ChatContent />
    </Suspense>
  )
}
