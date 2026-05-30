import { create } from "zustand"
import type { LearningPlan, DayTask, Stage } from "@/types/plan"
import { extractPlanData, type ExtractedPlanData } from "@/lib/plan-parser"
import { MOCK_THEORIES, generateFallbackStages } from "@/services/plan.mock"

interface PlanState {
  plans: LearningPlan[]
  currentPlan: LearningPlan | null
  todayTasks: { date: string; dayNumber: number; tasks: DayTask[] } | null
  isLoading: boolean
  loadPlans: () => Promise<void>
  loadPlan: (id: string) => Promise<void>
  createPlanFromChat: (chatContent: string, mode: "quick" | "detailed", chatSessionId?: string) => Promise<LearningPlan>
  createPlanFromParsedData: (extracted: ExtractedPlanData, mode: "quick" | "detailed", chatSessionId?: string) => Promise<LearningPlan>
  updateTask: (planId: string, dayNumber: number, taskId: string, completed: boolean) => Promise<void>
  loadTodayTasks: (planId: string) => Promise<void>
  deletePlan: (id: string) => Promise<void>
}

export const usePlanStore = create<PlanState>((set, get) => ({
  plans: [],
  currentPlan: null,
  todayTasks: null,
  isLoading: false,

  loadPlans: async () => {
    set({ isLoading: true })
    try {
      const res = await fetch("/api/plans")
      if (!res.ok) throw new Error("Failed to load plans")
      const plans = await res.json()
      set({ plans, isLoading: false })
    } catch {
      set({ isLoading: false })
    }
  },

  loadPlan: async (id: string) => {
    set({ isLoading: true })
    try {
      const res = await fetch(`/api/plans/${id}`)
      if (!res.ok) throw new Error("Failed to load plan")
      const plan = await res.json()
      set({ currentPlan: plan, isLoading: false })
    } catch {
      set({ isLoading: false })
    }
  },

  createPlanFromChat: async (chatContent: string, mode: "quick" | "detailed", chatSessionId?: string) => {
    const extracted = extractPlanData(chatContent)
    return get().createPlanFromParsedData(
      extracted ?? { stages: [], theories: [] },
      mode,
      chatSessionId,
    )
  },

  createPlanFromParsedData: async (extracted: ExtractedPlanData, mode: "quick" | "detailed", chatSessionId?: string) => {
    const now = new Date()

    const stages: Stage[] = extracted.stages?.length ? extracted.stages : generateFallbackStages()
    const theories = extracted.theories?.length ? extracted.theories : [...MOCK_THEORIES]

    let totalDays = 0
    for (const stage of stages) {
      for (const week of stage.weeks ?? []) {
        totalDays += week.days?.length ?? 0
      }
    }

    const goalTitle = extracted.goal ?? extracted.stages?.[0]?.name ?? "掌握目标技能"

    const body = {
      id: `plan-${Date.now()}`,
      title: extracted.title ?? `${mode === "quick" ? "快速" : "深度"}学习计划`,
      mode,
      goal: {
        title: goalTitle,
        description: "通过系统化的学习计划达成学习目标",
        deadline: new Date(now.getTime() + totalDays * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        currentLevel: "初级",
        targetLevel: "中高级",
      },
      stages,
      theories,
      weeklyGoal: "完成本周所有学习任务，建立稳定的学习节奏",
      monthlyGoal: "完成前两个阶段的学习，掌握核心基础知识和应用能力",
      phaseGoal: "通过系统学习，从基础到实战，实现学习目标",
      status: "active",
      endDate: new Date(now.getTime() + totalDays * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      chatSessionId: chatSessionId ?? null,
    }

    const res = await fetch("/api/plans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })

    if (!res.ok) throw new Error("Failed to create plan")
    const plan = await res.json()
    set((state) => ({ plans: [...state.plans, plan], currentPlan: plan }))
    return plan
  },

  updateTask: async (planId: string, dayNumber: number, taskId: string, completed: boolean) => {
    const plan = get().currentPlan
    if (!plan) return

    const stages = plan.stages.map((stage: Stage) => ({
      ...stage,
      weeks: stage.weeks.map((week) => ({
        ...week,
        days: week.days.map((day) => {
          if (day.dayNumber === dayNumber) {
            return {
              ...day,
              tasks: day.tasks.map((t) =>
                t.id === taskId ? { ...t, completed } : t
              ),
            }
          }
          return day
        }),
      })),
    }))

    const res = await fetch(`/api/plans/${planId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stages }),
    })

    if (!res.ok) throw new Error("Failed to update task")
    const updated = await res.json()
    set({ currentPlan: updated })
    await get().loadTodayTasks(planId)
  },

  loadTodayTasks: async (planId: string) => {
    // Try currentPlan first, load from API if needed
    let plan = get().currentPlan
    if (!plan || plan.id !== planId) {
      try {
        const res = await fetch(`/api/plans/${planId}`)
        if (res.ok) plan = await res.json()
      } catch { /* ignore */ }
    }
    if (!plan) return

    const now = new Date()
    const startDate = new Date(plan.createdAt)
    const dayDiff = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    const dayNumber = Math.min(dayDiff + 1, 56)

    for (const stage of plan.stages ?? []) {
      for (const week of stage.weeks ?? []) {
        for (const day of week.days ?? []) {
          if (day.dayNumber === dayNumber) {
            set({ todayTasks: { date: new Date().toISOString().split("T")[0], dayNumber, tasks: day.tasks } })
            return
          }
        }
      }
    }
    set({ todayTasks: null })
  },

  deletePlan: async (id: string) => {
    const res = await fetch(`/api/plans/${id}`, { method: "DELETE" })
    if (!res.ok) throw new Error("Failed to delete plan")
    set((state) => ({
      plans: state.plans.filter((p) => p.id !== id),
      currentPlan: state.currentPlan?.id === id ? null : state.currentPlan,
    }))
  },
}))
