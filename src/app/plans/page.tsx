"use client"

import { useEffect, useState } from "react"
import { usePlanStore } from "@/stores/plan-store"
import { useAuthStore } from "@/stores/auth-store"
import { getAllStoredSessions } from "@/stores/chat-store"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/shared/empty-state"
import { LoadingSpinner } from "@/components/shared/loading-spinner"
import type { LearningPlan } from "@/types/plan"
import {
  ClipboardList, MessageSquare, ArrowRight, Target, Calendar,
  BarChart3, Zap, BookOpen,
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/cn"
import { useT, useTF } from "@/lib/i18n"
import { useLanguageStore } from "@/stores/language-store"

function calcPlanStats(plan: LearningPlan) {
  let totalTasks = 0
  let completedTasks = 0
  let totalMinutes = 0

  for (const stage of plan.stages ?? []) {
    for (const week of stage.weeks) {
      for (const day of week.days) {
        for (const task of day.tasks) {
          totalTasks++
          totalMinutes += task.durationMinutes
          if (task.completed) completedTasks++
        }
      }
    }
  }

  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
  const totalDays = totalTasks > 0
    ? plan.stages.reduce((acc, s) => acc + s.weeks.reduce((wacc, w) => wacc + w.days.length, 0), 0)
    : 0

  return { totalTasks, completedTasks, totalMinutes, completionRate, totalDays }
}

function getModeBadge(mode: "quick" | "detailed", t: (key: string) => string) {
  return mode === "quick"
    ? { label: t("plans.quickMode"), icon: Zap, color: "bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/20" }
    : { label: t("plans.detailedMode"), icon: BookOpen, color: "bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500/20" }
}

function getStatusBadge(status: "active" | "completed" | "paused", t: (key: string) => string) {
  switch (status) {
    case "active":
      return { label: t("plans.active"), color: "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400" }
    case "completed":
      return { label: t("plans.completed"), color: "bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400" }
    case "paused":
      return { label: t("plans.paused"), color: "bg-zinc-100 dark:bg-zinc-500/20 text-zinc-500 dark:text-zinc-400" }
  }
}

export default function PlansPage() {
  const { user, isAuthenticated } = useAuthStore()
  const { plans, isLoading, loadPlans } = usePlanStore()
  const [storedSessionIds, setStoredSessionIds] = useState<Set<string>>(new Set())
  const t = useT()
  const language = useLanguageStore((s) => s.language)

  useEffect(() => {
    if (user) {
      loadPlans()
    }
  }, [user, loadPlans])

  useEffect(() => {
    getAllStoredSessions().then((sessions) => {
      setStoredSessionIds(new Set(sessions.map((s) => s.id)))
    })
  }, [plans])

  if (!isAuthenticated) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-4">
        <EmptyState
          title={t("common.pleaseLogin")}
          description={t("common.loginToView")}
          action={
            <Link href="/login" className="inline-flex items-center justify-center rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium h-9 px-4 py-2 transition-all">
              {t("chat.loginRegister")}
            </Link>
          }
        />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-purple-600/10 dark:bg-purple-500/15 flex items-center justify-center">
          <ClipboardList className="h-5 w-5 text-purple-600 dark:text-purple-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">{t("plans.title")}</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {t("plans.subtitle")}
          </p>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner size="lg" text={t("plans.loading")} />
        </div>
      )}

      {/* Plan list */}
      {!isLoading && plans.length > 0 && (
        <div className="grid grid-cols-1 gap-4">
          {plans.map((plan) => {
            const stats = calcPlanStats(plan)
            const modeBadge = getModeBadge(plan.mode, t)
            const statusBadge = getStatusBadge(plan.status, t)
            const hasSession = plan.chatSessionId && storedSessionIds.has(plan.chatSessionId)
            const ModeIcon = modeBadge.icon

            return (
              <Card
                key={plan.id}
                className="border-black/[0.04] dark:border-white/[0.04] bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm hover:border-purple-500/20 dark:hover:border-purple-500/20 transition-all"
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    {/* Left: Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-base font-semibold text-zinc-900 dark:text-white truncate">
                          {plan.goal.title}
                        </h3>
                        <Badge className={cn("text-[10px] border", modeBadge.color)}>
                          <ModeIcon className="h-3 w-3 mr-1" />
                          {modeBadge.label}
                        </Badge>
                        <Badge className={cn("text-[10px]", statusBadge.color)}>
                          {statusBadge.label}
                        </Badge>
                      </div>

                      <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-3 line-clamp-1">
                        {plan.goal.description}
                      </p>

                      {/* Stats row */}
                      <div className="flex items-center gap-4 text-xs text-zinc-400 dark:text-zinc-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(plan.createdAt).toLocaleDateString(language)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Target className="h-3 w-3" />
                          {stats.totalDays} {t("plans.days")} · {stats.totalTasks} {t("plans.tasks")}
                        </span>
                        <span className="flex items-center gap-1">
                          <BarChart3 className="h-3 w-3" />
                          {stats.completionRate}% {t("plans.completion")}
                        </span>
                      </div>

                      {/* Progress bar */}
                      {stats.totalTasks > 0 && (
                        <div className="mt-3 h-1.5 rounded-full bg-black/[0.04] dark:bg-white/[0.04] overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-purple-500 to-purple-400 transition-all"
                            style={{ width: `${stats.completionRate}%` }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Right: Actions */}
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      {hasSession ? (
                        <Link
                          href={`/chat?session=${plan.chatSessionId}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium transition-all"
                        >
                          <MessageSquare className="h-3.5 w-3.5" />
                          {t("plans.continueChat")}
                        </Link>
                      ) : (
                        <span className="text-[10px] text-zinc-400 dark:text-zinc-500 italic">
                          {t("plans.expired")}
                        </span>
                      )}
                      <Link
                        href={`/plan/${plan.id}`}
                        className="inline-flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                      >
                        {t("plans.viewPlan")} <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && plans.length === 0 && (
        <div className="py-20">
          <EmptyState
            title={t("plans.noPlans")}
            description={t("plans.noPlansDesc")}
            action={
              <Link href="/chat" className="inline-flex items-center justify-center rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium h-9 px-4 py-2 transition-all">
                {t("plans.startPlan")}
              </Link>
            }
          />
        </div>
      )}
    </div>
  )
}
