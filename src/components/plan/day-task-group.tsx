"use client"

import type { DayPlan } from "@/types/plan"
import { DayTaskCard } from "@/components/plan/day-task-card"
import { cn } from "@/lib/cn"
import { useT } from "@/lib/i18n"
import { useState } from "react"

interface DayTaskGroupProps {
  day: DayPlan
  isToday: boolean
  isSelected: boolean
  onSelect: () => void
  onToggleTask: (taskId: string, completed: boolean) => void
  defaultExpanded?: boolean
}

export function DayTaskGroup({
  day,
  isToday,
  isSelected,
  onSelect,
  onToggleTask,
  defaultExpanded,
}: DayTaskGroupProps) {
  const t = useT()
  const [expanded, setExpanded] = useState(defaultExpanded ?? isToday)
  const doneCount = day.tasks.filter(t => t.completed).length
  const allDone = day.tasks.length > 0 && doneCount === day.tasks.length
  const isCurrent = isToday || isSelected

  return (
    <div
      onClick={onSelect}
      className={cn(
        "rounded-xl border overflow-hidden transition-all duration-200 cursor-pointer",
        isSelected && "border-yellow-500/35 bg-yellow-500/[0.04] shadow-lg shadow-yellow-500/[0.04]",
        isToday && !isSelected && "border-purple-500/15 bg-purple-500/[0.02]",
        !isToday && !isSelected && allDone && "border-black/[0.06] bg-black/[0.02] dark:border-white/[0.04] dark:bg-white/[0.005] opacity-70",
        !isToday && !isSelected && !allDone && "border-black/[0.06] bg-black/[0.02] dark:border-white/[0.04] dark:bg-white/[0.005]"
      )}
    >
      {/* Day header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-black/[0.02] dark:bg-white/[0.01] border-b border-black/[0.04] dark:border-white/[0.03]">
        <div className="flex items-center gap-2.5">
          {isCurrent && <div className="w-1.5 h-1.5 rounded-full bg-yellow-400" />}
          <span className={cn(
            "text-xs font-bold",
            isCurrent && "text-yellow-400",
            allDone && !isCurrent && "text-zinc-500",
            !isCurrent && !allDone && "text-zinc-400"
          )}>
            Day {day.dayNumber}{isToday ? ` · ${t("dayGroup.today")}` : ""}
          </span>
          <span className="text-[10px] text-zinc-600">{day.date}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.03] text-zinc-500">{day.focus}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn(
            "text-[10px]",
            allDone && "text-green-400",
            !allDone && isCurrent && "text-yellow-400",
            !allDone && !isCurrent && "text-zinc-600"
          )}>
            {allDone ? "✓ " : ""}{doneCount}/{day.tasks.length}
          </span>
          {day.tasks.length > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); setExpanded(!expanded) }}
              className="text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors"
            >
              {expanded ? "▲" : "▼"}
            </button>
          )}
        </div>
      </div>

      {/* Tasks */}
      {expanded && (
        <div className="px-3 py-2 space-y-1.5">
          {day.tasks.map((task) => (
            <DayTaskCard
              key={task.id}
              task={task}
              onToggle={(completed) => onToggleTask(task.id, completed)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
