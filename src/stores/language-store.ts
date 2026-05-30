import { create } from "zustand"

export type Language = "zh-CN" | "en"

interface LanguageState {
  language: Language
  setLanguage: (lang: Language) => void
}

const STORAGE_KEY = "studyai-language"

function getInitialLanguage(): Language {
  if (typeof window === "undefined") return "zh-CN"
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === "zh-CN" || stored === "en") return stored
  const m = document.cookie.match(/(?:^|;\s*)studyai-language=([^;]*)/)
  const fromCookie = m?.[1]
  if (fromCookie === "zh-CN" || fromCookie === "en") return fromCookie
  const browserLang = navigator.language
  return browserLang.startsWith("zh") ? "zh-CN" : "en"
}

export const useLanguageStore = create<LanguageState>((set) => ({
  language: getInitialLanguage(),
  setLanguage: (language) => {
    localStorage.setItem(STORAGE_KEY, language)
    set({ language })
    // Sync to server (fire-and-forget)
    fetch("/api/user/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ language }),
    }).catch(() => {})
  },
}))
