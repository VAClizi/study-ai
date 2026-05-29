import { useMemo } from "react"
import { useTheme } from "next-themes"

export function useChartColors() {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === "dark"

  return useMemo(() => ({
    grid: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.06)",
    tick: isDark ? "#71717a" : "#52525b",
    tooltipBg: isDark ? "#12121a" : "#ffffff",
    tooltipBorder: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)",
    tooltipText: isDark ? "#e4e4e7" : "#27272a",
  }), [isDark])
}
