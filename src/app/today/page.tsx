"use client"

import { useState, useEffect } from "react"
import { useAuthStore } from "@/stores/auth-store"
import { usePlanStore } from "@/stores/plan-store"
import { useCheckin } from "@/hooks/use-checkin"
import { TaskChecklist } from "@/components/checkin/task-checklist"
import { CheckinDialog, type CheckinFormData } from "@/components/checkin/checkin-dialog"
import { DailySummary } from "@/components/checkin/daily-summary"
import { EmptyState } from "@/components/shared/empty-state"
import { LoadingSpinner } from "@/components/shared/loading-spinner"
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
  const { plans, loadPlans } = usePlanStore()
  const activePlan = plans.find(p => p.status === "active")
  const { todayTasks, loadTodayTasks, updateTask } = usePlanStore()
  const { todayCheckin, streak, submitCheckin } = useCheckin(activePlan?.id)
  const [checkinOpen, setCheckinOpen] = useState(false)
  const [allCompleted, setAllCompleted] = useState(false)

  useEffect(() => {
    if (user) {
      loadPlans(user.id)
    }
  }, [user, loadPlans])

  useEffect(() => {
    if (activePlan) {
      loadTodayTasks(activePlan.id)
    }
  }, [activePlan, loadTodayTasks])

  // 检查是否所有任务完成
  useEffect(() => {
    if (todayTasks?.tasks && todayTasks.tasks.length > 0) {
      setAllCompleted(todayTasks.tasks.every(t => t.completed))
    }
  }, [todayTasks])

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

  // 今天已打卡
  if (todayCheckin) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-orange-400" />
          <h1 className="text-xl font-bold text-zinc-900 dark:text-white">{t("today.completed")}</h1>
          <Badge className="bg-green-600/20 text-green-400">{t("today.checkedIn")}</Badge>
        </div>

        <DailySummary checkin={todayCheckin} />

        <Card className="border-black/[0.04] dark:border-white/[0.04] bg-black/[0.01] dark:bg-white/[0.01]">
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
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-white">{t("today.title")}</h1>
          <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-1">
            {tf("today.streakDays", { days: streak })}
          </p>
        </div>
        {allCompleted && todayTasks && todayTasks.tasks.length > 0 && (
          <Button
            onClick={() => setCheckinOpen(true)}
            className="bg-gradient-to-r from-purple-600 to-violet-600 text-white gap-2 shadow-lg shadow-purple-600/25 hover:shadow-purple-600/40 transition-all"
          >
            {t("today.completeCheckin")}
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>

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

      {/* Checkin Dialog */}
      <CheckinDialog
        open={checkinOpen}
        onOpenChange={setCheckinOpen}
        onComplete={async (data: CheckinFormData) => {
          if (!activePlan || !todayTasks) return
          await submitCheckin({
            tasks: todayTasks.tasks.map(t => ({
              taskId: t.id,
              completed: t.completed,
              actualMinutes: t.durationMinutes,
              difficultyRating: t.difficulty === "hard" ? 4 : t.difficulty === "medium" ? 3 : 2,
            })),
            feedback: {
              stuckPoints: data.stuckPoints || "",
              difficulties: data.difficulties || "",
              summary: data.summary || "",
              focusScore: data.focusScore || 7,
              needAdjustment: data.needAdjustment || false,
              tomorrowGoal: data.tomorrowGoal || "",
            },
            focusLevel: data.focusScore,
            moodRating: 7,
          })
        }}
      />
    </div>
  )
}
