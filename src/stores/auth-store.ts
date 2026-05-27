import { create } from "zustand"
import type { User, UserSettings } from "@/types/user"
import { mockAuthService } from "@/services/auth.mock"

interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  loginWithGoogle: () => Promise<void>
  register: (email: string, password: string, name: string) => Promise<void>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
  updateSettings: (settings: Partial<UserSettings>) => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  login: async (email: string, password: string) => {
    const user = await mockAuthService.login(email, password)
    set({ user, isAuthenticated: true })
  },

  loginWithGoogle: async () => {
    const user = await mockAuthService.loginWithGoogle()
    set({ user, isAuthenticated: true })
  },

  register: async (email: string, password: string, name: string) => {
    const user = await mockAuthService.register(email, password, name)
    set({ user, isAuthenticated: true })
  },

  logout: async () => {
    await mockAuthService.logout()
    set({ user: null, isAuthenticated: false })
  },

  checkAuth: async () => {
    try {
      const user = await mockAuthService.getCurrentUser()
      set({ user, isAuthenticated: !!user, isLoading: false })
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false })
    }
  },

  updateSettings: async (settings: Partial<UserSettings>) => {
    const user = await mockAuthService.updateSettings(settings)
    set({ user })
  },
}))
