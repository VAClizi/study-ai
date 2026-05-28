import type { LearningResource, PlanTheory, DayTask, DayPlan, WeekPlan, Stage } from "@/types/plan"
import type { ParsedPlanResult } from "@/services/plan-ai-parser"

// --- Incoming JSON shape from AI ---

interface ParsedTask {
  title: string
  desc: string
  mins: number
  priority: string
  difficulty: string
  tag: string
}

interface ParsedResource {
  title: string
  url: string
  type: string
  source: string
}

interface ParsedWeek {
  goal: string
  tasks: ParsedTask[]
  resources: ParsedResource[]
}

interface ParsedStage {
  name: string
  description: string
  goal: string
  durationWeeks: number
  weeks: ParsedWeek[]
}

interface ParsedTheory {
  name: string
  description: string
  application: string
  icon: string
}

interface ParsedPlanData {
  title?: string
  goal?: string
  stages?: ParsedStage[]
  theories?: ParsedTheory[]
}

// --- Legacy format (resources only) for backward compatibility ---

interface ParsedLegacyResource {
  week: number
  title: string
  url: string
  type: string
  source: string
}

interface ParsedLegacyData {
  resources?: ParsedLegacyResource[]
  theories?: ParsedTheory[]
}

// --- Output types ---

export interface ExtractedPlanData {
  title?: string
  goal?: string
  stages: Stage[]
  theories: PlanTheory[]
}

// --- Constants ---

const VALID_PRIORITIES = new Set(["high", "medium", "low"])
const VALID_DIFFICULTIES = new Set(["easy", "medium", "hard"])
const VALID_TAGS = new Set(["学习", "练习", "复习", "输出", "项目"])
const VALID_RESOURCE_TYPES = new Set(["paper", "video", "code", "article", "book"])
const VALID_THEORY_ICONS = new Set(["brain", "focus", "timer", "zap", "layers", "sunrise", "repeat", "book"])

const DAY_FOCUSES = ["新知学习", "复习巩固+新知推进", "实战应用", "系统整理", "综合练习", "拓展探索", "周度复盘"]

let _taskSeq = 0
function nextTaskId(): string {
  _taskSeq++
  return `ai-task-${_taskSeq}`
}

let _resSeq = 0
function nextResourceId(): string {
  _resSeq++
  return `ai-res-${_resSeq}`
}

// --- Helpers ---

function stripCodeFences(raw: string): string {
  return raw
    .replace(/^```(?:json)?\s*\n?/gm, "")
    .replace(/\n?```\s*$/gm, "")
    .trim()
}

function normalizeTask(t: ParsedTask, dayNumber: number, index: number): DayTask {
  return {
    id: nextTaskId(),
    title: String(t.title ?? ""),
    description: String(t.desc ?? ""),
    durationMinutes: typeof t.mins === "number" && t.mins > 0 ? t.mins : 25,
    priority: VALID_PRIORITIES.has(t.priority) ? (t.priority as DayTask["priority"]) : "medium",
    difficulty: VALID_DIFFICULTIES.has(t.difficulty) ? (t.difficulty as DayTask["difficulty"]) : "medium",
    completed: false,
    tags: [VALID_TAGS.has(t.tag) ? t.tag : "学习"],
  }
}

function normalizeResource(r: ParsedResource, weekNum: number, index: number): LearningResource {
  return {
    id: nextResourceId(),
    title: String(r.title ?? ""),
    url: String(r.url ?? ""),
    type: VALID_RESOURCE_TYPES.has(r.type) ? (r.type as LearningResource["type"]) : "article",
    source: String(r.source ?? ""),
  }
}

function normalizeTheory(t: ParsedTheory): PlanTheory {
  return {
    name: String(t.name ?? ""),
    description: String(t.description ?? ""),
    application: String(t.application ?? ""),
    icon: VALID_THEORY_ICONS.has(t.icon) ? t.icon : "brain",
  }
}

// --- Build WeekPlan from AI parsed week data ---

function buildWeekPlan(parsedWeek: ParsedWeek, weekNumber: number): WeekPlan {
  const tasks = parsedWeek.tasks ?? []
  const allResources = (parsedWeek.resources ?? []).map((r, i) => normalizeResource(r, weekNumber, i))

  const days: DayPlan[] = Array.from({ length: 7 }, (_, d) => {
    const dayNumber = (weekNumber - 1) * 7 + d + 1
    const dayTasks = tasks.map((t, ti) => normalizeTask(t, dayNumber, ti))
    const totalMinutes = dayTasks.reduce((sum, t) => sum + t.durationMinutes, 0)
    // Distribute resources across days instead of copying all to every day
    const dayResources = allResources.filter((_, ri) => ri % 7 === d)

    return {
      date: `Day ${dayNumber}`,
      dayNumber,
      focus: DAY_FOCUSES[d % 7],
      tasks: dayTasks,
      totalMinutes,
      notes: "",
      resources: dayResources.length > 0 ? dayResources : undefined,
    }
  })

  return {
    weekNumber,
    goal: parsedWeek.goal ?? `第${weekNumber}周`,
    days,
  }
}

// --- Build Stage from AI parsed stage data ---

function buildStage(parsedStage: ParsedStage, globalWeekOffset: number): { stage: Stage; weekCount: number } {
  const weeks: WeekPlan[] = []
  const parsedWeeks = parsedStage.weeks ?? []

  for (let w = 0; w < parsedWeeks.length; w++) {
    const weekNum = globalWeekOffset + w + 1
    weeks.push(buildWeekPlan(parsedWeeks[w], weekNum))
  }

  const stage: Stage = {
    id: `stage-ai-${globalWeekOffset + 1}`,
    name: parsedStage.name ?? "",
    description: parsedStage.description ?? "",
    durationWeeks: parsedStage.durationWeeks ?? parsedWeeks.length,
    goal: parsedStage.goal ?? "",
    weeks,
  }

  return { stage, weekCount: weeks.length }
}

// --- Brace-balanced JSON extraction ---

function extractBalancedJson(text: string): string | null {
  const start = text.indexOf("{")
  if (start === -1) return null

  let depth = 0
  let inString = false
  let escaped = false

  for (let i = start; i < text.length; i++) {
    const ch = text[i]
    if (inString) {
      if (escaped) { escaped = false; continue }
      if (ch === "\\") { escaped = true; continue }
      if (ch === '"') { inString = false; continue }
      continue
    }
    if (ch === '"') { inString = true; continue }
    if (ch === "{") { depth++ }
    else if (ch === "}") {
      depth--
      if (depth === 0) return text.slice(start, i + 1)
    }
  }

  // Truncated JSON: auto-close missing braces
  if (depth > 0) {
    return text.slice(start) + "}".repeat(depth)
  }

  return null
}

// --- Main extraction function ---

export function extractPlanData(content: string): ExtractedPlanData | null {
  const fullMatch = content.match(/\[PLAN_DATA\]\s*([\s\S]*?)\s*\[\/PLAN_DATA\]/)
  let jsonCandidate: string | null = null

  if (fullMatch) {
    jsonCandidate = fullMatch[1]
  } else {
    // Fallback: [PLAN_DATA] exists but [/PLAN_DATA] missing (AI truncation)
    const startIdx = content.indexOf("[PLAN_DATA]")
    if (startIdx !== -1) {
      const raw = content.slice(startIdx + 11)
      // Strip code fences before JSON extraction
      const cleaned = stripCodeFences(raw)
      jsonCandidate = extractBalancedJson(cleaned)
    }
  }

  if (!jsonCandidate) return null

  let jsonText = stripCodeFences(jsonCandidate)

  // Repair common AI JSON mistakes before parsing
  jsonText = jsonText
    .replace(/,(\s*[}\]])/g, "$1")       // trailing commas
    .replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3') // unquoted keys

  let parsed: Record<string, unknown>
  try {
    parsed = JSON.parse(jsonText)
  } catch (e) {
    console.error("extractPlanData JSON parse error:", e)
    return null
  }

  // Detect new format: stages[0].weeks_detail (day-level detail)
  const stages = parsed.stages as Array<Record<string, unknown>> | undefined
  if (stages?.length && stages[0].weeks_detail) {
    try {
      return convertParsedPlanToExtractedData(parsed as unknown as ParsedPlanResult)
    } catch {
      // Fall through to old format
    }
  }

  // Try old format: stages[0].weeks (week-level tasks)
  const p = parsed as unknown as ParsedPlanData | ParsedLegacyData
  const isLegacy = !(p as ParsedPlanData).stages && (p as ParsedLegacyData).resources

  const data: ExtractedPlanData = {
    title: (p as ParsedPlanData).title,
    goal: (p as ParsedPlanData).goal,
    stages: [],
    theories: [],
  }

  if (!isLegacy && (p as ParsedPlanData).stages) {
    const parsedStages = (p as ParsedPlanData).stages!
    let weekOffset = 0
    for (const ps of parsedStages) {
      const { stage, weekCount } = buildStage(ps, weekOffset)
      if (stage.weeks.length > 0) {
        data.stages.push(stage)
      }
      weekOffset += weekCount
    }
  } else if (isLegacy) {
    const legacy = p as ParsedLegacyData
    const byWeek = new Map<number, LearningResource[]>()
    if (Array.isArray(legacy.resources)) {
      for (let i = 0; i < legacy.resources.length; i++) {
        const r = legacy.resources[i]
        if (!r || typeof r.week !== "number" || !r.title || !r.url) continue
        const res = normalizeResource(r, r.week, i)
        const list = byWeek.get(r.week) ?? []
        list.push(res)
        byWeek.set(r.week, list)
      }
    }
    const legacyStages = buildLegacyStages(byWeek)
    data.stages = legacyStages
  }

  if (Array.isArray(parsed.theories)) {
    for (const t of parsed.theories) {
      if (!t || !t.name) continue
      data.theories.push(normalizeTheory(t as ParsedTheory))
    }
  }

  if (data.stages.length === 0 && data.theories.length === 0) return null

  return data
}

// --- Legacy stage builder (for old resources-only format) ---

function buildLegacyStages(resourcesByWeek: Map<number, LearningResource[]>): Stage[] {
  const stages: Stage[] = []
  const stageDefs = [
    { id: "stage-1", name: "第一阶段：基础搭建", desc: "建立学习节奏，掌握基础知识框架", goal: "完成基础知识学习，建立稳定的学习习惯", startWeek: 1, count: 2 },
    { id: "stage-2", name: "第二阶段：能力提升", desc: "深化理解，开始实际应用", goal: "掌握核心技能，能独立完成基础项目", startWeek: 3, count: 2 },
    { id: "stage-3", name: "第三阶段：巩固拓展", desc: "系统化知识，形成长期记忆", goal: "知识体系完整，能够灵活运用", startWeek: 5, count: 2 },
    { id: "stage-4", name: "第四阶段：实战检验", desc: "通过项目/考试检验成果", goal: "通过实战检验学习成果，达成最终目标", startWeek: 7, count: 2 },
  ]

  for (const def of stageDefs) {
    const weeks: WeekPlan[] = []
    for (let w = 0; w < def.count; w++) {
      const weekNum = def.startWeek + w
      const resources = resourcesByWeek.get(weekNum) ?? []
      weeks.push({
        weekNumber: weekNum,
        goal: `第${weekNum}周`,
        days: Array.from({ length: 7 }, (_, d) => {
          const dayNum = (weekNum - 1) * 7 + d + 1
          return {
            date: `Day ${dayNum}`,
            dayNumber: dayNum,
            focus: DAY_FOCUSES[d % 7],
            tasks: generateLegacyTasks(dayNum),
            totalMinutes: 75 + Math.floor(Math.random() * 30),
            notes: "",
            resources,
          }
        }),
      })
    }
    stages.push({
      id: def.id,
      name: def.name,
      description: def.desc,
      durationWeeks: def.count,
      goal: def.goal,
      weeks,
    })
  }
  return stages
}

function generateLegacyTasks(dayNumber: number): DayTask[] {
  const templates = [
    { title: "学习新知识（视频/阅读）", desc: "理解核心概念和原理", mins: 30, pri: "high" as const, diff: "medium" as const, tag: "学习" },
    { title: "动手练习实践", desc: "跟随教程完成练习任务", mins: 25, pri: "high" as const, diff: "medium" as const, tag: "练习" },
    { title: "间隔复习", desc: "根据记忆曲线复习之前内容", mins: 15, pri: "medium" as const, diff: "easy" as const, tag: "复习" },
    { title: "完成练习题", desc: "巩固今日所学知识", mins: 20, pri: "medium" as const, diff: "hard" as const, tag: "练习" },
    { title: "输出学习笔记/总结", desc: "用费曼学习法输出今日所学", mins: 10, pri: "low" as const, diff: "easy" as const, tag: "输出" },
  ]
  const tasks: DayTask[] = []
  const numTasks = 3 + (dayNumber % 3)
  for (let i = 0; i < numTasks; i++) {
    const tpl = templates[(dayNumber + i) % templates.length]
    tasks.push({
      id: nextTaskId(),
      title: tpl.title,
      description: tpl.desc,
      durationMinutes: tpl.mins + (i * 5),
      priority: tpl.pri,
      difficulty: tpl.diff,
      completed: false,
      tags: [tpl.tag],
    })
  }
  return tasks
}

// --- Convert AI-parsed plan (new format) to internal types ---

const PRIORITY_MAP: Record<string, DayTask["priority"]> = {
  "高优先": "high",
  "中优先": "medium",
  "低优先": "low",
  high: "high",
  medium: "medium",
  low: "low",
}

const DIFFICULTY_MAP: Record<string, DayTask["difficulty"]> = {
  "简单": "easy",
  "中等": "medium",
  "困难": "hard",
  easy: "easy",
  medium: "medium",
  hard: "hard",
}

export function convertParsedPlanToExtractedData(parsed: ParsedPlanResult): ExtractedPlanData {
  const stages: Stage[] = []
  let globalDayOffset = 0

  for (const ps of parsed.stages) {
    const weeks: WeekPlan[] = []

    for (const wd of ps.weeks_detail ?? []) {
      const days: DayPlan[] = []

      for (const pd of wd.days ?? []) {
        const tasks: DayTask[] = (pd.tasks ?? []).map((t, ti) => ({
          id: nextTaskId(),
          title: String(t.title ?? ""),
          description: String(t.description ?? ""),
          durationMinutes: typeof t.duration === "number" && t.duration > 0 ? t.duration : 25,
          priority: PRIORITY_MAP[t.priority] ?? "medium",
          difficulty: DIFFICULTY_MAP[typeof t.priority === "string" ? t.priority.toLowerCase() : ""] ?? "medium",
          completed: false,
          tags: ["学习"],
        }))

        const totalMinutes = tasks.reduce((sum, t) => sum + t.durationMinutes, 0)

        // Only use per-day resources — no week-level fallback
        const rawResources = pd.resources ?? []
        const resources: LearningResource[] = rawResources.map((r, ri) => ({
          id: nextResourceId(),
          title: String(r.title ?? ""),
          url: String(r.url ?? ""),
          type: (["paper", "video", "code", "article", "book"].includes(r.type) ? r.type : "article") as LearningResource["type"],
          source: String(r.source ?? ""),
        }))

        days.push({
          date: `Day ${pd.day}`,
          dayNumber: pd.day,
          focus: "",
          tasks,
          totalMinutes,
          notes: "",
          resources: resources.length > 0 ? resources : undefined,
        })
      }

      weeks.push({
        weekNumber: wd.week,
        goal: wd.name ?? `第${wd.week}周`,
        days,
      })
    }

    stages.push({
      id: `stage-${ps.stage}`,
      name: ps.name ?? `第${ps.stage}阶段`,
      description: "",
      durationWeeks: ps.weeks ?? weeks.length,
      goal: "",
      weeks,
    })
  }

  const theories: PlanTheory[] = (parsed.theories ?? []).map((t) => ({
    name: String(t.name ?? ""),
    description: String(t.description ?? ""),
    application: String(t.application ?? ""),
    icon: (["brain", "focus", "timer", "zap", "layers", "sunrise", "repeat", "book"].includes(t.icon) ? t.icon : "brain") as PlanTheory["icon"],
  }))

  return {
    title: parsed.title,
    goal: parsed.stages[0]?.name ?? "",
    stages,
    theories,
  }
}
