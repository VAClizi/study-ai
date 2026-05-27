import type { AuthService } from "./types"
import type { User, UserSettings } from "@/types/user"
import { mockDelay, randomId } from "@/lib/mock-delay"

const MOCK_USER: User = {
  id: "user-001",
  email: "demo@studyai.com",
  name: "学习者",
  avatarUrl: "",
  createdAt: new Date().toISOString(),
  settings: {
    theme: "dark",
    notifications: true,
    coachMode: "active",
    language: "zh-CN",
    weeklyGoalHours: 20,
  },
}

function setSessionCookie() {
  if (typeof document === "undefined") return
  document.cookie = `studyai_session=1; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`
}

function clearSessionCookie() {
  if (typeof document === "undefined") return
  document.cookie = "studyai_session=; path=/; max-age=0"
}

let currentUser: User | null = null

export const mockAuthService: AuthService = {
  async login(email: string, _password: string): Promise<User> {
    await mockDelay(500, 1000)
    currentUser = { ...MOCK_USER, email, id: `user-${randomId()}` }
    localStorage.setItem("studyai_user", JSON.stringify(currentUser))
    setSessionCookie()
    return currentUser
  },

  async loginWithGoogle(): Promise<User> {
    await mockDelay(500, 1000)
    currentUser = { ...MOCK_USER, email: "google@studyai.com", id: `user-${randomId()}`, name: "Google用户" }
    localStorage.setItem("studyai_user", JSON.stringify(currentUser))
    setSessionCookie()
    return currentUser
  },

  async register(email: string, _password: string, name: string): Promise<User> {
    await mockDelay(500, 1000)
    currentUser = { ...MOCK_USER, email, name, id: `user-${randomId()}` }
    localStorage.setItem("studyai_user", JSON.stringify(currentUser))
    setSessionCookie()
    return currentUser
  },

  async logout(): Promise<void> {
    await mockDelay(200, 400)
    currentUser = null
    localStorage.removeItem("studyai_user")
    clearSessionCookie()
  },

  async getCurrentUser(): Promise<User | null> {
    await mockDelay(100, 300)
    if (currentUser) return currentUser
    const stored = localStorage.getItem("studyai_user")
    if (stored) {
      currentUser = JSON.parse(stored)
      return currentUser
    }
    return null
  },

  async updateSettings(settings: Partial<UserSettings>): Promise<User> {
    await mockDelay(300, 500)
    if (currentUser) {
      currentUser.settings = { ...currentUser.settings, ...settings }
      localStorage.setItem("studyai_user", JSON.stringify(currentUser))
    }
    return currentUser!
  },
}
