import { create } from "zustand"

export interface MemoryEntry {
  id: string
  type: "goal" | "habit" | "preference" | "fact" | "pattern"
  content: string
  confidence: number
  createdAt: string
  lastRecalledAt: string
  source: string
}

interface MemoryState {
  entries: MemoryEntry[]
  addMemory: (entry: Omit<MemoryEntry, "id" | "createdAt">) => void
  updateMemory: (id: string, updates: Partial<MemoryEntry>) => void
  forgetMemory: (id: string) => void
  clearAllMemories: () => void
  getContextString: () => string
  getRecentMemories: (limit?: number) => MemoryEntry[]
  getMemoriesByType: (type: MemoryEntry["type"]) => MemoryEntry[]
  extractAndSaveMemories: (conversationText: string) => MemoryEntry[]
}

const MEMORY_STORAGE = "studyai-memories"

function getStoredMemories(): MemoryEntry[] {
  if (typeof window === "undefined") return []
  try {
    const stored = localStorage.getItem(MEMORY_STORAGE)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function saveMemories(entries: MemoryEntry[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(MEMORY_STORAGE, JSON.stringify(entries))
}

let idCounter = Date.now()
function genId(): string {
  return `mem_${++idCounter}`
}

export const useMemoryStore = create<MemoryState>((set, get) => ({
  entries: getStoredMemories(),

  addMemory: (entry) => {
    const newEntry: MemoryEntry = {
      ...entry,
      id: genId(),
      createdAt: new Date().toISOString(),
    }
    set((s) => {
      const updated = [...s.entries, newEntry]
      saveMemories(updated)
      return { entries: updated }
    })
  },

  updateMemory: (id, updates) => {
    set((s) => {
      const updated = s.entries.map((e) =>
        e.id === id ? { ...e, ...updates } : e,
      )
      saveMemories(updated)
      return { entries: updated }
    })
  },

  forgetMemory: (id) => {
    set((s) => {
      const updated = s.entries.filter((e) => e.id !== id)
      saveMemories(updated)
      return { entries: updated }
    })
  },

  clearAllMemories: () => {
    saveMemories([])
    set({ entries: [] })
  },

  getContextString: () => {
    const entries = get().entries
    if (entries.length === 0) return ""

    const sorted = [...entries]
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 15)

    const byType: Record<string, string[]> = {}
    for (const e of sorted) {
      if (!byType[e.type]) byType[e.type] = []
      byType[e.type].push(e.content)
    }

    const lines: string[] = []
    for (const [type, contents] of Object.entries(byType)) {
      const label: Record<string, string> = {
        goal: "学习目标",
        habit: "学习习惯",
        preference: "偏好",
        fact: "基本信息",
        pattern: "行为模式",
      }
      lines.push(`${label[type] || type}: ${contents.join("；")}`)
    }

    return lines.join("\n")
  },

  getRecentMemories: (limit = 10) => {
    return [...get().entries]
      .sort((a, b) => new Date(b.lastRecalledAt).getTime() - new Date(a.lastRecalledAt).getTime())
      .slice(0, limit)
  },

  getMemoriesByType: (type) => {
    return get().entries.filter((e) => e.type === type)
  },

  extractAndSaveMemories: (conversationText: string) => {
    const newMemories: MemoryEntry[] = []
    const lower = conversationText.toLowerCase()

    // Simple keyword-based extraction (no LLM needed for basic facts)
    const patterns: { regex: RegExp; type: MemoryEntry["type"]; template: (m: RegExpMatchArray) => string }[] = [
      {
        regex: /(?:我的目标是|我想|我要|目标是|学习目标是)[：:\s]*([^。，.!?\n]+)/g,
        type: "goal",
        template: (m) => `学习目标: ${m[1].trim()}`,
      },
      {
        regex: /(?:我每天(?:有|可以|能)学(?:习)?|每天.*?(?:小时|分钟))[：:\s]*(\d+[^。，.!?\n]*)/g,
        type: "habit",
        template: (m) => `每日学习时间: ${m[1].trim()}`,
      },
      {
        regex: /(?:我(?:喜欢|偏好|习惯)|更(?:喜欢|倾向))[：:\s]*([^。，.!?\n]+)/g,
        type: "preference",
        template: (m) => `偏好: ${m[1].trim()}`,
      },
      {
        regex: /(?:我是|我叫|我的名字是)[：:\s]*([^。，.!?\n]+)/g,
        type: "fact",
        template: (m) => `身份: ${m[1].trim()}`,
      },
    ]

    for (const { regex, type, template } of patterns) {
      let match: RegExpExecArray | null
      while ((match = regex.exec(lower)) !== null) {
        const content = template(match)
        // Check for duplicates
        const exists = get().entries.some(
          (e) => e.type === type && e.content === content,
        )
        if (!exists) {
          const entry: MemoryEntry = {
            id: genId(),
            type,
            content,
            confidence: 0.7,
            createdAt: new Date().toISOString(),
            lastRecalledAt: new Date().toISOString(),
            source: "auto-extraction",
          }
          newMemories.push(entry)
        }
      }
      // Reset lastIndex for the next regex (global flag)
      regex.lastIndex = 0
    }

    if (newMemories.length > 0) {
      set((s) => {
        const updated = [...s.entries, ...newMemories]
        saveMemories(updated)
        return { entries: updated }
      })
    }

    return newMemories
  },
}))
