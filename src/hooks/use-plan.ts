"use client"

import { useCallback, useEffect } from "react"
import { usePlanStore } from "@/stores/plan-store"
import { useAuthStore } from "@/stores/auth-store"

export function usePlan(planId?: string) {
  const {
    plans,
    currentPlan,
    todayTasks,
    isLoading,
    loadPlans,
    loadPlan,
    updateTask,
    loadTodayTasks,
    deletePlan,
  } = usePlanStore()

  const { user } = useAuthStore()

  useEffect(() => {
    if (user) {
      loadPlans()
    }
  }, [user, loadPlans])

  useEffect(() => {
    if (planId) {
      loadPlan(planId)
    }
  }, [planId, loadPlan])

  const loadToday = useCallback(
    async (planId: string) => {
      await loadTodayTasks(planId)
    },
    [loadTodayTasks]
  )

  const toggleTask = useCallback(
    async (planId: string, dayNumber: number, taskId: string, completed: boolean) => {
      await updateTask(planId, dayNumber, taskId, completed)
    },
    [updateTask]
  )

  return {
    plans,
    currentPlan,
    todayTasks,
    isLoading,
    loadPlan,
    loadToday,
    toggleTask,
    deletePlan,
  }
}
