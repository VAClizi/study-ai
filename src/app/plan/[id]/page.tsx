"use client"

import { useParams } from "next/navigation"
import { usePlan } from "@/hooks/use-plan"
import { useAuthStore } from "@/stores/auth-store"
import { PlanTimeline } from "@/components/plan/plan-timeline"
import { TheoryPanel } from "@/components/plan/theory-panel"
import { PlanProgressBar } from "@/components/plan/progress-bar"
import { DayTaskCard } from "@/components/plan/day-task-card"
import { LoadingSpinner } from "@/components/shared/loading-spinner"
import { EmptyState } from "@/components/shared/empty-state"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, BookOpen, Calendar, Target, BarChart3, Lightbulb } from "lucide-react"
import Link from "next/link"

export default function PlanDetailPage() {
  const params = useParams()
  const planId = params.id as string
  const { isAuthenticated } = useAuthStore()
  const { currentPlan, isLoading, toggleTask } = usePlan(planId)

  if (!isAuthenticated) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-4">
        <EmptyState
          title="请先登录"
          description="登录后查看你的学习计划"
          action={
            <Link href="/login" className="inline-flex items-center justify-center rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium h-9 px-4 py-2 transition-all">
              去登录
            </Link>
          }
        />
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center">
        <LoadingSpinner size="lg" text="加载学习计划..." />
      </div>
    )
  }

  if (!currentPlan) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-4">
        <EmptyState
          title="计划不存在"
          description="找不到这个学习计划，它可能已被删除。"
          action={
            <Link href="/chat" className="inline-flex items-center justify-center rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium h-9 px-4 py-2 transition-all">
              创建新计划
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
  for (const stage of currentPlan.stages) {
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

  const statusMap: Record<string, { label: string; className: string }> = {
    active: { label: "进行中", className: "bg-green-600/20 text-green-400" },
    completed: { label: "已完成", className: "bg-blue-600/20 text-blue-400" },
    paused: { label: "已暂停", className: "bg-zinc-600/20 text-zinc-400" },
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
              {currentPlan.mode === "quick" ? "快速定制" : "深度规划"}
            </Badge>
            <Badge className={statusInfo.className}>{statusInfo.label}</Badge>
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">{currentPlan.title}</h1>
        </div>
        <div className="flex gap-2">
          <Link href="/today" className="inline-flex items-center justify-center rounded-lg border border-black/10 dark:border-white/10 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white text-sm font-medium h-8 px-3 py-1 transition-all">
            今日打卡
          </Link>
        </div>
      </div>

      {/* Goal & Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="border-black/[0.04] dark:border-white/[0.04] bg-black/[0.01] dark:bg-white/[0.01]">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-purple-500 dark:text-purple-400" />
              <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300">学习目标</span>
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{currentPlan.goal.title}</p>
          </CardContent>
        </Card>
        <Card className="border-black/[0.04] dark:border-white/[0.04] bg-black/[0.01] dark:bg-white/[0.01]">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-purple-500 dark:text-purple-400" />
              <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300">课程周期</span>
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{currentPlan.stages.length} 个阶段 · {totalDays} 天</p>
          </CardContent>
        </Card>
        <Card className="border-black/[0.04] dark:border-white/[0.04] bg-black/[0.01] dark:bg-white/[0.01]">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="h-4 w-4 text-purple-500 dark:text-purple-400" />
              <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300">科学理论</span>
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{currentPlan.theories.length} 项理论支撑</p>
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

      {/* Tabs: Timeline vs Theory */}
      <Tabs defaultValue="timeline">
        <TabsList className="bg-black/[0.03] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.04]">
          <TabsTrigger value="timeline" className="data-[state=active]:bg-black/[0.06] dark:data-[state=active]:bg-white/[0.06] gap-1.5">
            <BarChart3 className="h-3.5 w-3.5" />
            阶段规划
          </TabsTrigger>
          <TabsTrigger value="theory" className="data-[state=active]:bg-black/[0.06] dark:data-[state=active]:bg-white/[0.06] gap-1.5">
            <Lightbulb className="h-3.5 w-3.5" />
            科学依据
          </TabsTrigger>
        </TabsList>

        <TabsContent value="timeline" className="mt-6 space-y-6">
          <PlanTimeline stages={currentPlan.stages} />

          {/* Week detail with tasks */}
          {currentPlan.stages.map((stage) =>
            stage.weeks.map((week) => (
              <div key={`${stage.id}-${week.weekNumber}`} className="space-y-3">
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                  第 {week.weekNumber} 周
                  <Badge className="bg-black/5 dark:bg-white/5 text-zinc-400 dark:text-zinc-500 text-xs font-normal">
                    {week.goal}
                  </Badge>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {week.days.map((day) => (
                    <Card key={day.dayNumber} className="border-black/[0.04] dark:border-white/[0.04] bg-black/[0.01] dark:bg-white/[0.01]">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-zinc-900 dark:text-white flex items-center justify-between">
                          Day {day.dayNumber}
                          <Badge className="bg-black/5 dark:bg-white/5 text-zinc-400 dark:text-zinc-500 text-[10px]">
                            {day.totalMinutes} 分钟
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {day.tasks.map((task) => (
                          <DayTaskCard
                            key={task.id}
                            task={task}
                            onToggle={(completed) => toggleTask(currentPlan.id, day.dayNumber, task.id, completed)}
                          />
                        ))}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))
          )}
        </TabsContent>

        <TabsContent value="theory" className="mt-6">
          <TheoryPanel theories={currentPlan.theories} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
