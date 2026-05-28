"use client"

import { useEffect } from "react"
import { useLanguageStore } from "@/stores/language-store"

export function HtmlLangUpdater() {
  const language = useLanguageStore((s) => s.language)

  useEffect(() => {
    document.documentElement.lang = language
    document.cookie = `studyai-language=${language}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`
  }, [language])

  return null
}
