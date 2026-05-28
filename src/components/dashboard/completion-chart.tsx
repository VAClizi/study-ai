"use client"

import type { GrowthMetrics } from "@/types/checkin"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts"
import { TrendingUp } from "lucide-react"

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
  return (
    <Card className="border-white/[0.04] bg-white/[0.01]">
      <CardHeader>
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-purple-500 dark:text-purple-400" />
          <CardTitle className="text-sm text-white">{title}</CardTitle>
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
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
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
              domain={[0, 100]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#12121a",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "12px",
                fontSize: "12px",
                color: "#e4e4e7",
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
