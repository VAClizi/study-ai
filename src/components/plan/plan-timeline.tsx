"use client"

import type { Stage } from "@/types/plan"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/cn"
import { CheckCircle2, Circle, Clock } from "lucide-react"
import { useT } from "@/lib/i18n"

interface PlanTimelineProps {
  stages: Stage[]
  currentDayNumber?: number
}

export function PlanTimeline({ stages, currentDayNumber = 1 }: PlanTimelineProps) {
  const t = useT()
  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-4 top-0 bottom-0 w-px bg-black/[0.06] dark:bg-white/[0.06]" />

      <div className="space-y-6">
        {stages.map((stage, stageIndex) => {
          const isCurrentStage = currentDayNumber >= stage.weeks[0]?.days[0]?.dayNumber && currentDayNumber <= stage.weeks[stage.weeks.length - 1]?.days[stage.weeks[stage.weeks.length - 1].days.length - 1]?.dayNumber
          const isPast = currentDayNumber > (stage.weeks[stage.weeks.length - 1]?.days[stage.weeks[stage.weeks.length - 1].days.length - 1]?.dayNumber || 0)

          return (
            <div key={stage.id} className="relative pl-10">
              {/* Indicator */}
              <div
                className={cn(
                  "absolute left-2.5 -translate-x-1/2 w-3 h-3 rounded-full border-2 z-10 bg-white dark:bg-[#0a0a0f]",
                  isPast
                    ? "border-green-500 bg-green-500"
                    : isCurrentStage
                      ? "border-purple-500 bg-purple-500 animate-pulse"
                      : "border-black/10 dark:border-white/10"
                )}
              />

              <Card className={cn(
                "border transition-all",
                isCurrentStage ? "border-purple-500/20 bg-purple-600/[0.02]" : "border-black/[0.04] dark:border-white/[0.04] bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm"
              )}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-zinc-900 dark:text-white font-semibold mb-1">{stage.name}</h3>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">{stage.description}</p>
                    </div>
                    <Badge className={cn(
                      isPast ? "bg-green-600/20 text-green-400" : isCurrentStage ? "bg-purple-600/20 text-purple-600 dark:text-purple-300" : "bg-black/5 dark:bg-white/5 text-zinc-400 dark:text-zinc-500"
                    )}>
                      {isPast ? t("plans.completed") : isCurrentStage ? t("plans.active") : t("plans.paused")}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-zinc-400 dark:text-zinc-500">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {stage.durationWeeks} {t("planDetail.weeks")}
                    </span>
                    <span>{stage.goal}</span>
                  </div>

                  {/* Week progress */}
                  <div className="mt-4 flex gap-2">
                    {stage.weeks.map((week) => {
                      const isCurrentWeek = week.days[0]?.dayNumber <= currentDayNumber && week.days[week.days.length - 1]?.dayNumber >= currentDayNumber
                      return (
                        <div
                          key={week.weekNumber}
                          className={cn(
                            "flex-1 h-1.5 rounded-full transition-all",
                            isCurrentWeek ? "bg-purple-500" : "bg-black/[0.06] dark:bg-white/[0.06]"
                          )}
                        />
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          )
        })}
      </div>
    </div>
  )
}
