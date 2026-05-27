"use client"

import { cn } from "@/lib/cn"
import { Progress } from "@/components/ui/progress"

interface PlanProgressBarProps {
  completedTasks: number
  totalTasks: number
  currentDay: number
  totalDays: number
  className?: string
}

export function PlanProgressBar({ completedTasks, totalTasks, currentDay, totalDays, className }: PlanProgressBarProps) {
  const taskProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
  const dayProgress = Math.round((currentDay / totalDays) * 100)

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm text-zinc-500 dark:text-zinc-400">总体进度</span>
        <span className="text-sm font-mono text-purple-500 dark:text-purple-400">{dayProgress}%</span>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-zinc-400 dark:text-zinc-500">
          <span>时间进度</span>
          <span>Day {currentDay} / {totalDays}</span>
        </div>
        <Progress value={dayProgress} className="h-1.5 bg-black/[0.04] dark:bg-white/[0.04] [&>div]:bg-purple-600 [&>div]:shadow-[0_0_10px_rgba(168,85,247,0.5)]" />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-zinc-400 dark:text-zinc-500">
          <span>任务完成</span>
          <span>{completedTasks} / {totalTasks}</span>
        </div>
        <Progress value={taskProgress} className="h-1.5 bg-black/[0.04] dark:bg-white/[0.04] [&>div]:bg-green-500 [&>div]:shadow-[0_0_10px_rgba(34,197,94,0.3)]" />
      </div>
    </div>
  )
}
