# 学习路线图可视化 — 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在计划详情页顶部添加交互式学习路线图（横向阶段节点 + 展开周节点），下方按天分组展示任务，右侧显示跟随选中天变化的学习资料面板。

**Architecture:** 5 个新建组件 + 1 个类型扩展 + 1 个页面修改。路线图使用 React HTML 卡片 + SVG 连线混合渲染，状态通过 useState 管理选中阶段/周/天，数据源为现有 LearningPlan 结构。

**Tech Stack:** React + TypeScript + Tailwind CSS + lucide-react icons

---

## 文件总览

| 操作 | 文件 | 职责 |
|------|------|------|
| 新建 | `src/components/plan/learning-roadmap.tsx` | 路线图主组件：阶段列表 + SVG 连线 + 展开逻辑 |
| 新建 | `src/components/plan/roadmap-stage-node.tsx` | 单个阶段节点卡片（含状态样式） |
| 新建 | `src/components/plan/roadmap-week-node.tsx` | 展开后的周节点小卡片 |
| 新建 | `src/components/plan/learning-resources.tsx` | 右侧学习资料面板（按类型分组） |
| 新建 | `src/components/plan/day-task-group.tsx` | 按天分组的任务卡片列表 |
| 修改 | `src/types/plan.ts` | 新增 `LearningResource` 类型 + 扩展 `DayPlan` |
| 修改 | `src/lib/i18n.ts` | 新增 `roadmap.*` `resource.*` `dayGroup.*` 翻译键 |
| 修改 | `src/services/plan.mock.ts` | 为 mock 数据添加示例学习资源 |
| 修改 | `src/app/plan/[id]/page.tsx` | 集成路线图组件 + 两栏布局 |

---

### Task 1: 扩展数据模型

**Files:**
- Modify: `src/types/plan.ts`

- [ ] **Step 1: 添加 LearningResource 类型和扩展 DayPlan**

在 `src/types/plan.ts` 中，在 `DayTask` 接口之后（第 36 行后）添加 `LearningResource` 接口，并修改 `DayPlan` 添加 `resources` 字段：

```ts
// 在 DayTask 接口之后（第 36 行后）插入：
export interface LearningResource {
  id: string
  title: string
  url: string
  type: "paper" | "video" | "code" | "article" | "book"
  source: string
}

// 修改 DayPlan 接口（第 44-51 行），在 notes 后添加 resources：
export interface DayPlan {
  date: string
  dayNumber: number
  focus: string
  tasks: DayTask[]
  totalMinutes: number
  notes: string
  resources?: LearningResource[]
}
```

- [ ] **Step 2: 验证类型**

运行 `cd E:\study-ai && npx tsc --noEmit 2>&1 | head -20`

---

### Task 2: 添加 i18n 翻译键

**Files:**
- Modify: `src/lib/i18n.ts`

- [ ] **Step 1: 添加路线图相关翻译键**

在 `src/lib/i18n.ts` 的 planDetail 键区域（约第 172 行后）添加以下键：

```ts
// 路线图
"roadmap.title": { "zh-CN": "学习路线图", en: "Learning Roadmap" },
"roadmap.expandHint": { "zh-CN": "点击阶段展开", en: "Click stage to expand" },
"roadmap.scrollHint": { "zh-CN": "横向滚动", en: "Scroll →" },
"roadmap.completed": { "zh-CN": "已完成", en: "Done" },
"roadmap.inProgress": { "zh-CN": "进行中", en: "Active" },
"roadmap.pending": { "zh-CN": "待开始", en: "Pending" },

// 天分组
"dayGroup.today": { "zh-CN": "今天", en: "Today" },
"dayGroup.done": { "zh-CN": "已完成", en: "Done" },
"dayGroup.pending": { "zh-CN": "待开始", en: "Pending" },
"dayGroup.expand": { "zh-CN": "展开", en: "Expand" },
"dayGroup.collapse": { "zh-CN": "收起", en: "Collapse" },

// 学习资料面板
"resource.title": { "zh-CN": "学习资料", en: "Learning Resources" },
"resource.paper": { "zh-CN": "必读论文", en: "Papers" },
"resource.video": { "zh-CN": "视频讲解", en: "Videos" },
"resource.code": { "zh-CN": "配套代码", en: "Code" },
"resource.article": { "zh-CN": "推荐阅读", en: "Articles" },
"resource.book": { "zh-CN": "参考书籍", en: "Books" },
"resource.noResources": { "zh-CN": "暂无学习资料", en: "No resources yet" },
```

- [ ] **Step 2: 构建验证**

运行 `cd E:\study-ai && npm run build 2>&1 | tail -5`，确认编译通过

---

### Task 3: 阶段节点组件 — RoadmapStageNode

**Files:**
- Create: `src/components/plan/roadmap-stage-node.tsx`

- [ ] **Step 1: 创建阶段节点卡片组件**

```tsx
"use client"

import { cn } from "@/lib/cn"
import type { Stage } from "@/types/plan"

interface RoadmapStageNodeProps {
  stage: Stage
  index: number
  status: "completed" | "active" | "pending"
  isExpanded: boolean
  completedWeeks: number
  totalWeeks: number
  onClick: () => void
}

export function RoadmapStageNode({
  stage,
  index,
  status,
  isExpanded,
  completedWeeks,
  totalWeeks,
  onClick,
}: RoadmapStageNodeProps) {
  const progress = Math.round((completedWeeks / totalWeeks) * 100)

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex-shrink-0 w-[140px] p-3.5 rounded-xl border text-left transition-all duration-300 cursor-pointer",
        status === "completed" && "border-green-500/20 bg-green-500/[0.04]",
        status === "active" && "border-purple-500/40 bg-purple-500/[0.08] shadow-lg shadow-purple-500/10",
        status === "pending" && "border-white/[0.04] bg-white/[0.005]"
      )}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className={cn(
          "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold",
          status === "completed" && "bg-green-500/20 text-green-400",
          status === "active" && "bg-purple-500/30 text-purple-300",
          status === "pending" && "bg-white/[0.04] text-zinc-500"
        )}>
          {status === "completed" ? "✓" : index + 1}
        </div>
        <span className={cn(
          "text-xs font-semibold",
          status === "completed" && "text-green-400",
          status === "active" && "text-purple-300",
          status === "pending" && "text-zinc-500"
        )}>
          {stage.name}
        </span>
      </div>

      <div className="flex items-center gap-2 text-[10px] text-zinc-500 mb-2">
        <span>{stage.durationWeeks} 周</span>
        {status === "completed" && <span className="text-green-400">· 完成</span>}
        {status === "active" && <span className="text-purple-400">· {progress}%</span>}
        {status === "pending" && <span className="text-zinc-600">· 待开始</span>}
      </div>

      {/* Mini progress bar */}
      <div className="h-1 rounded-full bg-white/[0.06]">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            status === "completed" && "bg-green-500",
            status === "active" && "bg-purple-500",
            status === "pending" && "bg-transparent"
          )}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Pulse dot for active */}
      {status === "active" && (
        <div className="absolute top-1.5 right-1.5">
          <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
        </div>
      )}
    </button>
  )
}
```

- [ ] **Step 2: 构建验证**

`cd E:\study-ai && npm run build 2>&1 | tail -5`

---

### Task 4: 周节点组件 — RoadmapWeekNode

**Files:**
- Create: `src/components/plan/roadmap-week-node.tsx`

- [ ] **Step 1: 创建周节点小卡片**

```tsx
"use client"

import { cn } from "@/lib/cn"
import type { WeekPlan } from "@/types/plan"

interface RoadmapWeekNodeProps {
  week: WeekPlan
  isCompleted: boolean
  isCurrent: boolean
  isSelected: boolean
  onClick: () => void
}

export function RoadmapWeekNode({
  week,
  isCompleted,
  isCurrent,
  isSelected,
  onClick,
}: RoadmapWeekNodeProps) {
  const done = week.days.reduce((acc, d) => acc + d.tasks.filter(t => t.completed).length, 0)
  const total = week.days.reduce((acc, d) => acc + d.tasks.length, 0)

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-[110px] p-2.5 rounded-lg border text-left transition-all duration-200 cursor-pointer",
        isSelected && "border-yellow-500/35 bg-yellow-500/[0.05]",
        isCompleted && !isSelected && "border-white/[0.04] bg-white/[0.01]",
        isCurrent && !isSelected && "border-purple-500/20 bg-purple-500/[0.03]",
        !isCompleted && !isCurrent && !isSelected && "border-white/[0.03] bg-white/[0.005] opacity-60"
      )}
    >
      <div className={cn(
        "text-[10px] font-semibold mb-1",
        isSelected && "text-yellow-400",
        isCompleted && !isSelected && "text-zinc-400",
        isCurrent && !isSelected && "text-purple-400",
        !isCompleted && !isCurrent && !isSelected && "text-zinc-600"
      )}>
        {isSelected && "★ "}{isCurrent && !isSelected && "● "}
        第 {week.weekNumber} 周
      </div>
      <div className="text-[9px] text-zinc-500 truncate mb-1.5">{week.goal}</div>
      <div className="text-[9px]">
        {isCompleted && <span className="text-green-400">✓ {done}/{total}</span>}
        {isCurrent && !isCompleted && <span className="text-purple-400">{done}/{total}</span>}
        {!isCompleted && !isCurrent && <span className="text-zinc-600">待开始</span>}
      </div>
    </button>
  )
}
```

- [ ] **Step 2: 构建验证**

`cd E:\study-ai && npm run build 2>&1 | tail -5`

---

### Task 5: 学习资料面板 — LearningResources

**Files:**
- Create: `src/components/plan/learning-resources.tsx`

- [ ] **Step 1: 创建右侧资料面板组件**

```tsx
"use client"

import { useT } from "@/lib/i18n"
import type { LearningResource } from "@/types/plan"
import { FileText, Video, Code, BookOpen, Globe, ExternalLink } from "lucide-react"

interface LearningResourcesProps {
  resources: LearningResource[]
  dayNumber: number
}

const typeIcon: Record<string, React.ReactNode> = {
  paper: <FileText className="h-3.5 w-3.5" />,
  video: <Video className="h-3.5 w-3.5" />,
  code: <Code className="h-3.5 w-3.5" />,
  article: <Globe className="h-3.5 w-3.5" />,
  book: <BookOpen className="h-3.5 w-3.5" />,
}

const typeLabelKey: Record<string, string> = {
  paper: "resource.paper",
  video: "resource.video",
  code: "resource.code",
  article: "resource.article",
  book: "resource.book",
}

export function LearningResources({ resources, dayNumber }: LearningResourcesProps) {
  const t = useT()
  const grouped = resources.reduce<Record<string, LearningResource[]>>((acc, r) => {
    ;(acc[r.type] ??= []).push(r)
    return acc
  }, {})

  if (resources.length === 0) {
    return (
      <div className="w-[230px] flex-shrink-0 rounded-xl border border-white/[0.05] p-4 text-center">
        <p className="text-xs text-zinc-500">{t("resource.noResources")}</p>
      </div>
    )
  }

  return (
    <div className="w-[230px] flex-shrink-0 sticky top-16 rounded-xl border border-yellow-500/[0.08] bg-yellow-500/[0.02] p-4 max-h-[calc(100vh-6rem)] overflow-y-auto">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-sm">📚</span>
        <span className="text-xs font-bold text-zinc-300">Day {dayNumber} {t("resource.title")}</span>
      </div>

      {Object.entries(grouped).map(([type, items]) => (
        <div key={type} className="mt-3">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold text-zinc-500 uppercase mb-1.5">
            {typeIcon[type]}
            {t(typeLabelKey[type] || type)}
          </div>
          <div className="space-y-1">
            {items.map((r) => (
              <a
                key={r.id}
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-2 rounded-lg border border-white/[0.04] bg-white/[0.02] hover:bg-white/[0.05] transition-colors group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="text-[11px] text-zinc-300 group-hover:text-white leading-snug">
                    {r.title}
                  </div>
                  <ExternalLink className="h-3 w-3 text-zinc-600 flex-shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="text-[9px] text-zinc-600 mt-1">{r.source}</div>
              </a>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: 构建验证**

`cd E:\study-ai && npm run build 2>&1 | tail -5`

---

### Task 6: 按天分组任务 — DayTaskGroup

**Files:**
- Create: `src/components/plan/day-task-group.tsx`

- [ ] **Step 1: 创建按天分组任务卡片组件**

```tsx
"use client"

import type { DayPlan, DayTask } from "@/types/plan"
import { DayTaskCard } from "@/components/plan/day-task-card"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/cn"
import { useT } from "@/lib/i18n"
import { useState } from "react"

interface DayTaskGroupProps {
  day: DayPlan
  isToday: boolean
  isSelected: boolean
  onSelect: () => void
  onToggleTask: (taskId: string, completed: boolean) => void
  defaultExpanded?: boolean
}

export function DayTaskGroup({
  day,
  isToday,
  isSelected,
  onSelect,
  onToggleTask,
  defaultExpanded,
}: DayTaskGroupProps) {
  const t = useT()
  const [expanded, setExpanded] = useState(defaultExpanded ?? isToday)
  const doneCount = day.tasks.filter(t => t.completed).length
  const allDone = doneCount === day.tasks.length
  const isCurrent = isToday || isSelected

  return (
    <div
      onClick={onSelect}
      className={cn(
        "rounded-xl border overflow-hidden transition-all duration-200 cursor-pointer",
        isSelected && "border-yellow-500/35 bg-yellow-500/[0.04] shadow-lg shadow-yellow-500/[0.04]",
        isToday && !isSelected && "border-purple-500/15 bg-purple-500/[0.02]",
        !isToday && !isSelected && allDone && "border-white/[0.04] bg-white/[0.005] opacity-70",
        !isToday && !isSelected && !allDone && "border-white/[0.04] bg-white/[0.005]"
      )}
    >
      {/* Day header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-white/[0.01] border-b border-white/[0.03]">
        <div className="flex items-center gap-2.5">
          {isCurrent && <div className="w-1.5 h-1.5 rounded-full bg-yellow-400" />}
          <span className={cn(
            "text-xs font-bold",
            isCurrent && "text-yellow-400",
            allDone && !isCurrent && "text-zinc-500",
            !isCurrent && !allDone && "text-zinc-400"
          )}>
            Day {day.dayNumber}{isToday ? ` · ${t("dayGroup.today")}` : ""}
          </span>
          <span className="text-[10px] text-zinc-600">{day.date}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.03] text-zinc-500">{day.focus}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn(
            "text-[10px]",
            allDone && "text-green-400",
            !allDone && isCurrent && "text-yellow-400",
            !allDone && !isCurrent && "text-zinc-600"
          )}>
            {allDone ? "✓" : ""} {doneCount}/{day.tasks.length}
          </span>
          {day.tasks.length > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); setExpanded(!expanded) }}
              className="text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors"
            >
              {expanded ? "▲" : "▼"}
            </button>
          )}
        </div>
      </div>

      {/* Tasks */}
      {expanded && (
        <div className="px-3 py-2 space-y-1.5">
          {day.tasks.map((task) => (
            <DayTaskCard
              key={task.id}
              task={task}
              onToggle={(completed) => onToggleTask(task.id, completed)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: 构建验证**

`cd E:\study-ai && npm run build 2>&1 | tail -5`

---

### Task 7: 路线图主组件 — LearningRoadmap

**Files:**
- Create: `src/components/plan/learning-roadmap.tsx`

- [ ] **Step 1: 创建路线图主组件（阶段节点 + SVG 连线 + 状态管理）**

```tsx
"use client"

import { useState, useMemo } from "react"
import type { Stage, WeekPlan, DayPlan } from "@/types/plan"
import { RoadmapStageNode } from "@/components/plan/roadmap-stage-node"
import { RoadmapWeekNode } from "@/components/plan/roadmap-week-node"
import { LearningResources } from "@/components/plan/learning-resources"
import { DayTaskGroup } from "@/components/plan/day-task-group"
import { useT } from "@/lib/i18n"

interface LearningRoadmapProps {
  stages: Stage[]
  currentDay: number
  onToggleTask: (dayNumber: number, taskId: string, completed: boolean) => void
}

export function LearningRoadmap({ stages, currentDay, onToggleTask }: LearningRoadmapProps) {
  const t = useT()
  const [expandedStageId, setExpandedStageId] = useState<string | null>(null)
  const [selectedWeekNum, setSelectedWeekNum] = useState<number | null>(null)
  const [selectedDayNum, setSelectedDayNum] = useState<number | null>(null)

  // Flatten all weeks with stage context
  const allWeeks = useMemo(() => {
    return stages.flatMap((stage) =>
      stage.weeks.map((week) => ({
        week,
        stageId: stage.id,
        stageName: stage.name,
      }))
    )
  }, [stages])

  // Find the week and day that contain currentDay
  const currentWeekNum = useMemo(() => {
    for (const { week } of allWeeks) {
      for (const day of week.days) {
        if (day.dayNumber === currentDay) return week.weekNumber
      }
    }
    return null
  }, [allWeeks, currentDay])

  // Auto-expand current stage and select current week/day on mount
  const initialized = useState(false)
  if (!initialized[0]) {
    for (const stage of stages) {
      for (const week of stage.weeks) {
        if (week.days.some(d => d.dayNumber === currentDay)) {
          if (!expandedStageId) setExpandedStageId(stage.id)
          if (!selectedWeekNum) setSelectedWeekNum(week.weekNumber)
          if (!selectedDayNum) setSelectedDayNum(currentDay)
        }
      }
    }
    initialized[0] = true
  }

  // Compute stage status
  function getStageStatus(stage: Stage): "completed" | "active" | "pending" {
    const firstDay = stage.weeks[0]?.days[0]?.dayNumber ?? Infinity
    const lastDay = stage.weeks[stage.weeks.length - 1]?.days[stage.weeks[stage.weeks.length - 1].days.length - 1]?.dayNumber ?? 0
    if (currentDay > lastDay) return "completed"
    if (currentDay >= firstDay && currentDay <= lastDay) return "active"
    return "pending"
  }

  function getCompletedWeeks(stage: Stage): number {
    return stage.weeks.filter(w => w.days.every(d => d.tasks.every(t => t.completed))).length
  }

  function getWeekStatus(week: WeekPlan): "completed" | "current" | "pending" {
    const allDone = week.days.every(d => d.tasks.every(t => t.completed))
    if (allDone) return "completed"
    const weekDays = week.days.map(d => d.dayNumber)
    if (weekDays.includes(currentDay)) return "current"
    const allBefore = weekDays.every(n => n < currentDay)
    return allBefore ? "completed" : "pending"
  }

  // Selected week's days
  const selectedWeek = allWeeks.find(w => w.week.weekNumber === selectedWeekNum)?.week
  const selectedDay = selectedWeek?.days.find(d => d.dayNumber === selectedDayNum)
  const resources = selectedDay?.resources ?? []

  function handleToggleTask(dayNumber: number, taskId: string, completed: boolean) {
    onToggleTask(dayNumber, taskId, completed)
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
                                // Default select the first incomplete day, or current day
                                const firstPending = week.days.find(d => !d.tasks.every(t => t.completed)) ?? week.days[0]
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
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M5 12h14M13 5l7 7-7 7"
                          stroke={status === "completed" ? "#a78bfa" : status === "active" ? "#a78bfa" : "#3f3f46"}
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
                <div>
                  <span className="text-sm font-bold text-zinc-200">
                    第 {selectedWeek.weekNumber} 周 · {selectedWeek.goal}
                  </span>
                </div>
              </div>
              {selectedWeek.days.map((day) => (
                <DayTaskGroup
                  key={day.dayNumber}
                  day={day}
                  isToday={day.dayNumber === currentDay}
                  isSelected={selectedDayNum === day.dayNumber}
                  onSelect={() => setSelectedDayNum(day.dayNumber)}
                  onToggleTask={(taskId, completed) => handleToggleTask(day.dayNumber, taskId, completed)}
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
```

- [ ] **Step 2: 构建验证**

`cd E:\study-ai && npm run build 2>&1 | tail -5`

---

### Task 8: 修改计划详情页集成路线图

**Files:**
- Modify: `src/app/plan/[id]/page.tsx`

- [ ] **Step 1: 添加导入**

在 `src/app/plan/[id]/page.tsx` 的导入区域（第 6 行后）添加：

```tsx
import { LearningRoadmap } from "@/components/plan/learning-roadmap"
```

- [ ] **Step 2: 在概览卡片下方、Tab 上方插入路线图**

在 `PlanProgressBar` 组件之后（第 157 行后）、`<Tabs>` 之前的空行处插入路线图：

```tsx
      {/* Learning Roadmap */}
      <LearningRoadmap
        stages={currentPlan.stages}
        currentDay={currentDay}
        onToggleTask={(dayNumber, taskId, completed) =>
          toggleTask(currentPlan.id, dayNumber, taskId, completed)
        }
      />
```

注意：`toggleTask` 的现有签名是 `(planId: string, dayNumber: number, taskId: string, completed: boolean)`，需要使用 `usePlan` 返回的 `toggleTask`，用箭头函数包装。

- [ ] **Step 3: 调整任务算逻辑以支持路线图的 onToggle 回调**

验证 `usePlan` hook 返回的 `toggleTask` 签名。当前 page.tsx 第 198 行调用方式为：
```tsx
toggleTask(currentPlan.id, day.dayNumber, task.id, completed)
```

路线图的 `onToggleTask` 回调需要适配此签名。核对 `src/hooks/use-plan.ts` 确认。

- [ ] **Step 4: 构建验证**

`cd E:\study-ai && npm run build 2>&1 | tail -5`

---

### Task 9: 为 mock 数据添加示例学习资源

**Files:**
- Modify: `src/services/plan.mock.ts`

- [ ] **Step 1: 在 mock 计划生成中为部分天添加 resources**

在 `src/services/plan.mock.ts` 的 `generateMockDayTasks` 或日计划生成逻辑中，为第 22-28 天添加示例学习资源。找到 `DayPlan` 生成位置，为 days 添加 `resources` 字段：

```ts
// 在生成 DayPlan 对象的位置，部分天添加示例资源
const SAMPLE_RESOURCES: Record<number, import("@/types/plan").LearningResource[]> = {
  22: [
    { id: "r1", title: "ImageNet Classification with Deep CNNs (AlexNet)", url: "https://arxiv.org/abs/1404.5997", type: "paper", source: "arxiv.org" },
    { id: "r2", title: "Very Deep Convolutional Networks (VGG)", url: "https://arxiv.org/abs/1409.1556", type: "paper", source: "arxiv.org" },
    { id: "r3", title: "CNN Fundamentals", url: "https://www.deeplearning.ai/courses", type: "video", source: "DeepLearning.AI" },
  ],
  23: [
    { id: "r4", title: "You Only Look Once: Unified, Real-Time Object Detection", url: "https://arxiv.org/abs/1506.02640", type: "paper", source: "arxiv.org" },
    { id: "r5", title: "YOLOv3: An Incremental Improvement", url: "https://arxiv.org/abs/1804.02767", type: "paper", source: "arxiv.org" },
    { id: "r6", title: "C4W3: Object Detection", url: "https://www.deeplearning.ai/courses", type: "video", source: "DeepLearning.AI" },
    { id: "r7", title: "PyTorch YOLOv3 Implementation", url: "https://github.com/eriklindernoren/PyTorch-YOLOv3", type: "code", source: "GitHub" },
  ],
  24: [
    { id: "r8", title: "COCO Dataset", url: "https://cocodataset.org", type: "article", source: "cocodataset.org" },
    { id: "r9", title: "mAP (mean Average Precision) Explained", url: "https://github.com/rafaelpadilla/Object-Detection-Metrics", type: "code", source: "GitHub" },
  ],
}
```

在生成每个 DayPlan 后设置 `resources: SAMPLE_RESOURCES[dayNumber] ?? []`。

> 注意：需要具体查看 `plan.mock.ts` 中 DayPlan 的生成逻辑，因为当前代码使用 `generateMockDayTasks` 函数生成任务列表，需在调用后附加 resources。

- [ ] **Step 2: 构建验证**

`cd E:\study-ai && npm run build 2>&1 | tail -5`

---

### Task 10: 最终构建与验证

- [ ] **Step 1: 完整构建**

运行 `cd E:\study-ai && npm run build 2>&1`

预期结果：零 TypeScript 错误，全部路由正常。

- [ ] **Step 2: 提交所有代码**

```bash
cd E:\study-ai
git add src/types/plan.ts src/lib/i18n.ts \
  src/components/plan/roadmap-stage-node.tsx \
  src/components/plan/roadmap-week-node.tsx \
  src/components/plan/learning-resources.tsx \
  src/components/plan/day-task-group.tsx \
  src/components/plan/learning-roadmap.tsx \
  src/app/plan/\[id\]/page.tsx \
  src/services/plan.mock.ts
git commit -m "feat: add interactive learning roadmap to plan detail page

- Horizontal stage flow with expand/collapse and SVG arrow connectors
- Week node expansion below stages
- Day-by-day task groups with expand/collapse
- Learning resources panel following selected day
- Color-coded status: green=done, purple=active, yellow=selected, gray=pending
- Mock data with sample resources for days 22-24"
```

- [ ] **Step 3: 推送并部署**

```bash
cd E:\study-ai && git push origin master && npx vercel --prod --yes
```

---

## 验证检查清单

1. 打开任意学习计划 → 页面顶部显示路线图，当前阶段自动展开
2. 点击已完成阶段 → 展开/折叠周节点
3. 点击第 4 周 → 下方按天分组显示任务
4. 点击 Day 23 → 黄色高亮 + 右侧资料面板显示 YOLO 论文等资源
5. 勾选 Day 23 的某个任务 → 进度实时更新
6. 切换到「时间线」Tab → 原有垂直阶段视图正常工作
7. 切换到「理论依据」Tab → 原有理论面板正常
8. 移动端 → 路线图可横向滑动
9. `npm run build` 零错误
