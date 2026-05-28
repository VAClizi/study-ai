"use client"

import { useTheme } from "next-themes"
import { Moon, Sun, Monitor } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import { useT } from "@/lib/i18n"

function cycleTheme(current: string) {
  if (current === "dark") return "light"
  if (current === "light") return "system"
  return "dark"
}

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const t = useT()

  useEffect(() => setMounted(true), [])

  if (!mounted) return <Button variant="ghost" size="icon" className="w-9 h-9 opacity-0" />

  return (
    <Button
      variant="ghost"
      size="icon"
      className="w-9 h-9 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
      onClick={() => setTheme(cycleTheme(theme ?? "system"))}
      title={
        theme === "dark" ? t("settings.dark") :
        theme === "light" ? t("settings.light") :
        t("settings.system")
      }
    >
      {theme === "dark" ? <Moon className="h-4 w-4" /> :
       theme === "light" ? <Sun className="h-4 w-4" /> :
       <Monitor className="h-4 w-4" />}
      <span className="sr-only">{t("common.toggleTheme")}</span>
    </Button>
  )
}
