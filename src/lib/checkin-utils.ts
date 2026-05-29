import { getLocalDate, getLocalDateOffset } from "@/lib/date"

export const DAY_LABELS = ["日", "一", "二", "三", "四", "五", "六"]
export const VISIBLE_DAYS = 7

export const MILESTONE_DAYS = [7, 30, 100]

export const MILESTONES: Record<number, { badge: string; label: string }> = {
  7: { badge: "🌟", label: "一周里程碑！习惯正在形成" },
  30: { badge: "🏆", label: "月度里程碑！你已经坚持一个月了" },
  100: { badge: "👑", label: "百天里程碑！学习已成为你的生活方式" },
}

export type DayNodeStatus = "completed" | "today" | "missed" | "future"

export interface DayNode {
  date: string
  dayLabel: string
  dayNum: number
  status: DayNodeStatus
}

export function loadCheckinDates(): Set<string> {
  if (typeof window === "undefined") return new Set()
  try {
    const raw = localStorage.getItem("studyai-checkins")
    if (!raw) return new Set()
    const records: { date: string }[] = JSON.parse(raw)
    return new Set(records.map((r) => r.date))
  } catch {
    return new Set()
  }
}

export function buildDayNodes(checkedInToday: boolean, statusForMissed: "missed" | "future" = "missed"): DayNode[] {
  const checkedDates = loadCheckinDates()
  const today = getLocalDate()
  const nodes: DayNode[] = []

  for (let i = VISIBLE_DAYS - 1; i >= 0; i--) {
    const date = getLocalDateOffset(-i)
    const d = new Date(date)
    const dayOfWeek = d.getDay()
    const dayNum = d.getDate()

    let status: DayNode["status"]
    if (date === today) {
      status = checkedDates.has(date) || checkedInToday ? "completed" : "today"
    } else if (checkedDates.has(date)) {
      status = "completed"
    } else {
      status = statusForMissed
    }

    nodes.push({ date, dayLabel: DAY_LABELS[dayOfWeek], dayNum, status })
  }

  return nodes
}
