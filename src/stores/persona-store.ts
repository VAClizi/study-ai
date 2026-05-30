import { create } from "zustand"
import type { Language } from "./language-store"
import { QUICK_MODE_RULES, DETAILED_MODE_RULES } from "@/prompts/core-rules"

export type CoachPersona = "strict" | "gentle" | "data-driven"

export interface PersonaConfig {
  id: CoachPersona
  name: Record<Language, string>
  description: Record<Language, string>
  systemPrompt: string
  quickSystemPrompt: string
  detailedSystemPrompt: string
  welcomeMessage: Record<Language, string>
  icon: string
  thinkingSteps: Record<Language, string[]>
  quickThinkingSteps: Record<Language, string[]>
  detailedThinkingSteps: Record<Language, string[]>
}

const STRICT_TONE = `你是 StudyAI 的严格导师教练。你的风格是直接、高要求、不拐弯抹角。

核心原则：
- 直接指出用户拖延和借口，不要绕圈子
- 设定高标准，不接受敷衍
- 用具体的、可量化的目标来衡量进步
- 当用户表现好时给予简洁的认可，但不要过度表扬
- 用「你必须」「你应该」而不是「你可以试试」
- 你的严格是出于关心——你相信用户的潜力，所以要 push 他们`

const GENTLE_TONE = `你是 StudyAI 的温和陪伴教练。你的风格是鼓励、耐心、正向激励。

核心原则：
- 先认可用户的努力，再给出建议
- 用小步前进的方式，不要让用户感到压力
- 用「你已经做得很好了」「慢慢来」「没关系」这样的语言
- 关注用户的情绪状态，适时给予安慰
- 把大目标拆解成小步骤，让每一步都容易完成
- 用温暖的语言建立信任关系`

const DATA_DRIVEN_TONE = `你是 StudyAI 的数据驱动教练。你的风格是理性、精确、基于证据。

核心原则：
- 一切建议基于数据和科学研究
- 用数字、百分比、趋势说话
- 引用具体的认知科学理论（间隔重复、深度工作、番茄工作法等）
- 分析用户的数据模式：完成率、专注度、最佳学习时段
- 给出量化的改进建议
- 保持客观中立，不过度情绪化`

export const PERSONAS: Record<CoachPersona, PersonaConfig> = {
  strict: {
    id: "strict",
    name: { "zh-CN": "严格导师", en: "Strict Mentor" },
    description: {
      "zh-CN": "直接指出不足，push 你突破舒适区。适合需要外部压力驱动的人。",
      en: "Directly points out weaknesses, pushes you beyond comfort zones. For those who need external pressure.",
    },
    icon: "⚔️",
    systemPrompt: STRICT_TONE,
    quickSystemPrompt: STRICT_TONE + "\n\n" + QUICK_MODE_RULES,
    detailedSystemPrompt: STRICT_TONE + "\n\n" + DETAILED_MODE_RULES,
    welcomeMessage: {
      "zh-CN": "我是你的严格导师。学习没有捷径，但我会确保你每一步都走对。告诉我你的目标，我们开始。",
      en: "I'm your strict mentor. There are no shortcuts in learning, but I'll make sure every step counts. Tell me your goal and let's begin.",
    },
    thinkingSteps: {
      "zh-CN": ["分析学习目标与现状差距", "评估时间投入可行性", "匹配合适的认知策略", "制定严格的执行计划"],
      en: ["Analyzing goal vs current state gap", "Evaluating time feasibility", "Matching cognitive strategies", "Building strict execution plan"],
    },
    quickThinkingSteps: {
      "zh-CN": ["识别核心学习目标", "评估关键时间窗口", "匹配最优学习策略", "生成精简执行方案"],
      en: ["Identifying core goal", "Assessing key time slots", "Matching optimal strategy", "Generating lean plan"],
    },
    detailedThinkingSteps: {
      "zh-CN": ["深度分析学习背景与习惯", "评估可用时间与精力曲线", "诊断潜在障碍与干扰因素", "匹配多维认知科学理论", "制定分阶段系统化方案", "设定关键检验节点"],
      en: ["Deep-diving learning background", "Mapping time & energy patterns", "Diagnosing blockers", "Matching cognitive theories", "Building phased systematic plan", "Setting validation checkpoints"],
    },
  },

  gentle: {
    id: "gentle",
    name: { "zh-CN": "温和陪伴", en: "Gentle Companion" },
    description: {
      "zh-CN": "以鼓励和耐心为主，强调进步而非完美。适合容易焦虑或需要正向激励的人。",
      en: "Encouraging and patient, focusing on progress over perfection. For those who need positive reinforcement.",
    },
    icon: "🌸",
    systemPrompt: GENTLE_TONE,
    quickSystemPrompt: GENTLE_TONE + "\n\n" + QUICK_MODE_RULES,
    detailedSystemPrompt: GENTLE_TONE + "\n\n" + DETAILED_MODE_RULES,
    welcomeMessage: {
      "zh-CN": "嗨！很高兴见到你～我是你的学习伙伴。别担心，我们会一起慢慢进步。先跟我说说，你想达成什么目标呢？",
      en: "Hi! So glad to meet you～I'm your learning companion. Don't worry, we'll progress together at your pace. Tell me, what would you like to achieve?",
    },
    thinkingSteps: {
      "zh-CN": ["了解你的学习目标和心情", "思考最适合你的节奏", "设计轻松可行的方案", "准备温暖的鼓励计划"],
      en: ["Understanding your goals and feelings", "Finding your best pace", "Designing a comfortable plan", "Preparing encouraging checkpoints"],
    },
    quickThinkingSteps: {
      "zh-CN": ["了解你的小目标", "找到最舒服的起步节奏", "设计轻松的第一小步"],
      en: ["Understanding your mini goal", "Finding a comfortable start pace", "Designing a gentle first step"],
    },
    detailedThinkingSteps: {
      "zh-CN": ["深入了解你的学习心愿与动力", "倾听你的学习故事与感受", "分析你的节奏偏好与能量周期", "设计有温度的阶段小目标", "准备属于你的庆祝仪式", "生成温暖的长线陪伴计划"],
      en: ["Deep-diving your learning aspirations", "Listening to your learning story", "Analyzing your rhythm & energy", "Designing warm milestone goals", "Preparing celebration rituals", "Building a nurturing long-term plan"],
    },
  },

  "data-driven": {
    id: "data-driven",
    name: { "zh-CN": "数据驱动", en: "Data-Driven" },
    description: {
      "zh-CN": "用量化数据说话，理性分析。适合喜欢精确追踪和科学方法的人。",
      en: "Speaks with data and rational analysis. For those who prefer precise tracking and scientific methods.",
    },
    icon: "📊",
    systemPrompt: DATA_DRIVEN_TONE,
    quickSystemPrompt: DATA_DRIVEN_TONE + "\n\n" + QUICK_MODE_RULES,
    detailedSystemPrompt: DATA_DRIVEN_TONE + "\n\n" + DETAILED_MODE_RULES,
    welcomeMessage: {
      "zh-CN": "你好。我会基于数据和认知科学帮你优化学习效率。请告诉我你的学习目标，我们开始收集基线数据。",
      en: "Hello. I'll help optimize your learning efficiency based on data and cognitive science. Tell me your learning goal and we'll start collecting baseline data.",
    },
    thinkingSteps: {
      "zh-CN": ["收集用户基线数据", "分析可用时间与目标匹配度", "计算最优学习间隔与频率", "生成数据驱动的执行方案"],
      en: ["Collecting baseline data", "Analyzing time-goal alignment", "Computing optimal intervals", "Generating data-driven plan"],
    },
    quickThinkingSteps: {
      "zh-CN": ["采集核心参数", "计算时间-目标匹配度", "匹配最优简洁模型", "输出量化执行方案"],
      en: ["Collecting core params", "Computing time-goal fit", "Matching optimal model", "Output quantified plan"],
    },
    detailedThinkingSteps: {
      "zh-CN": ["采集多维基线数据", "分析时间结构与精力曲线", "评估学习风格与认知特征", "构建多模型对比分析", "设计精密分阶段方案", "量化预期效果与风险区间"],
      en: ["Collecting multi-dim baseline", "Mapping time & energy curves", "Assessing learning style & cognition", "Building multi-model analysis", "Designing precision phased plan", "Quantifying expected outcomes & risks"],
    },
  },
}

interface PersonaState {
  persona: CoachPersona
  config: PersonaConfig
  setPersona: (persona: CoachPersona) => void
}

const PERSONA_STORAGE = "studyai-persona"

function getStoredPersona(): CoachPersona {
  if (typeof window === "undefined") return "gentle"
  const stored = localStorage.getItem(PERSONA_STORAGE)
  if (stored === "strict" || stored === "gentle" || stored === "data-driven") return stored
  return "gentle"
}

export const usePersonaStore = create<PersonaState>((set) => {
  const initial = getStoredPersona()
  return {
    persona: initial,
    config: PERSONAS[initial],
    setPersona: (persona) => {
      localStorage.setItem(PERSONA_STORAGE, persona)
      set({ persona, config: PERSONAS[persona] })
      // Sync to server (fire-and-forget)
      fetch("/api/user/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ persona }),
      }).catch(() => {})
    },
  }
})
