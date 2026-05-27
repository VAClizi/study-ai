export interface CheckinRecord {
  id: string
  userId: string
  planId: string
  date: string
  tasks: TaskCheckin[]
  feedback: CheckinFeedback
  focusLevel: number
  moodRating: number
  createdAt: string
}

export interface TaskCheckin {
  taskId: string
  completed: boolean
  actualMinutes: number
  difficultyRating: number
}

export interface CheckinFeedback {
  stuckPoints: string
  difficulties: string
  summary: string
  focusScore: number
  needAdjustment: boolean
  tomorrowGoal: string
}

export interface GrowthMetrics {
  date: string
  streakDays: number
  completionRate: number
  totalMinutes: number
  focusScore: number
  aiScore: number
  tasksCompleted: number
  tasksTotal: number
}

export interface UserStats {
  totalDays: number
  currentStreak: number
  longestStreak: number
  totalMinutes: number
  averageCompletion: number
  averageFocus: number
  aiRating: number
  weeklyGrowth: GrowthMetrics[]
  monthlyGrowth: GrowthMetrics[]
}
