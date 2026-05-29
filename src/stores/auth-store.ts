import { create } from "zustand"
import { loginWithCredentials, loginWithGoogle, registerAndLogin, logout as authLogout } from "@/auth/client"

export interface AuthUser {
  id: string
  email: string
  name: string
  avatarUrl: string
}

interface AuthState {
  user: AuthUser | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  loginWithGoogle: () => Promise<void>
  register: (email: string, password: string, name: string) => Promise<void>
  logout: () => Promise<void>
  setUser: (user: AuthUser | null) => void
  updateSettings: (settings: Record<string, unknown>) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  login: async (email: string, password: string) => {
    await loginWithCredentials(email, password)
  },

  loginWithGoogle: async () => {
    await loginWithGoogle()
  },

  register: async (email: string, password: string, name: string) => {
    await registerAndLogin(name, email, password)
  },

  logout: async () => {
    await authLogout()
    set({ user: null, isAuthenticated: false })
  },

  setUser: (user) => {
    set({ user, isAuthenticated: !!user, isLoading: false })
  },

  updateSettings: (_settings) => {
    // Stub: settings stored in localStorage by settings page directly
    // TODO: persist to DB when user settings table is added
  },
}))
