"use client"

import { useState, useMemo } from "react"
import type { Stage, WeekPlan } from "@/types/plan"
import { RoadmapStageNode } from "@/components/plan/roadmap-stage-node"
import { RoadmapWeekNode } from "@/components/plan/roadmap-week-node"
import { LearningResources } from "@/components/plan/learning-resources"
import { DayTaskGroup } from "@/components/plan/day-task-group"
import { useT, useTF } from "@/lib/i18n"

interface LearningRoadmapProps {
  stages: Stage[]
  currentDay: number
  onToggleTask: (dayNumber: number, taskId: string, completed: boolean) => void
}

export function LearningRoadmap({ stages, currentDay, onToggleTask }: LearningRoadmapProps) {
  const t = useT()
  const tf = useTF()

  // Lazy initializers: auto-select stage/week/day containing currentDay on first render
  const [expandedStageId, setExpandedStageId] = useState<string | null>(() => {
    for (const stage of stages) {
      for (const week of stage.weeks) {
        if (week.days.some(d => d.dayNumber === currentDay)) return stage.id
      }
    }
    return null
  })

  const [selectedWeekNum, setSelectedWeekNum] = useState<number | null>(() => {
    for (const stage of stages) {
      for (const week of stage.weeks) {
        if (week.days.some(d => d.dayNumber === currentDay)) return week.weekNumber
      }
    }
    return null
  })

  const [selectedDayNum, setSelectedDayNum] = useState<number | null>(currentDay)

  const allWeeks = useMemo(() => {
    return stages.flatMap((stage) =>
      stage.weeks.map((week) => ({
        week,
        stageId: stage.id,
        stageName: stage.name,
      }))
    )
  }, [stages])

  const selectedWeek = useMemo(() => {
    return allWeeks.find(w => w.week.weekNumber === selectedWeekNum)?.week ?? null
  }, [allWeeks, selectedWeekNum])

  const selectedDay = useMemo(() => {
    return selectedWeek?.days.find(d => d.dayNumber === selectedDayNum) ?? null
  }, [selectedWeek, selectedDayNum])

  const resources = selectedDay?.resources ?? []

  function getStageStatus(stage: Stage): "completed" | "active" | "pending" {
    const firstDay = stage.weeks[0]?.days[0]?.dayNumber ?? Infinity
    const lastDayNumber = stage.weeks[stage.weeks.length - 1]?.days[
      stage.weeks[stage.weeks.length - 1].days.length - 1
    ]?.dayNumber ?? 0
    if (currentDay > lastDayNumber) return "completed"
    if (currentDay >= firstDay && currentDay <= lastDayNumber) return "active"
    return "pending"
  }

  function getCompletedWeeks(stage: Stage): number {
    return stage.weeks.filter(w =>
      w.days.every(d => d.tasks.every(t => t.completed))
    ).length
  }

  function getWeekStatus(week: WeekPlan): "completed" | "current" | "pending" {
    const allDone = week.days.every(d => d.tasks.every(t => t.completed))
    if (allDone) return "completed"
    if (week.days.some(d => d.dayNumber === currentDay)) return "current"
    const allBefore = week.days.every(d => d.dayNumber < currentDay)
    return allBefore ? "completed" : "pending"
  }

  return (
    <div className="space-y-4">
      {/* Roadmap area */}
      <div className="rounded-xl border border-purple-500/[0.08] bg-purple-500/[0.01] p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-base">🗺️</span>
            <h3 className="text-sm font-bold text-zinc-200">{t("roadmap.title")}</h3>
          </div>
          <span className="text-[10px] text-zinc-600">{t("roadmap.scrollHint")}</span>
        </div>

        {/* Horizontal scroll container */}
        <div className="overflow-x-auto pb-2">
          <div className="flex items-start gap-0 min-w-fit">
            {stages.map((stage, i) => {
              const status = getStageStatus(stage)
              const isExpanded = expandedStageId === stage.id
              const completedWeeks = getCompletedWeeks(stage)

              return (
                <div key={stage.id} className="flex items-start flex-shrink-0">
                  {/* Stage node + expanded weeks */}
                  <div className="relative flex-shrink-0">
                    <RoadmapStageNode
                      stage={stage}
                      index={i}
                      status={status}
                      isExpanded={isExpanded}
                      completedWeeks={completedWeeks}
                      totalWeeks={stage.weeks.length}
                      onClick={() => setExpandedStageId(isExpanded ? null : stage.id)}
                    />

                    {/* Expanded week nodes */}
                    {isExpanded && (
                      <div className="flex gap-2 mt-3 ml-1">
                        {stage.weeks.map((week) => {
                          const ws = getWeekStatus(week)
                          return (
                            <RoadmapWeekNode
                              key={week.weekNumber}
                              week={week}
                              isCompleted={ws === "completed"}
                              isCurrent={ws === "current"}
                              isSelected={selectedWeekNum === week.weekNumber}
                              onClick={() => {
                                setSelectedWeekNum(week.weekNumber)
                                const firstPending = week.days.find(
                                  d => !d.tasks.every(t => t.completed)
                                ) ?? week.days[0]
                                setSelectedDayNum(firstPending?.dayNumber ?? week.days[0]?.dayNumber)
                              }}
                            />
                          )
                        })}
                      </div>
                    )}
                  </div>

                  {/* Arrow connector (except after last stage) */}
                  {i < stages.length - 1 && (
                    <div className="flex items-center justify-center pt-4 px-2 flex-shrink-0">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M5 12h14M13 5l7 7-7 7"
                          stroke={
                            status === "completed" || status === "active"
                              ? "#a78bfa"
                              : "#3f3f46"
                          }
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Below roadmap: day tasks + resources */}
      <div className="flex gap-4 items-start">
        {/* Day task groups */}
        <div className="flex-1 min-w-0 space-y-2">
          {selectedWeek && (
            <>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-bold text-zinc-200">
                  {tf("planDetail.weekNum", { num: selectedWeek.weekNumber })} · {selectedWeek.goal}
                </span>
              </div>
              {selectedWeek.days.map((day) => (
                <DayTaskGroup
                  key={day.dayNumber}
                  day={day}
                  isToday={day.dayNumber === currentDay}
                  isSelected={selectedDayNum === day.dayNumber}
                  onSelect={() => setSelectedDayNum(day.dayNumber)}
                  onToggleTask={(taskId, completed) =>
                    onToggleTask(day.dayNumber, taskId, completed)
                  }
                />
              ))}
            </>
          )}
        </div>

        {/* Resources panel — follows selected day */}
        <LearningResources resources={resources} dayNumber={selectedDayNum ?? 0} />
      </div>
    </div>
  )
}
