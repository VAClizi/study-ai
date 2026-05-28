"use client"

import { useMemo } from "react"
import { Flame, Trophy, Calendar, Target, X } from "lucide-react"
import { cn } from "@/lib/cn"
import { useTF } from "@/lib/i18n"
import { getLocalDate, getLocalDateOffset } from "@/lib/date"
import type { CheckinRecord } from "@/types/checkin"

interface StreakDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  streakDays: number
}

const DAY_LABELS = ["日", "一", "二", "三", "四", "五", "六"]
const MONTH_LABELS = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"]

function loadAllCheckins(): CheckinRecord[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem("studyai-checkins")
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function computeLongestStreak(dates: string[]): number {
  if (dates.length === 0) return 0
  const unique = [...new Set(dates)].sort()
  let longest = 1
  let run = 1
  for (let i = 1; i < unique.length; i++) {
    const prev = new Date(unique[i - 1])
    const cur = new Date(unique[i])
    const diff = (cur.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24)
    if (Math.round(diff) === 1) {
      run++
      if (run > longest) longest = run
    } else {
      run = 1
    }
  }
  return longest
}

interface DayNode {
  date: string
  dayLabel: string
  dayNum: number
  monthLabel: string
  checked: boolean
  isToday: boolean
}

function buildMonthNodes(): DayNode[] {
  const checkins = loadAllCheckins()
  const checkedSet = new Set(checkins.map((r) => r.date))
  const today = getLocalDate()
  const nodes: DayNode[] = []

  for (let i = 29; i >= 0; i--) {
    const date = getLocalDateOffset(-i)
    const d = new Date(date)
    const dayOfWeek = d.getDay()
    const dayNum = d.getDate()
    const month = d.getMonth()

    nodes.push({
      date,
      dayLabel: DAY_LABELS[dayOfWeek],
      dayNum,
      monthLabel: MONTH_LABELS[month],
      checked: checkedSet.has(date),
      isToday: date === today,
    })
  }

  return nodes
}

export function StreakDetailDialog({ open, onOpenChange, streakDays }: StreakDetailDialogProps) {
  const tf = useTF()

  const nodes = useMemo(() => buildMonthNodes(), [open])
  const stats = useMemo(() => {
    const checkins = loadAllCheckins()
    const dates = checkins.map((r) => r.date)
    return {
      totalDays: new Set(dates).size,
      longestStreak: computeLongestStreak(dates),
    }
  }, [open])

  if (!open) return null

  const completedCount = nodes.filter((n) => n.checked).length

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />

      {/* Dialog */}
      <div className="relative w-full max-w-md mx-4 max-h-[85vh] overflow-y-auto rounded-2xl bg-white dark:bg-zinc-900 border border-black/[0.06] dark:border-white/[0.06] shadow-2xl animate-fade-in-up">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-5 pb-3 bg-white dark:bg-zinc-900 rounded-t-2xl border-b border-black/[0.04] dark:border-white/[0.04]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-500/15 dark:bg-orange-500/20 flex items-center justify-center">
              <Flame className="h-5 w-5 text-orange-500 fill-orange-500/20" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-white">打卡记录</h2>
              <p className="text-[11px] text-zinc-400 dark:text-zinc-500">连续 {streakDays} 天</p>
            </div>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="w-8 h-8 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 flex items-center justify-center transition-colors"
          >
            <X className="h-4 w-4 text-zinc-400" />
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 p-5 pb-2">
          <div className="text-center p-3 rounded-xl bg-orange-50/60 dark:bg-orange-500/[0.06] border border-orange-100/60 dark:border-orange-500/10">
            <Flame className="h-4 w-4 text-orange-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-orange-600 dark:text-orange-400">{streakDays}</p>
            <p className="text-[10px] text-orange-400/70 dark:text-orange-400/60">当前连续</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-purple-50/60 dark:bg-purple-500/[0.06] border border-purple-100/60 dark:border-purple-500/10">
            <Trophy className="h-4 w-4 text-purple-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-purple-600 dark:text-purple-400">{stats.longestStreak}</p>
            <p className="text-[10px] text-purple-400/70 dark:text-purple-400/60">最长记录</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-500/[0.06] border border-emerald-100/60 dark:border-emerald-500/10">
            <Calendar className="h-4 w-4 text-emerald-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{stats.totalDays}</p>
            <p className="text-[10px] text-emerald-400/70 dark:text-emerald-400/60">累计天数</p>
          </div>
        </div>

        {/* Recent 30-day completion */}
        <div className="px-5 pt-3 pb-2">
          <div className="flex items-center gap-2 mb-3">
            <Target className="h-3.5 w-3.5 text-zinc-400" />
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              近30天完成 {completedCount}/{nodes.length} 天
            </span>
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7 gap-2">
            {/* Day-of-week headers */}
            {["日", "一", "二", "三", "四", "五", "六"].map((d) => (
              <div key={d} className="text-center text-[10px] text-zinc-400 dark:text-zinc-500 font-medium py-0.5">
                {d}
              </div>
            ))}

            {/* Empty cells for alignment — first node might not be Sunday */}
            {(() => {
              const firstDay = new Date(nodes[0].date).getDay()
              const empties = []
              for (let i = 0; i < firstDay; i++) {
                empties.push(<div key={`empty-${i}`} />)
              }
              return empties
            })()}

            {/* Day nodes */}
            {nodes.map((node) => (
              <div
                key={node.date}
                className="flex flex-col items-center gap-0.5"
                title={`${node.date}${node.checked ? " ✓" : ""}`}
              >
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all",
                    node.checked && "bg-gradient-to-br from-orange-400 to-orange-500 text-white shadow-sm shadow-orange-500/20",
                    node.isToday && !node.checked && "border-2 border-orange-400 dark:border-orange-500 text-orange-500 bg-orange-50 dark:bg-orange-500/10",
                    !node.checked && !node.isToday && "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500"
                  )}
                >
                  {node.checked ? (
                    <Flame className="h-3.5 w-3.5 text-white fill-white/30" />
                  ) : (
                    node.dayNum
                  )}
                </div>
                <span className={cn(
                  "text-[9px]",
                  node.checked && "text-orange-500",
                  node.isToday && !node.checked && "text-orange-500 font-semibold",
                  !node.checked && !node.isToday && "text-zinc-400"
                )}>
                  {node.dayNum}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 p-5 pt-3">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-gradient-to-br from-orange-400 to-orange-500" />
            <span className="text-[10px] text-zinc-500 dark:text-zinc-400">已打卡</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full border-2 border-orange-400 bg-orange-50 dark:bg-orange-500/10" />
            <span className="text-[10px] text-zinc-500 dark:text-zinc-400">今日</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-zinc-100 dark:bg-zinc-800" />
            <span className="text-[10px] text-zinc-500 dark:text-zinc-400">未打卡</span>
          </div>
        </div>
      </div>
    </div>
  )
}
