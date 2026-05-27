import type { ChatMessage, ChatSession, ChatMode, ChatQuestion } from "@/types/chat"
import { mockDelay, randomId } from "@/lib/mock-delay"

const CHOICE_LABELS = ["A", "B", "C", "D", "E", "F", "G", "H"]

/** Format select-type questions with —————— marker for clickable choice buttons */
function formatQuestionText(q: ChatQuestion): string {
  if (q.inputType === "select" && q.options && q.options.length > 0) {
    const baseQuestion = q.question.replace(/[（(][^)）]*[)）]$/, "").trim()
    const optionsText = q.options.map((opt, i) => `- ${CHOICE_LABELS[i]}. ${opt}`).join("\n")
    return `${baseQuestion}\n\n——————\n${optionsText}\n——————`
  }
  return q.question
}

// 快速模式问题
const QUICK_QUESTIONS: ChatQuestion[] = [
  { id: "q1", question: "你想学习什么内容？你的具体学习目标是什么？", field: "goal", inputType: "text" },
  { id: "q2", question: "你目前在这个领域的水平如何？（零基础/初级/中级/高级）", field: "level", inputType: "select", options: ["零基础", "初级", "中级", "高级"] },
  { id: "q3", question: "你每天能投入多少时间学习？（小时）", field: "dailyHours", inputType: "number" },
  { id: "q4", question: "你希望在多长时间内达成目标？", field: "deadline", inputType: "text" },
  { id: "q5", question: "你的学习偏好是什么？（看视频/看书/动手练习/听音频）", field: "learningStyle", inputType: "select", options: ["看视频教程", "看书/文档", "动手练习", "听音频/播客", "混合学习"] },
]

// 细致模式问题
const DETAILED_QUESTIONS: ChatQuestion[] = [
  { id: "d1", question: "你想学习什么内容？详细描述你的学习目标。", field: "goal", inputType: "text" },
  { id: "d2", question: "你目前在这个领域的水平如何？之前有过哪些相关学习经历？", field: "level", inputType: "text" },
  { id: "d3", question: "你每天能投入多少时间学习？（请具体到小时和分钟）", field: "dailyHours", inputType: "text" },
  { id: "d4", question: "你希望在哪一天之前达成目标？", field: "deadline", inputType: "text" },
  { id: "d5", question: "你的日常工作/学习安排是怎样的？", field: "workSchedule", inputType: "text" },
  { id: "d6", question: "你通常几点起床？几点睡觉？", field: "sleepPattern", inputType: "text" },
  { id: "d7", question: "一天中哪个时间段你感觉最有精力、最能集中注意力？", field: "bestTime", inputType: "select", options: ["清晨 (5-8点)", "上午 (8-12点)", "下午 (12-18点)", "晚上 (18-23点)", "深夜 (23点后)"] },
  { id: "d8", question: "你一次能持续专注多长时间？（分钟）", field: "focusDuration", inputType: "number" },
  { id: "d9", question: "你过去学习时，最容易因为什么原因放弃或中断？", field: "quitReason", inputType: "text" },
  { id: "d10", question: "你拖延时通常会做什么？（刷手机/玩游戏/看剧/发呆/其他）", field: "procrastinationType", inputType: "text" },
  { id: "d11", question: "你的手机每天使用时长大概多少？", field: "phoneUsage", inputType: "number" },
  { id: "d12", question: "你平时的压力水平怎么样？（1-10分）", field: "stressLevel", inputType: "slider" },
  { id: "d13", question: "你容易焦虑吗？学习新东西时会紧张吗？", field: "anxietyLevel", inputType: "text" },
  { id: "d14", question: "你是否容易熬夜？一般几点睡？", field: "nightOwl", inputType: "text" },
  { id: "d15", question: "你有定期复习的习惯吗？一般怎么复习？", field: "reviewHabit", inputType: "text" },
  { id: "d16", question: "你为什么要学习这个？你的内在动机是什么？", field: "motivation", inputType: "text" },
  { id: "d17", question: "你更喜欢独立学习还是和他人一起学习？", field: "socialLearning", inputType: "select", options: ["独立学习", "和他人一起", "两者结合"] },
  { id: "d18", question: "每天大概有多少时间花在娱乐上？（看剧/游戏/社交）", field: "entertainmentHours", inputType: "number" },
]

function buildPlanPrompt(answers: Record<string, string>, mode: ChatMode): string {
  const answersStr = Object.entries(answers).map(([k, v]) => `- ${k}: ${v}`).join("\n")
  return `根据以下用户信息，生成一个${mode === "quick" ? "简化版" : "详细版"}个性化学习计划：

${answersStr}

请按以下格式生成计划（使用 Markdown）：

## 学习计划概述
[一段简短概述]

## 阶段规划
分为若干阶段，每阶段有明确目标

## 第一周详细计划
Day 1 - Day 7 的具体任务，每个任务标注预计时间、难度、优先级

## 学习理论依据
说明计划中采用了哪些科学学习理论

## 给用户的建议
3-5条实用建议`
}

function generateMockPlanResponse(answers: Record<string, string>, mode: ChatMode): string {
  const isQuick = mode === "quick"
  const goal = answers.goal || "掌握新技能"
  const level = answers.level || "初级"
  const dailyHours = answers.dailyHours || "1-2"

  return `## 学习计划概述

根据你的情况（目标：${goal}，当前水平：${level}，每天可投入${dailyHours}小时），我为你制定了一个${isQuick ? "精简高效" : "全面深度"}的学习计划。${isQuick ? "" : "我详细分析了你的作息、学习习惯和注意力特点，"}这个计划遵循认知科学原理，帮助你高效达成目标。

## 阶段规划

### 第一阶段：基础搭建（第1-2周）
**目标：** 建立学习节奏，掌握基础知识框架

### 第二阶段：能力提升（第3-4周）
**目标：** 深化理解，开始实际应用

### 第三阶段：巩固拓展（第5-6周）
**目标：** 系统化知识，形成长期记忆

### 第四阶段：实战检验（第7-8周）
**目标：** 通过项目/考试检验成果

## 第一周详细计划

${Array.from({ length: 7 }, (_, i) => `
### Day ${i + 1}${i === 0 ? " （周一）" : ""}

| 时间 | 任务 | 分钟 | 难度 | 优先级 |
|------|------|------|------|--------|
${generateDayTasks(i).map(t => `| ${t.time} | ${t.task} | ${t.mins} | ${t.diff} | ${t.priority} |`).join("\n")}

**今日重点：** ${getDailyFocus(i)}
`).join("\n")}

## 学习理论依据

本计划融合了以下科学理论：

1. **间隔重复（Spaced Repetition）** — 根据艾宾浩斯遗忘曲线安排复习节点
2. **深度工作（Deep Work）** — 每天安排50分钟专注块，无干扰学习
3. **番茄工作法（Pomodoro）** — 25分钟专注 + 5分钟休息循环
4. **多巴胺管理** — 任务由易到难，建立成就感正反馈
5. **晨间优势** — 利用大脑清晨最佳状态处理高难度任务
6. **习惯养成模型（Habit Loop）** — 21天固化学习习惯
7. **认知负荷理论** — 任务分块，避免信息过载

## 给你的建议

1. **固定学习时间** — 每天同一时间学习，建立生物钟记忆
2. **先难后易** — 精力最好时攻克最难的任务
3. **及时记录** — 每天写下学习总结，哪怕只有3句话
4. **允许不完美** — 偶尔中断不要自责，第二天继续就好
5. **奖励机制** — 每完成一个小目标，给自己一个小奖励`
}

function generateDayTasks(dayIndex: number) {
  const allTasks = [
    [
      { time: "09:00", task: "学习新概念（观看教学视频）", mins: "30", diff: "⭐", priority: "高" },
      { time: "09:35", task: "动手练习（跟随教程实操）", mins: "25", diff: "⭐⭐", priority: "高" },
      { time: "10:05", task: "整理笔记，画出知识框架", mins: "15", diff: "⭐", priority: "中" },
      { time: "10:25", task: "做2道练习题检验理解", mins: "20", diff: "⭐⭐⭐", priority: "中" },
    ],
    [
      { time: "09:00", task: "快速复习Day1知识点", mins: "15", diff: "⭐", priority: "高" },
      { time: "09:20", task: "学习新章节内容", mins: "35", diff: "⭐⭐", priority: "高" },
      { time: "10:00", task: "完成配套练习（3-5题）", mins: "25", diff: "⭐⭐⭐", priority: "中" },
      { time: "10:30", task: "回顾错题并记录要点", mins: "15", diff: "⭐⭐", priority: "低" },
    ],
    [
      { time: "09:00", task: "回顾Day1-Day2核心概念", mins: "20", diff: "⭐", priority: "高" },
      { time: "09:25", task: "进阶内容学习", mins: "30", diff: "⭐⭐⭐", priority: "高" },
      { time: "10:00", task: "实战小项目/综合练习", mins: "30", diff: "⭐⭐⭐", priority: "中" },
      { time: "10:35", task: "输出学习总结（写/录）", mins: "15", diff: "⭐", priority: "低" },
    ],
    [
      { time: "09:00", task: "间隔复习（Day1-Day3）", mins: "25", diff: "⭐⭐", priority: "高" },
      { time: "09:30", task: "新知识系统性学习", mins: "30", diff: "⭐⭐⭐", priority: "高" },
      { time: "10:05", task: "完成挑战性练习", mins: "25", diff: "⭐⭐⭐", priority: "中" },
      { time: "10:35", task: "整理本周学习思维导图", mins: "15", diff: "⭐", priority: "低" },
    ],
    [
      { time: "09:00", task: "本周重点知识总结复习", mins: "30", diff: "⭐⭐", priority: "高" },
      { time: "09:35", task: "综合应用练习", mins: "30", diff: "⭐⭐⭐", priority: "高" },
      { time: "10:10", task: "模拟测试/自我考核", mins: "20", diff: "⭐⭐⭐", priority: "中" },
      { time: "10:35", task: "制定下周学习目标", mins: "10", diff: "⭐", priority: "低" },
    ],
    [
      { time: "09:00", task: "自由探索学习（拓宽知识面）", mins: "30", diff: "⭐⭐", priority: "中" },
      { time: "09:35", task: "薄弱环节针对性训练", mins: "30", diff: "⭐⭐⭐", priority: "高" },
      { time: "10:10", task: "学习成果输出（博客/笔记）", mins: "25", diff: "⭐⭐", priority: "中" },
      { time: "10:40", task: "本周学习回顾与反思", mins: "15", diff: "⭐", priority: "低" },
    ],
    [
      { time: "09:00", task: "周度全面复习与总结", mins: "40", diff: "⭐⭐", priority: "高" },
      { time: "09:45", task: "完成周测/周度挑战", mins: "30", diff: "⭐⭐⭐", priority: "中" },
      { time: "10:20", task: "规划下周学习内容", mins: "15", diff: "⭐", priority: "低" },
    ],
  ]
  return allTasks[dayIndex % allTasks.length]
}

function getDailyFocus(day: number): string {
  const focuses = [
    "建立基础认知，不追求速度追求理解",
    "在复习基础上推进新知，注意知识衔接",
    "加强实践应用，理论结合实际操作",
    "巩固本周所学，开始构建知识体系",
    "检验学习效果，找到薄弱环节",
    "拓展学习广度，保持学习好奇心",
    "总结复盘，为下一阶段做好准备",
  ]
  return focuses[day % focuses.length]
}

const CHECKIN_FOLLOWUP_QUESTIONS = [
  "今天学习中有没有哪里没搞懂的？",
  "今天最大的困难是什么？",
  "今天的专注度如何？能打几分（1-10）？",
  "明天需要调整计划吗？",
  "请用一句话总结今天的学习收获",
]

const COACH_MESSAGES = {
  streak: [
    "你已经连续坚持 {days} 天了！习惯正在形成，继续保持！",
    "连续学习 {days} 天！你比自己想象的更强大。",
    "{days} 天不间断学习，这是真正的自律！",
  ],
  reminder: [
    "已经 {days} 天没看到你学习了，需要帮你调整一下计划难度吗？",
    "最近似乎中断了学习，没关系，我们可以重新开始。要不要简化一下任务？",
    "生活总有起伏，重要的是回来继续。需要我帮你调整吗？",
  ],
  encouragement: [
    "今天的努力，是明天的基础。开始学习吧！",
    "每一步都算数，今天也不例外。",
    "最好的学习时间是昨天，其次就是现在。",
  ],
}

export interface MockChatService {
  getQuickQuestions(): Promise<ChatQuestion[]>
  getDetailedQuestions(): Promise<ChatQuestion[]>
  generatePlan(answers: Record<string, string>, mode: ChatMode): Promise<string>
  getCheckinFollowup(): Promise<string[]>
  getCoachMessage(type: keyof typeof COACH_MESSAGES, params?: Record<string, number>): string
  getSessions(): Promise<ChatSession[]>
  getSession(id: string): Promise<ChatSession | null>
  createSession(mode: ChatMode): Promise<ChatSession>
  addMessage(sessionId: string, message: ChatMessage): Promise<void>
}

const sessions: ChatSession[] = []

export const mockChatService: MockChatService = {
  async getQuickQuestions() {
    await mockDelay(300, 600)
    return QUICK_QUESTIONS.map((q) => ({
      ...q,
      question: formatQuestionText(q),
    }))
  },

  async getDetailedQuestions() {
    await mockDelay(300, 600)
    return DETAILED_QUESTIONS.map((q) => ({
      ...q,
      question: formatQuestionText(q),
    }))
  },

  async generatePlan(answers: Record<string, string>, mode: ChatMode) {
    // 模拟流式延迟，让用户感觉到AI在"思考"
    await mockDelay(1000, 2500)
    return generateMockPlanResponse(answers, mode)
  },

  async getCheckinFollowup() {
    await mockDelay(200, 500)
    return [...CHECKIN_FOLLOWUP_QUESTIONS]
  },

  getCoachMessage(type: keyof typeof COACH_MESSAGES, params?: Record<string, number>) {
    const messages = COACH_MESSAGES[type]
    let msg = messages[Math.floor(Math.random() * messages.length)]
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        msg = msg.replace(`{${key}}`, String(value))
      }
    }
    return msg
  },

  async getSessions() {
    await mockDelay(200, 500)
    return sessions
  },

  async getSession(id: string) {
    await mockDelay(200, 400)
    return sessions.find(s => s.id === id) || null
  },

  async createSession(mode: ChatMode) {
    await mockDelay(200, 400)
    const session: ChatSession = {
      id: randomId(),
      userId: "user-001",
      mode,
      title: `${mode === "quick" ? "快速" : "深度"}规划 - ${new Date().toLocaleDateString("zh-CN")}`,
      messages: [
        {
          id: randomId(),
          role: "assistant",
          content: mode === "quick"
            ? "你好！我将用5个问题快速了解你的需求，为你生成学习计划。准备好了吗？\n\n第一个问题：你想学习什么内容？你的具体学习目标是什么？"
            : "你好！我将通过一系列深入的问题，全面了解你的学习习惯、作息和特点，为你打造高度个性化的学习计划。这个过程大约需要10-15分钟。\n\n准备好了吗？我们先从最基础的问题开始：你想学习什么内容？详细描述一下你的学习目标吧。",
          timestamp: new Date().toISOString(),
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    sessions.push(session)
    return session
  },

  async addMessage(sessionId: string, message: ChatMessage) {
    const session = sessions.find(s => s.id === sessionId)
    if (session) {
      session.messages.push(message)
      session.updatedAt = new Date().toISOString()
    }
  },
}

export type { ChatQuestion }
