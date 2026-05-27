"use client"

import { useState, useEffect } from "react"
import { useAuthStore } from "@/stores/auth-store"
import { useCheckinStore } from "@/stores/checkin-store"
import { useMemoryStore } from "@/stores/memory-store"
import { useT } from "@/lib/i18n"
import { Card, CardContent } from "@/components/ui/card"
import { Flame, Target, Brain, ArrowRight, Sparkles, Lightbulb, Eye, TrendingUp } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/cn"

export function GrowthPreview() {
  const { isAuthenticated, user } = useAuthStore()
  const { streak } = useCheckinStore()
  const { entries, getMemoriesByType } = useMemoryStore()
  const t = useT()
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)
  const [observations, setObservations] = useState<string[]>([])

  useEffect(() => {
    // Build AI observations from memory and real data
    const obs: string[] = []

    const goals = getMemoriesByType("goal")
    const habits = getMemoriesByType("habit")
    const preferences = getMemoriesByType("preference")
    const patterns = getMemoriesByType("pattern")

    if (goals.length > 0) {
      obs.push(goals[goals.length - 1].content)
    }
    if (habits.length > 0) {
      obs.push(habits[habits.length - 1].content)
    }
    if (preferences.length > 0) {
      obs.push(preferences[0].content)
    }

    // Add streak observation
    if (streak >= 7) {
      obs.push(`连续 ${streak} 天坚持学习，习惯正在形成`)
    } else if (streak >= 3) {
      obs.push(`已连续学习 ${streak} 天，继续保持`)
    }

    // Add auto-generated insights if we have data
    if (obs.length > 0) {
      setObservations(obs)
    }
  }, [entries, streak, getMemoriesByType])

  if (!isAuthenticated) {
    return (
      <section className="py-16 px-4">
        <div className="max-w-lg mx-auto">
          <Card className="border-black/[0.05] dark:border-white/[0.05] bg-white/60 dark:bg-zinc-900/40 backdrop-blur-xl overflow-hidden transition-all duration-500 hover:border-purple-500/15 dark:hover:border-purple-500/20 hover:shadow-lg hover:shadow-purple-500/[0.04]">
            <CardContent className="p-8 text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-purple-600/10 flex items-center justify-center">
                <Eye className="h-6 w-6 text-purple-500 dark:text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
                {t("home.growthPreview")}
              </h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
                {t("home.loginToView")}
              </p>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-purple-600/20 hover:shadow-purple-600/30"
              >
                {t("common.goLogin")}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>
    )
  }

  const stats = [
    {
      id: "streak",
      icon: Flame,
      value: `${streak}`,
      unit: t("today.days"),
      label: t("today.streakDays"),
      bgColor: "bg-orange-500/10",
      iconColor: "text-orange-500 dark:text-orange-400",
    },
    {
      id: "goal",
      icon: Target,
      value: `${user?.settings?.weeklyGoalHours ?? 20}`,
      unit: "h",
      label: t("settings.weeklyGoal"),
      bgColor: "bg-purple-500/10",
      iconColor: "text-purple-500 dark:text-purple-400",
    },
    {
      id: "ai",
      icon: Brain,
      value: `${Math.min(entries.length, 99)}`,
      unit: "",
      label: "AI 记忆",
      bgColor: "bg-emerald-500/10",
      iconColor: "text-emerald-500 dark:text-emerald-400",
    },
  ]

  return (
    <section className="py-16 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Section header */}
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-xl bg-purple-600/10 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-purple-500 dark:text-purple-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
              {t("home.growthPreview")}
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">{user?.name}</p>
          </div>
          <Link
            href="/dashboard"
            className="ml-auto inline-flex items-center gap-1.5 text-xs text-purple-600 dark:text-purple-400 hover:text-purple-500 dark:hover:text-purple-300 transition-colors font-medium"
          >
            {t("today.viewDashboard")}
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-3 gap-3">
          {stats.map((stat) => (
            <Card
              key={stat.id}
              onMouseEnter={() => setHoveredCard(stat.id)}
              onMouseLeave={() => setHoveredCard(null)}
              className={cn(
                "border-black/[0.04] dark:border-white/[0.04]",
                "bg-white/60 dark:bg-zinc-900/40 backdrop-blur-xl",
                "transition-all duration-500",
                hoveredCard === stat.id
                  ? "border-purple-500/15 dark:border-purple-500/20 shadow-lg shadow-purple-500/[0.04] -translate-y-1"
                  : "shadow-sm",
              )}
            >
              <CardContent className="p-4 flex flex-col items-center text-center gap-1.5">
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", stat.bgColor)}>
                  <stat.icon className={cn("h-4 w-4", stat.iconColor)} />
                </div>
                <div className="flex items-baseline gap-0.5">
                  <span className="text-2xl font-bold text-zinc-900 dark:text-white">{stat.value}</span>
                  <span className="text-xs text-zinc-400 dark:text-zinc-500">{stat.unit}</span>
                </div>
                <span className="text-[11px] text-zinc-400 dark:text-zinc-500">{stat.label}</span>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* AI Observation Panel */}
        {observations.length > 0 && (
          <Card className="border-purple-500/10 dark:border-purple-500/15 bg-purple-600/[0.02] dark:bg-purple-500/[0.03] backdrop-blur-xl overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-purple-600/10 flex items-center justify-center">
                  <Eye className="h-3.5 w-3.5 text-purple-500 dark:text-purple-400" />
                </div>
                <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                  AI 观察
                </span>
                <span className="text-[10px] text-zinc-400 dark:text-zinc-500 ml-auto">
                  基于你的使用数据
                </span>
              </div>

              <div className="space-y-2.5 mb-4">
                {observations.map((obs, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2.5 text-sm animate-fade-in-up"
                    style={{ animationDelay: `${i * 0.1}s` }}
                  >
                    <Lightbulb className="h-4 w-4 text-amber-500 dark:text-amber-400 shrink-0 mt-0.5" />
                    <span className="text-zinc-600 dark:text-zinc-300">{obs}</span>
                  </div>
                ))}
              </div>

              <Link
                href="/chat"
                className="inline-flex items-center gap-1.5 text-xs text-purple-600 dark:text-purple-400 hover:text-purple-500 dark:hover:text-purple-300 transition-colors font-medium"
              >
                和 AI 教练聊聊这些观察
                <ArrowRight className="h-3 w-3" />
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Quick action: if no observations yet, prompt user to start */}
        {observations.length === 0 && (
          <Card className="border-dashed border-black/[0.06] dark:border-white/[0.06] bg-transparent">
            <CardContent className="p-5 text-center">
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-3">
                AI 还在了解你。开始对话让 AI 记住你的学习偏好和目标。
              </p>
              <Link
                href="/chat"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Sparkles className="h-4 w-4" />
                开始对话
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </section>
  )
}
