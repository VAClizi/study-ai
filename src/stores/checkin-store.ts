import { create } from "zustand"
import type { CheckinRecord, CheckinFeedback } from "@/types/checkin"
import { mockCheckinService } from "@/services/checkin.mock"

interface CheckinState {
  todayCheckin: CheckinRecord | null
  history: CheckinRecord[]
  streak: number
  isLoading: boolean

  loadTodayCheckin: (userId: string, planId: string) => Promise<void>
  submitCheckin: (
    userId: string,
    planId: string,
    data: {
      tasks: { taskId: string; completed: boolean; actualMinutes: number; difficultyRating: number }[]
      feedback: CheckinFeedback
      focusLevel: number
      moodRating: number
    }
  ) => Promise<void>
  loadHistory: (userId: string, planId: string) => Promise<void>
  loadStreak: (userId: string) => Promise<void>
}

export const useCheckinStore = create<CheckinState>((set) => ({
  todayCheckin: null,
  history: [],
  streak: 0,
  isLoading: false,

  loadTodayCheckin: async (userId: string, planId: string) => {
    set({ isLoading: true })
    const todayCheckin = await mockCheckinService.getTodayCheckin(userId, planId)
    set({ todayCheckin, isLoading: false })
  },

  submitCheckin: async (userId, planId, data) => {
    set({ isLoading: true })
    const todayCheckin = await mockCheckinService.submitCheckin(userId, planId, data)
    set({ todayCheckin, isLoading: false })
  },

  loadHistory: async (userId: string, planId: string) => {
    const history = await mockCheckinService.getCheckinHistory(userId, planId)
    set({ history })
  },

  loadStreak: async (userId: string) => {
    const streak = await mockCheckinService.getStreak(userId)
    set({ streak })
  },
}))
