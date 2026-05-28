import type { LearningResource, PlanTheory } from "@/types/plan"

interface ParsedResource {
  week: number
  title: string
  url: string
  type: string
  source: string
}

interface ParsedTheory {
  name: string
  description: string
  application: string
  icon: string
}

interface ParsedPlanData {
  resources?: ParsedResource[]
  theories?: ParsedTheory[]
}

const VALID_RESOURCE_TYPES = new Set(["paper", "video", "code", "article", "book"])
const VALID_THEORY_ICONS = new Set(["brain", "focus", "timer", "zap", "layers", "sunrise", "repeat", "book"])

export interface ExtractedPlanData {
  /** Resources indexed by dayNumber */
  resourcesByDay: Map<number, LearningResource[]>
  theories: PlanTheory[]
}

function newResourceId(week: number, index: number): string {
  return `ai-r-w${week}-${index}`
}

/**
 * Extract structured plan data from AI-generated chat content.
 * Returns null if the [PLAN_DATA] block is missing or unparseable.
 */
export function extractPlanData(content: string): ExtractedPlanData | null {
  const match = content.match(/\[PLAN_DATA\]\s*([\s\S]*?)\s*\[\/PLAN_DATA\]/)
  if (!match) return null

  let parsed: ParsedPlanData
  try {
    parsed = JSON.parse(match[1].trim())
  } catch {
    return null
  }

  const resourcesByDay = new Map<number, LearningResource[]>()
  const theories: PlanTheory[] = []

  // Parse resources: map week number → day numbers (7 days per week)
  if (Array.isArray(parsed.resources)) {
    const byWeek = new Map<number, LearningResource[]>()
    for (let i = 0; i < parsed.resources.length; i++) {
      const r = parsed.resources[i]
      if (!r || typeof r.week !== "number" || !r.title || !r.url) continue
      const type = VALID_RESOURCE_TYPES.has(r.type) ? r.type : "article"
      const resource: LearningResource = {
        id: newResourceId(r.week, i),
        title: String(r.title),
        url: String(r.url),
        type: type as LearningResource["type"],
        source: String(r.source ?? ""),
      }
      const list = byWeek.get(r.week) ?? []
      list.push(resource)
      byWeek.set(r.week, list)
    }
    // Distribute to days: each week's resources go to every day of that week
    for (const [week, resources] of byWeek) {
      const startDay = (week - 1) * 7 + 1
      for (let d = 0; d < 7; d++) {
        resourcesByDay.set(startDay + d, resources)
      }
    }
  }

  // Parse theories
  if (Array.isArray(parsed.theories)) {
    for (const t of parsed.theories) {
      if (!t || !t.name) continue
      theories.push({
        name: String(t.name),
        description: String(t.description ?? ""),
        application: String(t.application ?? ""),
        icon: VALID_THEORY_ICONS.has(t.icon) ? t.icon : "brain",
      })
    }
  }

  return { resourcesByDay, theories }
}
