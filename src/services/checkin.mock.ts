import type { CheckinRecord, CheckinFeedback, GrowthMetrics, UserStats } from "@/types/checkin"
import { mockDelay, randomId } from "@/lib/mock-delay"

const checkins: CheckinRecord[] = []

export interface MockCheckinService {
  getTodayCheckin(userId: string, planId: string): Promise<CheckinRecord | null>
  submitCheckin(userId: string, planId: string, data: { tasks: { taskId: string; completed: boolean; actualMinutes: number; difficultyRating: number }[]; feedback: CheckinFeedback; focusLevel: number; moodRating: number }): Promise<CheckinRecord>
  getCheckinHistory(userId: string, planId: string): Promise<CheckinRecord[]>
  getStreak(userId: string): Promise<number>
}

export const mockCheckinService: MockCheckinService = {
  async getTodayCheckin(userId: string, planId: string) {
    await mockDelay(200, 400)
    const today = new Date().toISOString().split("T")[0]
    return checkins.find(c => c.userId === userId && c.planId === planId && c.date === today) || null
  },

  async submitCheckin(userId: string, planId: string, data) {
    await mockDelay(500, 1000)
    const record: CheckinRecord = {
      id: `checkin-${randomId()}`,
      userId,
      planId,
      date: new Date().toISOString().split("T")[0],
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
    checkins.push(record)
    return record
  },

  async getCheckinHistory(userId: string, planId: string) {
    await mockDelay(300, 600)
    return checkins.filter(c => c.userId === userId && c.planId === planId)
  },

  async getStreak(_userId: string) {
    await mockDelay(200, 400)
    // 模拟连续打卡天数
    return Math.floor(Math.random() * 14) + 1
  },
}
