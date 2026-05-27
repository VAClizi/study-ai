"use client"

import { useTheme as useNextTheme } from "next-themes"

export function useTheme() {
  const { theme, setTheme, resolvedTheme } = useNextTheme()
  return {
    theme: theme as "dark" | "light" | "system",
    setTheme,
    resolvedTheme: resolvedTheme as "dark" | "light",
    isDark: resolvedTheme === "dark",
  }
}
