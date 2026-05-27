export interface LearningGoal {
  title: string
  description: string
  deadline: string
  currentLevel: string
  targetLevel: string
}

export interface UserProfile {
  sleepPattern: string
  focusDuration: number
  bestTime: string
  procrastinationTriggers: string[]
  learningStyle: string
  stressLevel: number
  workSchedule: string
  attentionSpan: number
  phoneUsageHours: number
  entertainmentHours: number
  anxietyLevel: number
  nightOwl: boolean
  reviewHabit: string
  motivationType: string
}

export interface DayTask {
  id: string
  title: string
  description: string
  durationMinutes: number
  priority: "high" | "medium" | "low"
  difficulty: "easy" | "medium" | "hard"
  completed: boolean
  theoryBasis?: string
  tags: string[]
}

export interface WeekPlan {
  weekNumber: number
  goal: string
  days: DayPlan[]
}

export interface DayPlan {
  date: string
  dayNumber: number
  focus: string
  tasks: DayTask[]
  totalMinutes: number
  notes: string
}

export interface Stage {
  id: string
  name: string
  description: string
  durationWeeks: number
  goal: string
  weeks: WeekPlan[]
}

export interface PlanTheory {
  name: string
  description: string
  application: string
  icon: string
}

export interface LearningPlan {
  id: string
  userId: string
  title: string
  goal: LearningGoal
  mode: "quick" | "detailed"
  stages: Stage[]
  theories: PlanTheory[]
  weeklyGoal: string
  monthlyGoal: string
  phaseGoal: string
  status: "active" | "completed" | "paused"
  createdAt: string
  endDate: string
  userProfile?: UserProfile
  chatSessionId?: string
}
