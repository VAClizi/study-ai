"use client"

import { useState, useMemo, useEffect } from "react"
import { Flame, ChevronRight } from "lucide-react"
import { cn } from "@/lib/cn"
import { useT, useTF } from "@/lib/i18n"
import { StreakDetailDialog } from "./streak-detail-dialog"
import { buildDayNodes, MILESTONE_DAYS, loadCheckinDatesAsync } from "@/lib/checkin-utils"

interface StreakFireBarProps {
  streakDays: number
  checkedInToday: boolean
  tomorrowGoal?: string
  className?: string
}

export function StreakFireBar({ streakDays, checkedInToday, tomorrowGoal, className }: StreakFireBarProps) {
  const t = useT()
  const tf = useTF()
  const [detailOpen, setDetailOpen] = useState(false)
  const [checkedDates, setCheckedDates] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadCheckinDatesAsync().then(setCheckedDates)
  }, [])

  const nodes = useMemo(() => buildDayNodes(checkedDates, checkedInToday), [checkedDates, checkedInToday])

  const nextMilestone = MILESTONE_DAYS.find((m) => m > streakDays)
  const progressToNext = nextMilestone ? (streakDays / nextMilestone) * 100 : 100

  return (
    <>
      <div className={cn("space-y-3", className)}>
        {/* Main streak card */}
        <button
          type="button"
          onClick={() => setDetailOpen(true)}
          className={cn(
            "w-full text-left rounded-xl border transition-all cursor-pointer hover:shadow-md",
            checkedInToday
              ? "bg-gradient-to-br from-orange-50/80 to-amber-50/60 dark:from-orange-500/[0.06] dark:to-amber-500/[0.04] border-orange-200/60 dark:border-orange-500/20 hover:border-orange-300/60 dark:hover:border-orange-500/30"
              : "bg-zinc-50 dark:bg-zinc-900/40 border-black/[0.06] dark:border-white/[0.06] hover:border-zinc-300 dark:hover:border-zinc-600"
          )}
        >
          <div className="p-4">
            {/* Header row */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className={cn(
                  "w-9 h-9 rounded-xl flex items-center justify-center",
                  checkedInToday
                    ? "bg-orange-500/15 dark:bg-orange-500/20"
                    : "bg-zinc-200/60 dark:bg-zinc-700/40"
                )}>
                  <Flame className={cn(
                    "h-5 w-5",
                    checkedInToday
                      ? "text-orange-500 fill-orange-500/20"
                      : "text-zinc-400 dark:text-zinc-500"
                  )} />
                </div>
                <div>
                  <p className={cn(
                    "text-sm font-semibold",
                    checkedInToday
                      ? "text-orange-700 dark:text-orange-300"
                      : "text-zinc-500 dark:text-zinc-400"
                  )}>
                    {checkedInToday
                      ? tf("streak.checkedIn", { days: streakDays })
                      : t("streak.notCheckedIn")}
                  </p>
                  {nextMilestone && checkedInToday && (
                    <p className="text-[11px] text-orange-500/60 dark:text-orange-400/60 mt-0.5">
                      距 {nextMilestone} 天里程碑还差 {nextMilestone - streakDays} 天
                    </p>
                  )}
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-zinc-300 dark:text-zinc-600" />
            </div>

            {/* Day nodes */}
            <div className="flex items-center justify-between px-1">
              {nodes.map((node) => (
                <div key={node.date} className="flex flex-col items-center gap-1.5">
                  {/* Circle node */}
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all",
                      node.status === "completed" && "bg-gradient-to-br from-orange-400 to-orange-500 text-white shadow-sm shadow-orange-500/20",
                      node.status === "today" && "border-2 border-orange-400 dark:border-orange-500 text-orange-500 dark:text-orange-400 bg-orange-50 dark:bg-orange-500/10",
                      node.status === "missed" && "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500"
                    )}
                  >
                    {node.status === "completed" ? (
                      <Flame className="h-3.5 w-3.5 text-white fill-white/30" />
                    ) : (
                      node.dayNum
                    )}
                  </div>
                  {/* Day label */}
                  <span className={cn(
                    "text-[10px] font-medium",
                    node.status === "completed" && "text-orange-500 dark:text-orange-400",
                    node.status === "today" && "text-orange-500 dark:text-orange-400 font-semibold",
                    node.status === "missed" && "text-zinc-400 dark:text-zinc-500"
                  )}>
                    {node.dayLabel}
                  </span>
                </div>
              ))}
            </div>

            {/* Progress bar */}
            {nextMilestone && checkedInToday && (
              <div className="mt-4 flex items-center gap-2">
                <div className="flex-1 h-1.5 rounded-full bg-orange-200/60 dark:bg-orange-500/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-orange-400 to-orange-500 transition-all duration-700"
                    style={{ width: `${Math.min(progressToNext, 100)}%` }}
                  />
                </div>
                <span className="text-[10px] text-orange-400/60 dark:text-orange-400/50 font-medium whitespace-nowrap">
                  {Math.round(progressToNext)}%
                </span>
              </div>
            )}
          </div>
        </button>

        {/* Tomorrow preview */}
        {checkedInToday && tomorrowGoal && (
          <div className="px-4 py-2.5 rounded-lg bg-purple-50/50 dark:bg-purple-500/[0.04] border border-purple-200/40 dark:border-purple-500/10">
            <p className="text-xs text-purple-600 dark:text-purple-400">
              💪 {tf("streak.tomorrowPreview", { goal: tomorrowGoal })}
            </p>
          </div>
        )}
      </div>

      {/* Detail dialog */}
      <StreakDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        streakDays={streakDays}
      />
    </>
  )
}
