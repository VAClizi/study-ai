"use client"

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react"
import { AuthWatcher } from "@/components/shared/auth-watcher"

export function SessionProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextAuthSessionProvider>
      <AuthWatcher />
      {children}
    </NextAuthSessionProvider>
  )
}
