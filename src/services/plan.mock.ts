import type { LearningPlan, DayTask, Stage, PlanTheory, LearningResource } from "@/types/plan"
import { mockDelay, randomId } from "@/lib/mock-delay"

const MOCK_THEORIES: PlanTheory[] = [
  {
    name: "间隔重复",
    description: "根据艾宾浩斯遗忘曲线，在遗忘临界点进行复习，记忆效率提升300%",
    application: "在Day1学习后的第1、3、7天安排复习节点",
    icon: "brain",
  },
  {
    name: "深度工作",
    description: "Cal Newport提出，无干扰的深度专注产出是浅层工作的4倍",
    application: "每天安排50分钟无手机、无干扰的专注学习块",
    icon: "focus",
  },
  {
    name: "番茄工作法",
    description: "25分钟专注+5分钟休息的循环，维持最佳注意力水平",
    application: "每个学习任务按25分钟单元拆分，中间强制休息",
    icon: "timer",
  },
  {
    name: "多巴胺管理",
    description: "利用大脑奖赏机制，通过完成小任务获得正反馈，维持学习动力",
    application: "任务由易到难排列，每完成一项产生成就感",
    icon: "zap",
  },
  {
    name: "认知负荷理论",
    description: "工作记忆容量有限，将复杂知识分块处理，避免信息过载",
    application: "每天新知识不超过3个核心概念，确保充分消化",
    icon: "layers",
  },
  {
    name: "晨间优势",
    description: "大脑经过睡眠后，清晨前额叶皮层最活跃，适合高难度认知任务",
    application: "将最困难的学习任务安排在早晨第一个学习时段",
    icon: "sunrise",
  },
  {
    name: "习惯养成模型",
    description: "Charles Duhigg的习惯回路：提示→惯常行为→奖赏，21天形成新习惯",
    application: "固定时间+固定地点学习，完成后给予小奖励，形成自动化",
    icon: "repeat",
  },
  {
    name: "费曼学习法",
    description: "最好的学习方式是教给别人，用简单语言解释复杂概念",
    application: "每天学习后输出一段教学笔记，用白话说清楚今天学到的内容",
    icon: "book",
  },
]

let plans: LearningPlan[] = []

export interface MockPlanService {
  getPlans(userId: string): Promise<LearningPlan[]>
  getPlan(id: string): Promise<LearningPlan | null>
  createPlanFromChat(chatContent: string, userId: string, mode: "quick" | "detailed", chatSessionId?: string): Promise<LearningPlan>
  updateTask(planId: string, dayNumber: number, taskId: string, completed: boolean): Promise<void>
  getTodayTasks(planId: string): Promise<{ date: string; dayNumber: number; tasks: DayTask[] } | null>
  deletePlan(id: string): Promise<void>
}

export const mockPlanService: MockPlanService = {
  async getPlans(userId: string) {
    await mockDelay(300, 600)
    return plans.filter(p => p.userId === userId)
  },

  async getPlan(id: string) {
    await mockDelay(200, 500)
    return plans.find(p => p.id === id) || null
  },

  async createPlanFromChat(chatContent: string, userId: string, mode: "quick" | "detailed", chatSessionId?: string) {
    await mockDelay(800, 2000)
    const now = new Date()

    // Try to extract goal from chat content
    const goalMatch = chatContent.match(/(?:目标|学习|掌握|达成)[：:]\s*(.+?)(?:\n|$)/i)
      || chatContent.match(/为你制定.*?(?:学习|掌握)(.+?)(?:的|，)/)
    const extractedGoal = goalMatch ? goalMatch[1]?.trim().slice(0, 30) : null

    const plan: LearningPlan = {
      id: `plan-${randomId()}`,
      userId,
      title: extractedGoal ? `${extractedGoal}${mode === "quick" ? "快速" : "深度"}学习计划` : `${mode === "quick" ? "快速" : "深度"}学习计划`,
      goal: {
        title: extractedGoal || "掌握目标技能",
        description: "通过系统化的学习计划达成学习目标",
        deadline: new Date(now.getTime() + 56 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        currentLevel: "初级",
        targetLevel: "中高级",
      },
      mode,
      stages: generateStages(),
      theories: MOCK_THEORIES,
      weeklyGoal: "完成本周所有学习任务，建立稳定的学习节奏",
      monthlyGoal: "完成前两个阶段的学习，掌握核心基础知识和应用能力",
      phaseGoal: "通过8周系统学习，从基础到实战，实现学习目标",
      status: "active",
      createdAt: now.toISOString(),
      endDate: new Date(now.getTime() + 56 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      chatSessionId,
    }
    plans.push(plan)
    return plan
  },

  async updateTask(planId: string, dayNumber: number, taskId: string, completed: boolean) {
    await mockDelay(100, 300)
    const plan = plans.find(p => p.id === planId)
    if (plan) {
      for (const stage of plan.stages) {
        for (const week of stage.weeks) {
          for (const day of week.days) {
            if (day.dayNumber === dayNumber) {
              const task = day.tasks.find(t => t.id === taskId)
              if (task) task.completed = completed
            }
          }
        }
      }
    }
  },

  async getTodayTasks(planId: string) {
    await mockDelay(200, 500)
    const plan = plans.find(p => p.id === planId)
    if (!plan) return null
    const now = new Date()
    const startDate = new Date(plan.createdAt)
    const dayDiff = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    const dayNumber = Math.min(dayDiff + 1, 56)

    for (const stage of plan.stages) {
      for (const week of stage.weeks) {
        for (const day of week.days) {
          if (day.dayNumber === dayNumber) {
            return { date: now.toISOString().split("T")[0], dayNumber, tasks: day.tasks }
          }
        }
      }
    }
    return null
  },

  async deletePlan(id: string) {
    await mockDelay(200, 400)
    plans = plans.filter(p => p.id !== id)
  },
}

const SAMPLE_RESOURCES: Record<number, LearningResource[]> = {
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

function generateStages(): Stage[] {
  return [
    {
      id: "stage-1",
      name: "第一阶段：基础搭建",
      description: "建立学习节奏，掌握基础知识框架",
      durationWeeks: 2,
      goal: "完成基础知识学习，建立稳定的学习习惯",
      weeks: generateWeeks(1, 2),
    },
    {
      id: "stage-2",
      name: "第二阶段：能力提升",
      description: "深化理解，开始实际应用",
      durationWeeks: 2,
      goal: "掌握核心技能，能独立完成基础项目",
      weeks: generateWeeks(3, 2),
    },
    {
      id: "stage-3",
      name: "第三阶段：巩固拓展",
      description: "系统化知识，形成长期记忆",
      durationWeeks: 2,
      goal: "知识体系完整，能够灵活运用",
      weeks: generateWeeks(5, 2),
    },
    {
      id: "stage-4",
      name: "第四阶段：实战检验",
      description: "通过项目/考试检验成果",
      durationWeeks: 2,
      goal: "通过实战检验学习成果，达成最终目标",
      weeks: generateWeeks(7, 2),
    },
  ]
}

function generateWeeks(startWeek: number, count: number) {
  const weeks = []
  for (let w = 0; w < count; w++) {
    const weekNum = startWeek + w
    weeks.push({
      weekNumber: weekNum,
      goal: `第${weekNum}周：${["建立基础习惯", "加强理解与应用", "系统化与深化", "综合实战与检验"][Math.min(weekNum - 1, 3)]}`,
      days: Array.from({ length: 7 }, (_, d) => ({
        date: `Day ${(weekNum - 1) * 7 + d + 1}`,
        dayNumber: (weekNum - 1) * 7 + d + 1,
        focus: getDayFocus((weekNum - 1) * 7 + d),
        tasks: generateMockDayTasks((weekNum - 1) * 7 + d + 1),
        totalMinutes: 60 + Math.floor(Math.random() * 30),
        notes: "",
        resources: SAMPLE_RESOURCES[(weekNum - 1) * 7 + d + 1] ?? [],
      })),
    })
  }
  return weeks
}

function getDayFocus(dayIndex: number): string {
  const focuses = [
    "新知学习", "复习巩固+新知推进", "实战应用", "系统整理",
    "综合练习", "拓展探索", "周度复盘",
  ]
  return focuses[dayIndex % 7]
}

function generateMockDayTasks(dayNumber: number): DayTask[] {
  const taskTemplates = [
    { title: "学习新知识（视频/阅读）", desc: "理解核心概念和原理", mins: 30, pri: "high" as const, diff: "medium" as const, tag: "学习" },
    { title: "动手练习实践", desc: "跟随教程完成练习任务", mins: 25, pri: "high" as const, diff: "medium" as const, tag: "练习" },
    { title: "间隔复习", desc: "根据记忆曲线复习之前内容", mins: 15, pri: "medium" as const, diff: "easy" as const, tag: "复习" },
    { title: "完成练习题", desc: "巩固今日所学知识", mins: 20, pri: "medium" as const, diff: "hard" as const, tag: "练习" },
    { title: "输出学习笔记/总结", desc: "用费曼学习法输出今日所学", mins: 10, pri: "low" as const, diff: "easy" as const, tag: "输出" },
  ]

  // 根据天数变化任务组合
  const tasks: DayTask[] = []
  const numTasks = 3 + (dayNumber % 3)

  for (let i = 0; i < numTasks; i++) {
    const template = taskTemplates[(dayNumber + i) % taskTemplates.length]
    tasks.push({
      id: `task-${dayNumber}-${i + 1}`,
      title: template.title,
      description: template.desc,
      durationMinutes: template.mins + (i * 5),
      priority: template.pri,
      difficulty: template.diff,
      completed: false,
      tags: [template.tag],
      theoryBasis: i === 0 ? ["晨间优势", "深度工作"][dayNumber % 2] : undefined,
    })
  }
  return tasks
}
