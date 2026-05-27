import { create } from "zustand"
import type { LearningPlan, DayTask } from "@/types/plan"
import { mockPlanService } from "@/services/plan.mock"

interface PlanState {
  plans: LearningPlan[]
  currentPlan: LearningPlan | null
  todayTasks: { date: string; dayNumber: number; tasks: DayTask[] } | null
  isLoading: boolean

  loadPlans: (userId: string) => Promise<void>
  loadPlan: (id: string) => Promise<void>
  createPlanFromChat: (chatContent: string, userId: string, mode: "quick" | "detailed", chatSessionId?: string) => Promise<LearningPlan>
  updateTask: (planId: string, dayNumber: number, taskId: string, completed: boolean) => Promise<void>
  loadTodayTasks: (planId: string) => Promise<void>
  deletePlan: (id: string) => Promise<void>
}

export const usePlanStore = create<PlanState>((set, get) => ({
  plans: [],
  currentPlan: null,
  todayTasks: null,
  isLoading: false,

  loadPlans: async (userId: string) => {
    set({ isLoading: true })
    const plans = await mockPlanService.getPlans(userId)
    set({ plans, isLoading: false })
  },

  loadPlan: async (id: string) => {
    set({ isLoading: true })
    const plan = await mockPlanService.getPlan(id)
    set({ currentPlan: plan, isLoading: false })
  },

  createPlanFromChat: async (chatContent: string, userId: string, mode: "quick" | "detailed", chatSessionId?: string) => {
    const plan = await mockPlanService.createPlanFromChat(chatContent, userId, mode, chatSessionId)
    set(state => ({ plans: [...state.plans, plan], currentPlan: plan }))
    return plan
  },

  updateTask: async (planId: string, dayNumber: number, taskId: string, completed: boolean) => {
    await mockPlanService.updateTask(planId, dayNumber, taskId, completed)
    // 刷新当前计划
    const plan = await mockPlanService.getPlan(planId)
    set({ currentPlan: plan })
    // 也刷新今日任务
    const todayTasks = await mockPlanService.getTodayTasks(planId)
    set({ todayTasks })
  },

  loadTodayTasks: async (planId: string) => {
    const todayTasks = await mockPlanService.getTodayTasks(planId)
    set({ todayTasks })
  },

  deletePlan: async (id: string) => {
    await mockPlanService.deletePlan(id)
    set(state => ({
      plans: state.plans.filter(p => p.id !== id),
      currentPlan: state.currentPlan?.id === id ? null : state.currentPlan,
    }))
  },
}))
