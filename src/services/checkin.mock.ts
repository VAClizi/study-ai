import type { CheckinRecord, CheckinFeedback } from "@/types/checkin"
import { getLocalDate, getLocalDateOffset } from "@/lib/date"

/** Compute current streak from sorted unique checkin dates */
function computeStreak(dates: string[]): number {
  if (dates.length === 0) return 0
  const unique = [...new Set(dates)].sort().reverse()
  const today = getLocalDate()

  // Must have checked in today or yesterday to continue streak
  if (unique[0] !== today && unique[0] !== getLocalDateOffset(-1)) return 0

  let streak = unique[0] === today ? 1 : 0
  for (let i = streak; i < unique.length; i++) {
    const expected = getLocalDateOffset(-streak)
    if (unique[i] === expected) {
      streak++
    } else {
      break
    }
  }
  return streak
}

export interface MockCheckinService {
  getTodayCheckin(userId: string, planId: string): Promise<CheckinRecord | null>
  submitCheckin(userId: string, planId: string, data: { tasks: { taskId: string; completed: boolean; actualMinutes: number; difficultyRating: number }[]; feedback: CheckinFeedback; focusLevel: number; moodRating: number }): Promise<CheckinRecord>
  getCheckinHistory(userId: string, planId: string): Promise<CheckinRecord[]>
  getStreak(userId: string): Promise<number>
}

export const mockCheckinService: MockCheckinService = {
  async getTodayCheckin(_userId: string, planId: string) {
    const today = getLocalDate()
    const res = await fetch(`/api/checkins?date=${encodeURIComponent(today)}&planId=${encodeURIComponent(planId)}`)
    if (!res.ok) return null
    const checkins: CheckinRecord[] = await res.json()
    return checkins[0] || null
  },

  async submitCheckin(userId: string, planId: string, data) {
    const res = await fetch("/api/checkins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, planId, ...data }),
    })
    if (!res.ok) throw new Error("Failed to submit checkin")
    return res.json()
  },

  async getCheckinHistory(_userId: string, planId: string) {
    const res = await fetch(`/api/checkins?planId=${encodeURIComponent(planId)}`)
    if (!res.ok) return []
    return res.json()
  },

  async getStreak(userId: string) {
    const res = await fetch("/api/checkins")
    if (!res.ok) return 0
    const records: CheckinRecord[] = await res.json()
    const dates = records
      .filter(c => c.userId === userId)
      .map(c => c.date)
    return computeStreak(dates)
  },
}
