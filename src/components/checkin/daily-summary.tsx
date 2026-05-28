"use client"

import type { CheckinRecord } from "@/types/checkin"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CalendarCheck, Target, Brain, TrendingUp } from "lucide-react"
import { useT } from "@/lib/i18n"

interface DailySummaryProps {
  checkin: CheckinRecord
}

export function DailySummary({ checkin }: DailySummaryProps) {
  const completedCount = checkin.tasks.filter(t => t.completed).length
  const rate = Math.round((completedCount / checkin.tasks.length) * 100)
  const t = useT()

  return (
    <Card className="border-green-500/10 bg-green-500/[0.02]">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarCheck className="h-4 w-4 text-green-500 dark:text-green-400" />
            <CardTitle className="text-base text-zinc-900 dark:text-white">{t("today.completed")}</CardTitle>
          </div>
          <Badge className="bg-green-600/20 text-green-400">
            {t("today.checkedIn")}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="flex flex-col items-center gap-1 p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.04] dark:border-white/[0.04]">
            <Target className="h-4 w-4 text-purple-500 dark:text-purple-400" />
            <span className="text-lg font-bold text-zinc-900 dark:text-white">{rate}%</span>
            <span className="text-[10px] text-zinc-400 dark:text-zinc-500">{t("checkin.completionRate")}</span>
          </div>
          <div className="flex flex-col items-center gap-1 p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.04] dark:border-white/[0.04]">
            <Brain className="h-4 w-4 text-purple-500 dark:text-purple-400" />
            <span className="text-lg font-bold text-zinc-900 dark:text-white">{checkin.focusLevel}/10</span>
            <span className="text-[10px] text-zinc-400 dark:text-zinc-500">{t("checkin.focusScore")}</span>
          </div>
          <div className="flex flex-col items-center gap-1 p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.04] dark:border-white/[0.04]">
            <TrendingUp className="h-4 w-4 text-purple-500 dark:text-purple-400" />
            <span className="text-lg font-bold text-zinc-900 dark:text-white">{checkin.moodRating}/10</span>
            <span className="text-[10px] text-zinc-400 dark:text-zinc-500">{t("checkin.state")}</span>
          </div>
        </div>

        {checkin.feedback.summary && (
          <div className="p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.04] dark:border-white/[0.04]">
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-1">{t("checkin.todaySummary")}</p>
            <p className="text-sm text-zinc-600 dark:text-zinc-300">{checkin.feedback.summary}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
