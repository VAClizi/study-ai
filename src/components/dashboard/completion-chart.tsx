"use client"

import type { GrowthMetrics } from "@/types/checkin"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts"
import { TrendingUp } from "lucide-react"
import { useTheme } from "next-themes"
import { useMemo } from "react"

interface CompletionChartProps {
  data: GrowthMetrics[]
  title: string
  dataKey: keyof GrowthMetrics
  color?: string
  prefix?: string
  suffix?: string
  height?: number
}

export function CompletionChart({
  data,
  title,
  dataKey,
  color = "#a855f7",
  prefix = "",
  suffix = "%",
  height = 250,
}: CompletionChartProps) {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === "dark"

  const chartColors = useMemo(() => ({
    grid: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.06)",
    tick: isDark ? "#71717a" : "#52525b",
    tooltipBg: isDark ? "#12121a" : "#ffffff",
    tooltipBorder: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)",
    tooltipText: isDark ? "#e4e4e7" : "#27272a",
  }), [isDark])

  return (
    <Card className="border-black/[0.04] dark:border-white/[0.04] bg-white dark:bg-white/[0.01]">
      <CardHeader>
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-purple-500 dark:text-purple-400" />
          <CardTitle className="text-sm text-zinc-900 dark:text-white">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id={`gradient-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: chartColors.tick }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => v.slice(5)}
            />
            <YAxis
              tick={{ fontSize: 10, fill: chartColors.tick }}
              tickLine={false}
              axisLine={false}
              domain={[0, 100]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: chartColors.tooltipBg,
                border: `1px solid ${chartColors.tooltipBorder}`,
                borderRadius: "12px",
                fontSize: "12px",
                color: chartColors.tooltipText,
              }}
              formatter={(value: unknown) => [`${prefix}${value}${suffix}`, ""]}
              labelFormatter={(label: unknown) => `${label}`}
            />
            <Area
              type="monotone"
              dataKey={dataKey as string}
              stroke={color}
              strokeWidth={2}
              fill={`url(#gradient-${dataKey})`}
              dot={false}
              activeDot={{ r: 4, fill: color, stroke: "rgba(0,0,0,0)" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
