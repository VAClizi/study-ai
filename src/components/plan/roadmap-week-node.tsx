"use client"

import { cn } from "@/lib/cn"
import type { WeekPlan } from "@/types/plan"

interface RoadmapWeekNodeProps {
  week: WeekPlan
  isCompleted: boolean
  isCurrent: boolean
  isSelected: boolean
  onClick: () => void
}

export function RoadmapWeekNode({
  week,
  isCompleted,
  isCurrent,
  isSelected,
  onClick,
}: RoadmapWeekNodeProps) {
  const done = week.days.reduce((acc, d) => acc + d.tasks.filter(t => t.completed).length, 0)
  const total = week.days.reduce((acc, d) => acc + d.tasks.length, 0)

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-[110px] p-2.5 rounded-lg border text-left transition-all duration-200 cursor-pointer",
        isSelected && "border-yellow-500/35 bg-yellow-500/[0.05]",
        isCompleted && !isSelected && "border-white/[0.04] bg-white/[0.01]",
        isCurrent && !isSelected && "border-purple-500/20 bg-purple-500/[0.03]",
        !isCompleted && !isCurrent && !isSelected && "border-white/[0.03] bg-white/[0.005] opacity-60"
      )}
    >
      <div className={cn(
        "text-[10px] font-semibold mb-1",
        isSelected && "text-yellow-400",
        isCompleted && !isSelected && "text-zinc-400",
        isCurrent && !isSelected && "text-purple-400",
        !isCompleted && !isCurrent && !isSelected && "text-zinc-600"
      )}>
        {isSelected && "★ "}{isCurrent && !isSelected && "● "}
        第 {week.weekNumber} 周
      </div>
      <div className="text-[9px] text-zinc-500 truncate mb-1.5">{week.goal}</div>
      <div className="text-[9px]">
        {isCompleted && <span className="text-green-400">✓ {done}/{total}</span>}
        {isCurrent && !isCompleted && <span className="text-purple-400">{done}/{total}</span>}
        {!isCompleted && !isCurrent && <span className="text-zinc-600">待开始</span>}
      </div>
    </button>
  )
}
