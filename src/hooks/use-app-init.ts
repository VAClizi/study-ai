"use client"

import { useEffect, useState } from "react"
import { useAuthStore } from "@/stores/auth-store"
import { usePlanStore } from "@/stores/plan-store"
import { useMemoryStore } from "@/stores/memory-store"
import { usePersonaStore, PERSONAS, type CoachPersona } from "@/stores/persona-store"
import { useLanguageStore, type Language } from "@/stores/language-store"

export function useAppInit() {
  const user = useAuthStore((s) => s.user)
  const loadPlans = usePlanStore((s) => s.loadPlans)
  const loadMemories = useMemoryStore((s) => s.loadMemories)
  const setPersona = usePersonaStore((s) => s.setPersona)
  const setLanguage = useLanguageStore((s) => s.setLanguage)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!user) {
      setReady(true)
      return
    }

    // 1. Load settings → init persona, language, etc.
    const initSettings = fetch("/api/user/settings")
      .then((r) => r.json())
      .then((settings) => {
        if (settings.persona && PERSONAS[settings.persona as CoachPersona]) {
          usePersonaStore.setState({
            persona: settings.persona,
            config: PERSONAS[settings.persona as CoachPersona],
          })
        }
        if (settings.language === "zh-CN" || settings.language === "en") {
          useLanguageStore.setState({ language: settings.language as Language })
        }
      })
      .catch(() => {})

    // 2. Load plans
    const initPlans = loadPlans()

    // 3. Load memories
    const initMemories = loadMemories()

    // 4. Check for legacy localStorage data and migrate
    const initMigration = (async () => {
      const hasLegacyData = typeof window !== "undefined" && (
        localStorage.getItem("studyai-chat-sessions") ||
        localStorage.getItem("studyai-checkins") ||
        localStorage.getItem("studyai-memories") ||
        localStorage.getItem("studyai-settings")
      )
      if (!hasLegacyData) return

      try {
        const chatSessions = JSON.parse(localStorage.getItem("studyai-chat-sessions") || "{}")
        const checkins = JSON.parse(localStorage.getItem("studyai-checkins") || "[]")
        const memories = JSON.parse(localStorage.getItem("studyai-memories") || "[]")
        const settings = JSON.parse(localStorage.getItem("studyai-settings") || "{}")
        const persona = localStorage.getItem("studyai-persona")
        const language = localStorage.getItem("studyai-language")
        const notifications = localStorage.getItem("studyai-notifications")
        const weeklyGoal = localStorage.getItem("studyai-weekly-goal")

        const mergedSettings = {
          ...settings,
          ...(persona ? { persona } : {}),
          ...(language ? { language } : {}),
          ...(notifications ? { notifications: notifications !== "false" } : {}),
          ...(weeklyGoal ? { weeklyGoal: Number(weeklyGoal) || 10 } : {}),
        }

        const res = await fetch("/api/migrate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chatSessions, checkins, memories, settings: mergedSettings }),
        })

        if (res.ok) {
          // Clear legacy localStorage data
          const keysToRemove = [
            "studyai-chat-sessions", "studyai-checkins", "studyai-memories",
            "studyai-settings", "studyai-persona", "studyai-language",
            "studyai-notifications", "studyai-weekly-goal",
          ]
          keysToRemove.forEach((k) => localStorage.removeItem(k))
          // Clear dashboard insight caches
          Object.keys(localStorage)
            .filter((k) => k.startsWith("studyai-dashboard-insight-"))
            .forEach((k) => localStorage.removeItem(k))

          // Reload data from server after migration
          await Promise.all([loadPlans(), loadMemories()])
        }
      } catch {
        // Migration failed — keep legacy data as fallback
      }
    })()

    Promise.all([initSettings, initPlans, initMemories, initMigration])
      .finally(() => setReady(true))
  }, [user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  return ready
}
