export interface User {
  id: string
  email: string
  name: string
  avatarUrl: string
  createdAt: string
  settings: UserSettings
}

export interface UserSettings {
  theme: "dark" | "light" | "system"
  notifications: boolean
  coachMode: "active" | "passive"
  language: string
  weeklyGoalHours: number
}
