"use client"

import { useState, useEffect, useCallback } from "react"
import type { UserStats, GrowthMetrics, CheckinRecord } from "@/types/checkin"
import { useAuthStore } from "@/stores/auth-store"
import { usePlanStore } from "@/stores/plan-store"
import { mockCheckinService } from "@/services/checkin.mock"

/** Compute consecutive-day streak from checkin dates (sorted desc) */
function computeStreak(dates: string[]): { current: number; longest: number } {
  if (dates.length === 0) return { current: 0, longest: 0 }

  const unique = [...new Set(dates)].sort((a, b) => b.localeCompare(a))
  const today = new Date().toISOString().split("T")[0]

  let current = 0
  let longest = 0
  let run = 0
  let prev: Date | null = null

  for (const d of unique) {
    const cur = new Date(d)
    if (prev) {
      const diff = (prev.getTime() - cur.getTime()) / (1000 * 60 * 60 * 24)
      if (Math.round(diff) === 1) {
        run++
      } else {
        run = 1
      }
    } else {
      run = 1
    }
    prev = cur
    if (run > longest) longest = run
  }

  // Current streak: check if the most recent date is today or yesterday
  const latest = unique[0]
  const latestDate = new Date(latest)
  const todayDate = new Date(today)
  const diffToToday = Math.round((todayDate.getTime() - latestDate.getTime()) / (1000 * 60 * 60 * 24))
  if (diffToToday <= 1) {
    current = run
  }

  return { current, longest }
}

/** Group checkins into daily GrowthMetrics */
function buildGrowthMetrics(records: CheckinRecord[], days: number): GrowthMetrics[] {
  const now = new Date()
  const result: GrowthMetrics[] = []
  const byDate = new Map<string, CheckinRecord[]>()

  for (const r of records) {
    const list = byDate.get(r.date) || []
    list.push(r)
    byDate.set(r.date, list)
  }

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
    const key = date.toISOString().split("T")[0]
    const dayRecords = byDate.get(key) || []

    let tasksCompleted = 0
    let tasksTotal = 0
    let totalMinutes = 0
    let focusSum = 0

    for (const r of dayRecords) {
      for (const t of r.tasks) {
        tasksTotal++
        if (t.completed) {
          tasksCompleted++
          totalMinutes += t.actualMinutes
        }
      }
      focusSum += r.focusLevel
    }

    result.push({
      date: key,
      streakDays: 0, // filled below
      completionRate: tasksTotal > 0 ? Math.round((tasksCompleted / tasksTotal) * 100) : 0,
      totalMinutes,
      focusScore: dayRecords.length > 0 ? Math.round((focusSum / dayRecords.length) * 10) / 10 : 0,
      aiScore: 0,
      tasksCompleted,
      tasksTotal,
    })
  }

  // Fill streakDays
  let streakRun = 0
  for (let i = 0; i < result.length; i++) {
    if (result[i].tasksTotal > 0) {
      streakRun++
    } else {
      streakRun = 0
    }
    result[i].streakDays = streakRun
  }

  return result
}

function computeUserStats(records: CheckinRecord[]): UserStats {
  const dates = records.map(r => r.date)
  const { current: currentStreak, longest: longestStreak } = computeStreak(dates)

  let totalMinutes = 0
  let completedTasks = 0
  let totalTasks = 0
  let focusSum = 0
  let focusCount = 0

  for (const r of records) {
    focusSum += r.focusLevel
    focusCount++
    for (const t of r.tasks) {
      totalTasks++
      if (t.completed) {
        completedTasks++
        totalMinutes += t.actualMinutes
      }
    }
  }

  const totalDays = new Set(dates).size
  const averageCompletion = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
  const averageFocus = focusCount > 0 ? Math.round((focusSum / focusCount) * 10) / 10 : 0

  return {
    totalDays,
    currentStreak,
    longestStreak,
    totalMinutes,
    averageCompletion,
    averageFocus,
    aiRating: Math.round((averageCompletion * 0.6 + averageFocus * 8) * 10) / 10,
    weeklyGrowth: buildGrowthMetrics(records, 7),
    monthlyGrowth: buildGrowthMetrics(records, 30),
  }
}

export function useAnalytics() {
  const [stats, setStats] = useState<UserStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { user } = useAuthStore()
  const { plans } = usePlanStore()

  const loadStats = useCallback(async () => {
    if (!user) return
    setIsLoading(true)

    try {
      // Load checkin history across all plans
      const allCheckins: CheckinRecord[] = []
      for (const plan of plans) {
        const history = await mockCheckinService.getCheckinHistory(user.id, plan.id)
        allCheckins.push(...history)
      }

      setStats(computeUserStats(allCheckins))
    } finally {
      setIsLoading(false)
    }
  }, [user, plans])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  return { stats, isLoading, refresh: loadStats }
}
