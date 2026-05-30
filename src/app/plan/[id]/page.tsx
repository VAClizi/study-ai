"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { usePlan } from "@/hooks/use-plan"
import { useAuthStore } from "@/stores/auth-store"
import { LearningRoadmap } from "@/components/plan/learning-roadmap"
import { TheoryPanel } from "@/components/plan/theory-panel"
import { PlanProgressBar } from "@/components/plan/progress-bar"
import { LoadingSpinner } from "@/components/shared/loading-spinner"
import { EmptyState } from "@/components/shared/empty-state"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, BookOpen, Calendar, Target, Lightbulb, Trash2, Loader2 } from "lucide-react"
import Link from "next/link"
import { useT, useTF } from "@/lib/i18n"

export default function PlanDetailPage() {
  const params = useParams()
  const planId = params.id as string
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()
  const { currentPlan, isLoading, toggleTask, deletePlan } = usePlan(planId)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const t = useT()
  const tf = useTF()

  const handleDelete = async () => {
    if (!currentPlan) return
    setIsDeleting(true)
    try {
      await deletePlan(currentPlan.id)
      router.push("/plans")
    } catch {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
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

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center">
        <LoadingSpinner size="lg" text={t("planDetail.loadingPlan")} />
      </div>
    )
  }

  if (!currentPlan) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-4">
        <EmptyState
          title={t("planDetail.planNotFound")}
          description={t("planDetail.planNotFoundDesc")}
          action={
            <Link href="/chat" className="inline-flex items-center justify-center rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium h-9 px-4 py-2 transition-all">
              {t("planDetail.createNewPlan")}
            </Link>
          }
        />
      </div>
    )
  }

  // 计算总任务、完成任务、总天数、当前天数
  let totalTasks = 0
  let completedTasks = 0
  let totalDays = 0
  for (const stage of currentPlan.stages ?? []) {
    for (const week of stage.weeks) {
      for (const day of week.days) {
        totalTasks += day.tasks.length
        completedTasks += day.tasks.filter(t => t.completed).length
      }
      totalDays += week.days.length
    }
  }

  const startDate = new Date(currentPlan.createdAt)
  const today = new Date()
  const currentDay = Math.min(
    Math.max(1, Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1),
    totalDays
  )

  const statusMap: Record<string, { labelKey: string; className: string }> = {
    active: { labelKey: "planDetail.active", className: "bg-green-600/20 text-green-400" },
    completed: { labelKey: "planDetail.completed", className: "bg-blue-600/20 text-blue-400" },
    paused: { labelKey: "planDetail.paused", className: "bg-zinc-600/20 text-zinc-400" },
  }
  const statusInfo = statusMap[currentPlan.status] || statusMap.active

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/chat" className="inline-flex items-center justify-center rounded-lg hover:bg-black/10 dark:hover:bg-white/10 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white text-sm font-medium h-8 w-8 transition-all">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Badge className={currentPlan.mode === "quick" ? "bg-blue-600/20 text-blue-400" : "bg-purple-600/20 text-purple-600 dark:text-purple-300"}>
              {currentPlan.mode === "quick" ? t("planDetail.quickMode") : t("planDetail.detailedMode")}
            </Badge>
            <Badge className={statusInfo.className}>{t(statusInfo.labelKey)}</Badge>
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">{currentPlan.title}</h1>
        </div>
        <div className="flex gap-2">
          <Link href="/today" className="inline-flex items-center justify-center rounded-lg border border-black/10 dark:border-white/10 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white text-sm font-medium h-8 px-3 py-1 transition-all">
            {t("planDetail.todayCheckin")}
          </Link>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="inline-flex items-center gap-1.5 justify-center rounded-lg border border-red-200 dark:border-red-500/20 text-red-500 hover:text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 text-sm font-medium h-8 px-3 py-1 transition-all"
          >
            <Trash2 className="h-3.5 w-3.5" />
            {t("planDetail.delete")}
          </button>
        </div>
      </div>

      {/* Goal & Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="border-black/[0.04] dark:border-white/[0.04] bg-black/[0.01] dark:bg-white/[0.01]">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-purple-500 dark:text-purple-400" />
              <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300">{t("planDetail.goal")}</span>
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{currentPlan.goal.title}</p>
          </CardContent>
        </Card>
        <Card className="border-black/[0.04] dark:border-white/[0.04] bg-black/[0.01] dark:bg-white/[0.01]">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-purple-500 dark:text-purple-400" />
              <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300">{t("planDetail.duration")}</span>
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{tf("planDetail.stagesFormat", { stages: currentPlan.stages.length, days: totalDays })}</p>
          </CardContent>
        </Card>
        <Card className="border-black/[0.04] dark:border-white/[0.04] bg-black/[0.01] dark:bg-white/[0.01]">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="h-4 w-4 text-purple-500 dark:text-purple-400" />
              <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300">{t("planDetail.theory")}</span>
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{tf("planDetail.theoryCount", { count: currentPlan.theories.length })}</p>
          </CardContent>
        </Card>
      </div>

      {/* Progress */}
      <PlanProgressBar
        completedTasks={completedTasks}
        totalTasks={totalTasks}
        currentDay={currentDay}
        totalDays={totalDays}
      />

      {/* Learning Roadmap */}
      <LearningRoadmap
        stages={currentPlan.stages}
        currentDay={currentDay}
        onToggleTask={(dayNumber, taskId, completed) =>
          toggleTask(currentPlan.id, dayNumber, taskId, completed)
        }
      />

      {/* Scientific Basis */}
      <div className="mt-6">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="h-4 w-4 text-purple-400" />
          <h2 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">{t("planDetail.scientificBasis")}</h2>
        </div>
        <TheoryPanel theories={currentPlan.theories} />
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(false)} />
          <div className="relative bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-2xl p-6 max-w-md w-full mx-4 animate-in fade-in zoom-in">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
              {t("planDetail.delete")}
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6 leading-relaxed">
              {t("planDetail.deleteConfirm")}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="inline-flex items-center justify-center rounded-lg border border-black/10 dark:border-white/10 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white text-sm font-medium h-9 px-4 py-2 transition-all disabled:opacity-50"
              >
                {t("planDetail.cancel")}
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="inline-flex items-center gap-1.5 justify-center rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium h-9 px-4 py-2 transition-all disabled:opacity-50"
              >
                {isDeleting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
                {t("planDetail.confirmDelete")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
