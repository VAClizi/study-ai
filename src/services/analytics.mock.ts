import type { UserStats, GrowthMetrics } from "@/types/checkin"
import { mockDelay } from "@/lib/mock-delay"

function generateMockMetrics(days: number): GrowthMetrics[] {
  const metrics: GrowthMetrics[] = []
  const now = new Date()

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
    const baseCompletion = 0.6 + Math.random() * 0.35
    const baseFocus = 5 + Math.random() * 4

    metrics.push({
      date: date.toISOString().split("T")[0],
      streakDays: Math.min(days - i, 7 + Math.floor(Math.random() * 5)),
      completionRate: Math.round(baseCompletion * 100),
      totalMinutes: 45 + Math.floor(Math.random() * 45),
      focusScore: Math.round(baseFocus * 10) / 10,
      aiScore: Math.round((70 + Math.random() * 25) * 10) / 10,
      tasksCompleted: 3 + Math.floor(Math.random() * 4),
      tasksTotal: 5,
    })
  }
  return metrics
}

export interface MockAnalyticsService {
  getUserStats(userId: string): Promise<UserStats>
}

export const mockAnalyticsService: MockAnalyticsService = {
  async getUserStats(_userId: string) {
    await mockDelay(500, 1000)
    const weeklyGrowth = generateMockMetrics(7)
    const monthlyGrowth = generateMockMetrics(30)

    const latest = monthlyGrowth[monthlyGrowth.length - 1]

    return {
      totalDays: 42,
      currentStreak: 7,
      longestStreak: 14,
      totalMinutes: 2520,
      averageCompletion: Math.round(weeklyGrowth.reduce((s, m) => s + m.completionRate, 0) / weeklyGrowth.length),
      averageFocus: Math.round(weeklyGrowth.reduce((s, m) => s + m.focusScore, 0) / weeklyGrowth.length * 10) / 10,
      aiRating: latest.aiScore,
      weeklyGrowth,
      monthlyGrowth,
    }
  },
}
