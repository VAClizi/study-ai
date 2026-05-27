"use client"

import type { DayTask } from "@/types/plan"
import { DayTaskCard } from "@/components/plan/day-task-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PlanProgressBar } from "@/components/plan/progress-bar"
import { CalendarCheck, TrendingUp } from "lucide-react"

interface TaskChecklistProps {
  tasks: DayTask[]
  dayNumber: number
  date: string
  onToggleTask: (taskId: string, completed: boolean) => void
  totalDays?: number
}

export function TaskChecklist({ tasks, dayNumber, date, onToggleTask, totalDays = 56 }: TaskChecklistProps) {
  const completed = tasks.filter(t => t.completed).length
  const completionRate = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0

  return (
    <div className="space-y-4">
      {/* Today Header Card */}
      <Card className="border-purple-500/20 bg-gradient-to-br from-purple-600/[0.05] to-transparent">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 mb-1">
                <CalendarCheck className="h-4 w-4 text-purple-500 dark:text-purple-400" />
                <span>{date}</span>
              </div>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Day {dayNumber}</h2>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <TrendingUp className="h-4 w-4 text-green-400" />
              <span className="text-green-400 font-semibold">{completionRate}%</span>
            </div>
          </div>

          <PlanProgressBar
            completedTasks={completed}
            totalTasks={tasks.length}
            currentDay={dayNumber}
            totalDays={totalDays}
          />
        </CardContent>
      </Card>

      {/* Task list */}
      <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 px-1">
        今日任务 ({completed}/{tasks.length})
      </h3>

      <div className="space-y-2">
        {tasks.map((task) => (
          <DayTaskCard
            key={task.id}
            task={task}
            onToggle={(completed) => onToggleTask(task.id, completed)}
          />
        ))}
      </div>
    </div>
  )
}
