"use client"

import { useEffect } from "react"
import { useSession } from "next-auth/react"
import { useAuthStore } from "@/stores/auth-store"

export function AuthWatcher() {
  const { data: session, status } = useSession()
  const setUser = useAuthStore((s) => s.setUser)

  useEffect(() => {
    if (status === "loading") return
    if (session?.user) {
      setUser({
        id: (session.user as { id?: string }).id || "",
        email: session.user.email || "",
        name: session.user.name || "",
        avatarUrl: session.user.image || "",
      })
    } else {
      setUser(null)
    }
  }, [session, status, setUser])

  return null
}
