import type { User, UserSettings } from "@/types/user"

export interface AuthService {
  login(email: string, password: string): Promise<User>
  loginWithGoogle(): Promise<User>
  register(email: string, password: string, name: string): Promise<User>
  logout(): Promise<void>
  getCurrentUser(): Promise<User | null>
  updateSettings(settings: Partial<UserSettings>): Promise<User>
}
