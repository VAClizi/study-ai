import type { CheckinRecord, CheckinFeedback } from "@/types/checkin"
import { mockDelay, randomId } from "@/lib/mock-delay"
import { getLocalDate, getLocalDateOffset } from "@/lib/date"

const STORAGE_KEY = "studyai-checkins"

function loadCheckins(): CheckinRecord[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveCheckins(records: CheckinRecord[]) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
  } catch { /* storage full */ }
}

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
  async getTodayCheckin(userId: string, planId: string) {
    await mockDelay(200, 400)
    const today = getLocalDate()
    const records = loadCheckins()
    return records.find(c => c.userId === userId && c.planId === planId && c.date === today) || null
  },

  async submitCheckin(userId: string, planId: string, data) {
    await mockDelay(500, 1000)
    const records = loadCheckins()
    const record: CheckinRecord = {
      id: `checkin-${randomId()}`,
      userId,
      planId,
      date: getLocalDate(),
      tasks: data.tasks.map(t => ({
        taskId: t.taskId,
        completed: t.completed,
        actualMinutes: t.actualMinutes,
        difficultyRating: t.difficultyRating,
      })),
      feedback: data.feedback,
      focusLevel: data.focusLevel,
      moodRating: data.moodRating,
      createdAt: new Date().toISOString(),
    }
    records.push(record)
    saveCheckins(records)
    return record
  },

  async getCheckinHistory(userId: string, planId: string) {
    await mockDelay(300, 600)
    const records = loadCheckins()
    return records.filter(c => c.userId === userId && c.planId === planId)
  },

  async getStreak(userId: string) {
    await mockDelay(200, 400)
    const records = loadCheckins()
    const dates = records
      .filter(c => c.userId === userId)
      .map(c => c.date)
    return computeStreak(dates)
  },
}
