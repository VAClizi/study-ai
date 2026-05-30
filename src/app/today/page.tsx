"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/stores/auth-store"
import { usePlanStore } from "@/stores/plan-store"
import { useCheckin } from "@/hooks/use-checkin"
import { useCheckinStore } from "@/stores/checkin-store"
import { useChatStore } from "@/stores/chat-store"
import type { CheckinInitData } from "@/types/checkin"
import { TaskChecklist } from "@/components/checkin/task-checklist"
import { StreakFireBar } from "@/components/checkin/streak-fire-bar"
import { DailySummary } from "@/components/checkin/daily-summary"
import { EmptyState } from "@/components/shared/empty-state"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Flame, ArrowRight } from "lucide-react"
import Link from "next/link"
import { useT, useTF } from "@/lib/i18n"

export default function TodayPage() {
  const { isAuthenticated, user } = useAuthStore()
  const t = useT()
  const tf = useTF()
  const router = useRouter()
  const { plans, loadPlans } = usePlanStore()
  const activePlan = plans.find((p) => p.status === "active")
  const { todayTasks, loadTodayTasks, updateTask } = usePlanStore()
  const { todayCheckin, streak } = useCheckin(activePlan?.id)
  const setCheckinInitData = useChatStore((s) => s.setCheckinInitData)
  const [allCompleted, setAllCompleted] = useState(false)

  useEffect(() => {
    if (user) {
      loadPlans()
    }
  }, [user, loadPlans])

  useEffect(() => {
    if (activePlan) {
      loadTodayTasks(activePlan.id)
    }
  }, [activePlan, loadTodayTasks])

  useEffect(() => {
    if (todayTasks?.tasks && todayTasks.tasks.length > 0) {
      setAllCompleted(todayTasks.tasks.every((t) => t.completed))
    }
  }, [todayTasks])

  const handleStartCheckin = () => {
    if (!activePlan || !todayTasks) return

    const initData: CheckinInitData = {
      planId: activePlan.id,
      planTitle: activePlan.title,
      todayDayNumber: todayTasks.dayNumber,
      tasks: todayTasks.tasks.map((t) => ({
        taskId: t.id,
        title: t.title,
        description: t.description,
        completed: t.completed,
        difficulty: t.difficulty,
        durationMinutes: t.durationMinutes,
      })),
      streak: useCheckinStore.getState().streak,
      planChatSessionId: activePlan.chatSessionId ?? null,
    }

    setCheckinInitData(initData)

    const autoPrompt = "我来打卡今日学习"

    if (activePlan.chatSessionId) {
      router.push(
        `/chat?session=${activePlan.chatSessionId}` +
        `&prompt=${encodeURIComponent(autoPrompt)}` +
        `&source=checkin`
      )
    } else {
      router.push(
        `/chat?prompt=${encodeURIComponent(autoPrompt)}` +
        `&source=checkin` +
        `&planId=${activePlan.id}`
      )
    }
  }

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

  if (!activePlan) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-4">
        <EmptyState
          title={t("today.noPlan")}
          description={t("today.noPlanDesc")}
          action={
            <Link href="/chat" className="inline-flex items-center justify-center gap-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium h-9 px-4 py-2 transition-all">
              <Sparkles className="h-4 w-4" />
              {t("today.startAIPlan")}
            </Link>
          }
        />
      </div>
    )
  }

  // Already checked in today
  if (todayCheckin) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center gap-2 animate-fade-in-up">
          <Flame className="h-5 w-5 text-orange-400" />
          <h1 className="text-xl font-bold text-zinc-900 dark:text-white">{t("today.completed")}</h1>
          <Badge className="bg-green-600/20 text-green-400">{t("today.checkedIn")}</Badge>
        </div>

        <StreakFireBar
          streakDays={streak}
          checkedInToday={true}
          tomorrowGoal={todayCheckin.feedback?.tomorrowGoal}
        />

        <DailySummary checkin={todayCheckin} />

        <Card className="border-black/[0.04] dark:border-white/[0.04] bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm">
          <CardContent className="p-4 text-center">
            <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-3">{t("today.aiCoachMessage")}</p>
            <p className="text-zinc-900 dark:text-white font-medium">
              {tf("today.streakDays", { days: streak })}
            </p>
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Link href="/dashboard" className="flex-1 inline-flex items-center justify-center rounded-lg border border-black/10 dark:border-white/10 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white text-sm font-medium h-9 px-4 py-2 transition-all">
            {t("today.viewDashboard")}
          </Link>
          <Link href={`/plan/${activePlan.id}`} className="flex-1 inline-flex items-center justify-center rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium h-9 px-4 py-2 transition-all">
            {t("today.viewFullPlan")}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between animate-stagger-1">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-white">{t("today.title")}</h1>
          <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-1">
            {tf("today.streakDays", { days: streak })}
          </p>
        </div>
        {allCompleted && todayTasks && todayTasks.tasks.length > 0 && (
          <Button
            onClick={handleStartCheckin}
            className="bg-gradient-to-r from-purple-600 to-violet-600 text-white gap-2 shadow-lg shadow-purple-600/25 hover:shadow-purple-600/40 transition-all"
          >
            {t("today.completeCheckin")}
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Streak bar (not checked in yet) */}
      <StreakFireBar
        streakDays={streak}
        checkedInToday={false}
      />

      {/* Tasks */}
      {todayTasks ? (
        <TaskChecklist
          tasks={todayTasks.tasks}
          dayNumber={todayTasks.dayNumber}
          date={todayTasks.date}
          onToggleTask={(taskId, completed) => {
            if (activePlan) {
              updateTask(activePlan.id, todayTasks.dayNumber, taskId, completed)
            }
          }}
        />
      ) : (
        <EmptyState
          title={t("today.loadingTasks")}
          description={t("today.loadingTasksDesc")}
        />
      )}

      {/* AI Coach message */}
      {!allCompleted && (
        <Card className="border-purple-500/10 bg-purple-600/[0.02]">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-600/20 flex items-center justify-center flex-shrink-0">
                <Sparkles className="h-4 w-4 text-purple-500 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-purple-600 dark:text-purple-300 mb-1">{t("today.aiCoachTip")}</p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  {t("today.coachMessage")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
