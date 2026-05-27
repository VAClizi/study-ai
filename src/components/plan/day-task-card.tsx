"use client"

import type { DayTask } from "@/types/plan"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/cn"
import { Clock, Gauge, Flag } from "lucide-react"

interface DayTaskCardProps {
  task: DayTask
  onToggle: (completed: boolean) => void
  disabled?: boolean
}

const priorityConfig = {
  high: { label: "高优先", color: "text-red-500 dark:text-red-400 bg-red-500/10" },
  medium: { label: "中优先", color: "text-yellow-500 dark:text-yellow-400 bg-yellow-500/10" },
  low: { label: "低优先", color: "text-zinc-500 dark:text-zinc-400 bg-black/5 dark:bg-white/5" },
}

const difficultyConfig = {
  easy: { label: "简单", stars: "⭐" },
  medium: { label: "中等", stars: "⭐⭐" },
  hard: { label: "困难", stars: "⭐⭐⭐" },
}

export function DayTaskCard({ task, onToggle, disabled }: DayTaskCardProps) {
  const priority = priorityConfig[task.priority]
  const difficulty = difficultyConfig[task.difficulty]

  return (
    <Card
      className={cn(
        "border transition-all relative group",
        task.completed
          ? "border-green-500/10 bg-green-500/[0.02] opacity-70"
          : "border-black/[0.04] dark:border-white/[0.04] bg-black/[0.01] dark:bg-white/[0.01] hover:border-black/[0.08] dark:hover:border-white/[0.08]"
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Checkbox
            checked={task.completed}
            onCheckedChange={(checked) => onToggle(checked as boolean)}
            disabled={disabled}
            className="mt-0.5 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
          />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h4 className={cn(
                "text-sm font-medium transition-all",
                task.completed ? "text-zinc-400 dark:text-zinc-500 line-through" : "text-zinc-900 dark:text-white"
              )}>
                {task.title}
              </h4>
            </div>

            <p className={cn(
              "text-xs mb-3",
              task.completed ? "text-zinc-400 dark:text-zinc-600" : "text-zinc-500 dark:text-zinc-400"
            )}>
              {task.description}
            </p>

            <div className="flex items-center gap-2 flex-wrap">
              <span className="flex items-center gap-1 text-xs text-zinc-400 dark:text-zinc-500">
                <Clock className="h-3 w-3" />
                {task.durationMinutes} 分钟
              </span>

              <Badge className={cn("text-[10px] px-1.5 py-0", priority.color)}>
                <Flag className="h-2.5 w-2.5 mr-0.5" />
                {priority.label}
              </Badge>

              <Badge className="text-[10px] px-1.5 py-0 bg-black/5 dark:bg-white/5 text-zinc-400 dark:text-zinc-500">
                {difficulty.stars}
              </Badge>

              {task.theoryBasis && (
                <Badge className="text-[10px] px-1.5 py-0 bg-purple-500/10 text-purple-500 dark:text-purple-400">
                  {task.theoryBasis}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
