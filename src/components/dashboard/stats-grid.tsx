"use client"

import type { UserStats } from "@/types/checkin"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Clock, Star, Sparkles, Activity } from "lucide-react"
import { useT } from "@/lib/i18n"

interface StatsGridProps {
  stats: UserStats
}

export function StatsGrid({ stats }: StatsGridProps) {
  const t = useT()
  const statItems = [
    {
      label: t("dashboard.totalHours"),
      value: `${Math.floor(stats.totalMinutes / 60)}h ${stats.totalMinutes % 60}m`,
      icon: Clock,
      color: "text-blue-400",
      bgColor: "bg-blue-500/10",
    },
    {
      label: t("dashboard.avgCompletion"),
      value: `${stats.averageCompletion}%`,
      icon: Activity,
      color: "text-green-400",
      bgColor: "bg-green-500/10",
      progress: stats.averageCompletion,
      progressColor: "bg-green-500",
    },
    {
      label: t("dashboard.avgFocus"),
      value: `${stats.averageFocus}/10`,
      icon: Sparkles,
      color: "text-purple-500 dark:text-purple-400",
      bgColor: "bg-purple-500/10",
      progress: stats.averageFocus * 10,
      progressColor: "bg-purple-500",
    },
    {
      label: t("dashboard.aiRating"),
      value: `${stats.aiRating}/100`,
      icon: Star,
      color: "text-amber-400",
      bgColor: "bg-amber-500/10",
      progress: stats.aiRating,
      progressColor: "bg-amber-500",
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {statItems.map((item, i) => (
        <Card key={i} className="border-black/[0.04] dark:border-white/[0.04] bg-black/[0.01] dark:bg-white/[0.01]">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-8 h-8 rounded-lg ${item.bgColor} flex items-center justify-center`}>
                <item.icon className={`h-4 w-4 ${item.color}`} />
              </div>
            </div>
            <span className="text-xl font-bold text-zinc-900 dark:text-white block mb-1">{item.value}</span>
            <span className="text-xs text-zinc-400 dark:text-zinc-500">{item.label}</span>
            {item.progress !== undefined && (
              <Progress
                value={item.progress}
                className="h-1 mt-2 bg-black/[0.04] dark:bg-white/[0.04] [&>div]:shadow-[0_0_8px_rgba(168,85,247,0.3)]"
              />
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
