"use client"

import type { GrowthMetrics } from "@/types/checkin"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { Brain } from "lucide-react"
import { useT } from "@/lib/i18n"

interface FocusChartProps {
  data: GrowthMetrics[]
}

export function FocusChart({ data }: FocusChartProps) {
  const weeklyData = data.slice(-7)
  const t = useT()

  return (
    <Card className="border-white/[0.04] bg-white/[0.01]">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-purple-500 dark:text-purple-400" />
          <CardTitle className="text-sm text-white">{t("dashboard.focus7Days")}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={weeklyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: "#71717a" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => v.slice(5)}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "#71717a" }}
              tickLine={false}
              axisLine={false}
              domain={[0, 10]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#12121a",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "12px",
                fontSize: "12px",
                color: "#e4e4e7",
              }}
              formatter={(value: unknown) => [`${value}/10`, t("dashboard.focus")]}
            />
            <Bar dataKey="focusScore" radius={[4, 4, 0, 0]} maxBarSize={32}>
              {weeklyData.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.focusScore >= 7 ? "#a855f7" : entry.focusScore >= 5 ? "#8b5cf6" : "#6d28d9"}
                  fillOpacity={0.8}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
