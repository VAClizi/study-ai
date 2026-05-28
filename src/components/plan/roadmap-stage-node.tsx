"use client"

import { cn } from "@/lib/cn"
import type { Stage } from "@/types/plan"

interface RoadmapStageNodeProps {
  stage: Stage
  index: number
  status: "completed" | "active" | "pending"
  isExpanded: boolean
  completedWeeks: number
  totalWeeks: number
  onClick: () => void
}

export function RoadmapStageNode({
  stage,
  index,
  status,
  isExpanded,
  completedWeeks,
  totalWeeks,
  onClick,
}: RoadmapStageNodeProps) {
  const progress = totalWeeks > 0 ? Math.round((completedWeeks / totalWeeks) * 100) : 0

  return (
    <button
      onClick={onClick}
      className={cn(
        "relative flex-shrink-0 w-[140px] p-3.5 rounded-xl border text-left transition-all duration-300 cursor-pointer",
        status === "completed" && "border-green-500/20 bg-green-500/[0.04]",
        status === "active" && "border-purple-500/40 bg-purple-500/[0.08] shadow-lg shadow-purple-500/10",
        status === "pending" && "border-white/[0.04] bg-white/[0.005]"
      )}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className={cn(
          "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold",
          status === "completed" && "bg-green-500/20 text-green-400",
          status === "active" && "bg-purple-500/30 text-purple-300",
          status === "pending" && "bg-white/[0.04] text-zinc-500"
        )}>
          {status === "completed" ? "✓" : index + 1}
        </div>
        <span className={cn(
          "text-xs font-semibold",
          status === "completed" && "text-green-400",
          status === "active" && "text-purple-300",
          status === "pending" && "text-zinc-500"
        )}>
          {stage.name}
        </span>
      </div>

      <div className="flex items-center gap-2 text-[10px] text-zinc-500 mb-2">
        <span>{stage.durationWeeks} 周</span>
        {status === "completed" && <span className="text-green-400">· 完成</span>}
        {status === "active" && <span className="text-purple-400">· {progress}%</span>}
        {status === "pending" && <span className="text-zinc-600">· 待开始</span>}
      </div>

      <div className="h-1 rounded-full bg-white/[0.06]">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            status === "completed" && "bg-green-500",
            status === "active" && "bg-purple-500",
            status === "pending" && "bg-transparent"
          )}
          style={{ width: `${progress}%` }}
        />
      </div>

      {status === "active" && (
        <div className="absolute top-1.5 right-1.5">
          <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
        </div>
      )}
    </button>
  )
}
