"use client"

import { useCallback, useEffect } from "react"
import { useCheckinStore } from "@/stores/checkin-store"
import { useAuthStore } from "@/stores/auth-store"
import type { CheckinFeedback } from "@/types/checkin"

export function useCheckin(planId?: string) {
  const {
    todayCheckin,
    history,
    streak,
    isLoading,
    loadTodayCheckin,
    submitCheckin,
    loadHistory,
    loadStreak,
  } = useCheckinStore()

  const { user } = useAuthStore()

  useEffect(() => {
    if (user) {
      loadStreak(user.id)
    }
  }, [user, loadStreak])

  useEffect(() => {
    if (user && planId) {
      loadTodayCheckin(user.id, planId)
      loadHistory(user.id, planId)
    }
  }, [user, planId, loadTodayCheckin, loadHistory])

  const handleSubmitCheckin = useCallback(
    async (data: {
      tasks: { taskId: string; completed: boolean; actualMinutes: number; difficultyRating: number }[]
      feedback: CheckinFeedback
      focusLevel: number
      moodRating: number
    }) => {
      if (!user || !planId) return
      await submitCheckin(user.id, planId, data)
      await loadStreak(user.id)
    },
    [user, planId, submitCheckin, loadStreak]
  )

  return {
    todayCheckin,
    history,
    streak,
    isLoading,
    submitCheckin: handleSubmitCheckin,
  }
}
