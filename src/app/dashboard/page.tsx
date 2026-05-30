"use client"

import { useAnalytics } from "@/hooks/use-analytics"
import { useAuthStore } from "@/stores/auth-store"
import { usePlanStore } from "@/stores/plan-store"
import { getLocalDate } from "@/lib/date"
import { StreakCard } from "@/components/dashboard/streak-card"
import { CompletionChart } from "@/components/dashboard/completion-chart"
import { FocusChart } from "@/components/dashboard/focus-chart"
import { StatsGrid } from "@/components/dashboard/stats-grid"
import { LoadingSpinner } from "@/components/shared/loading-spinner"
import { EmptyState } from "@/components/shared/empty-state"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Sparkles, Brain, Lightbulb, Eye, Loader2 } from "lucide-react"
import Link from "next/link"
import { useEffect, useState, useCallback } from "react"
import { useMemoryStore } from "@/stores/memory-store"
import { usePersonaStore } from "@/stores/persona-store"
import { chat } from "@/services/llm"
import { useT, useTF } from "@/lib/i18n"
import { useLanguageStore } from "@/stores/language-store"

function getCacheKey(userId: string) {
  return `studyai-dashboard-insight-${userId}`
}

function getCachedInsight(userId: string): { date: string; text: string } | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(getCacheKey(userId))
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

function setCachedInsight(userId: string, text: string) {
  if (typeof window === "undefined") return
  localStorage.setItem(getCacheKey(userId), JSON.stringify({
    date: getLocalDate(),
    text,
  }))
}

export default function DashboardPage() {
  const { isAuthenticated, user } = useAuthStore()
  const { plans, loadPlans } = usePlanStore()
  const { stats, isLoading } = useAnalytics()
  const t = useT()

  const [aiInsight, setAiInsight] = useState<string | null>(null)
  const [isGeneratingInsight, setIsGeneratingInsight] = useState(false)

  const generateInsight = useCallback(async () => {
    if (!stats || !user) return
    const today = getLocalDate()
    const cached = getCachedInsight(user.id)
    if (cached?.date === today) {
      setAiInsight(cached.text)
      return
    }

    setIsGeneratingInsight(true)
    try {
      const prompt = `你是一位学习教练。根据以下用户数据，生成一段100-150字的个性化学习评估和建议（用中文）：

- 总学习天数：${stats.totalDays}
- 连续打卡天数：${stats.currentStreak}
- 最长连续打卡：${stats.longestStreak}
- 总学习时长：${stats.totalMinutes}分钟
- 平均完成率：${stats.averageCompletion}%
- 平均专注度：${stats.averageFocus}/10

请给出具体的、可操作的改进建议，语气鼓励但直接。不要重复数据，直接给出洞察。`
      const result = await chat(
        [{ role: "user", content: prompt }],
        { temperature: 0.7, maxTokens: 400 },
      )
      if (result) {
        setAiInsight(result)
        setCachedInsight(user.id, result)
      }
    } catch {
      // Fall back to template below
    } finally {
      setIsGeneratingInsight(false)
    }
  }, [stats, user])

  useEffect(() => {
    if (user) loadPlans()
  }, [user, loadPlans])

  useEffect(() => {
    if (stats) generateInsight()
  }, [stats, generateInsight])

  if (!isAuthenticated) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-4">
        <EmptyState
          title={t("common.pleaseLogin")}
          description={t("common.loginToView")}
          action={
            <Link href="/login" className="inline-flex items-center justify-center rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium h-9 px-4 py-2 transition-all">
              {t("common.goLogin")}
            </Link>
          }
        />
      </div>
    )
  }

  if (isLoading || !stats) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center">
        <LoadingSpinner size="lg" text={t("dashboard.loadingData")} />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">{t("dashboard.title")}</h1>
        <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-1">{t("dashboard.subtitle")}</p>
      </div>

      {/* Streak */}
      <StreakCard
        currentStreak={stats.currentStreak}
        longestStreak={stats.longestStreak}
        totalDays={stats.totalDays}
      />

      {/* Stats Grid */}
      <StatsGrid stats={stats} />

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <CompletionChart
          data={stats.weeklyGrowth}
          title={t("dashboard.weeklyCompletion")}
          dataKey="completionRate"
          color="#a855f7"
        />
        <FocusChart data={stats.weeklyGrowth} />
      </div>

      <CompletionChart
        data={stats.monthlyGrowth}
        title={t("dashboard.monthlyHours")}
        dataKey="totalMinutes"
        color="#6366f1"
        suffix={t("dashboard.minutes")}
        height={220}
      />

      {/* AI Memory Observations */}
      <AIObservations />

      {/* AI Coach Summary */}
      <Card className="border-purple-500/10 bg-gradient-to-r from-purple-600/[0.03] to-transparent">
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600/20 flex items-center justify-center flex-shrink-0">
              {isGeneratingInsight ? (
                <Loader2 className="h-5 w-5 text-purple-500 dark:text-purple-400 animate-spin" />
              ) : (
                <Brain className="h-5 w-5 text-purple-500 dark:text-purple-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-zinc-900 dark:text-white font-semibold mb-2">{t("dashboard.aiEvaluation")}</h3>
              {isGeneratingInsight ? (
                <p className="text-sm text-zinc-400 dark:text-zinc-500">{t("dashboard.generatingInsight")}</p>
              ) : aiInsight ? (
                <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">{aiInsight}</p>
              ) : (
                <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  {stats.averageCompletion >= 80
                    ? t("dashboard.highCompletion")
                    : stats.averageCompletion >= 60
                      ? t("dashboard.midCompletion")
                      : t("dashboard.lowCompletion")}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {plans.length === 0 && (
        <div className="text-center py-8">
          <p className="text-zinc-400 dark:text-zinc-500 text-sm mb-4">{t("dashboard.noPlan")}</p>
          <Link href="/chat" className="inline-flex items-center justify-center gap-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium h-9 px-4 py-2 transition-all">
            <Sparkles className="h-4 w-4" />
            {t("dashboard.startPlan")}
          </Link>
        </div>
      )}
    </div>
  )
}

function AIObservations() {
  const { entries } = useMemoryStore()
  const { config } = usePersonaStore()
  const t = useT()
  const tf = useTF()
  const language = useLanguageStore((s) => s.language)

  if (entries.length === 0) return null

  const recent = [...entries]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)

  return (
    <Card className="border-purple-500/10 dark:border-purple-500/15 bg-purple-600/[0.02] dark:bg-purple-500/[0.03] backdrop-blur-xl">
      <CardContent className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-purple-600/10 flex items-center justify-center">
            <Eye className="h-4 w-4 text-purple-500 dark:text-purple-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
              {config.name[language]} {t("dashboard.understanding")}
            </h3>
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
              {tf("dashboard.memoriesCount", { count: entries.length })}
            </p>
          </div>
        </div>

        <div className="space-y-2.5">
          {recent.map((entry, i) => (
            <div
              key={entry.id}
              className="flex items-start gap-2.5 text-sm animate-fade-in-up"
              style={{ animationDelay: `${i * 0.08}s` }}
            >
              <Lightbulb className="h-4 w-4 text-amber-500 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <span className="text-zinc-600 dark:text-zinc-300">{entry.content}</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-zinc-400 dark:text-zinc-500 capitalize">{entry.type}</span>
                  <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
                    {Math.round(entry.confidence * 100)}% {t("dashboard.confidence")}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
