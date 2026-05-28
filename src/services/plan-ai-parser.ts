import { chat } from "./llm"

export interface ParsedDayResource {
  title: string
  url: string
  type: string
  source: string
}

export interface ParsedDayTask {
  title: string
  description: string
  duration: number
  priority: string
}

export interface ParsedDay {
  day: number
  tasks: ParsedDayTask[]
  resources?: ParsedDayResource[]
}

export interface ParsedWeekDetail {
  week: number
  name: string
  days: ParsedDay[]
}

export interface ParsedStage {
  stage: number
  name: string
  weeks: number
  weeks_detail: ParsedWeekDetail[]
}

export interface ParsedPlanResult {
  title: string
  total_days: number
  stages: ParsedStage[]
  theories?: {
    name: string
    description: string
    application: string
    icon: string
  }[]
}

const PARSE_SYSTEM_PROMPT = `你是一个学习计划数据提取器。你的任务是将给定的学习计划文本转换为结构化 JSON。

**输出格式（严格按此 JSON Schema）：**

{
  "title": "计划标题",
  "total_days": 56,
  "stages": [
    {
      "stage": 1,
      "name": "阶段名称",
      "weeks": 2,
      "weeks_detail": [
        {
          "week": 1,
          "name": "本周主题名称",
          "days": [
            {
              "day": 1,
              "tasks": [
                {
                  "title": "具体任务名称",
                  "description": "任务详细描述",
                  "duration": 25,
                  "priority": "高优先"
                }
              ],
              "resources": [
                {
                  "title": "当天学习资料标题",
                  "url": "https://...",
                  "type": "article",
                  "source": "来源平台"
                }
              ]
            }
        }
      ]
    }
  ],
  "theories": [
    {
      "name": "理论名称",
      "description": "理论一句话描述",
      "application": "在本计划中的应用",
      "icon": "brain"
    }
  ]
}

**提取规则：**

1. **title**: 从计划文本中提取标题，不要编造
2. **total_days**: 计算计划总共包含多少天
3. **stages**: 从文本中识别"阶段"或"Phase"，每个阶段包含 stage 编号、name、weeks（持续周数）
4. **weeks_detail**: 每个周包含 week 编号、name（本周主题）、days（该周每天的具体任务）
5. **days**: 每周必须有 7 天，day 从 1 开始递增（跨周连续编号）
6. **tasks**: 每天 3-5 个具体任务，title 和 description 必须从计划文本中提取或合理推断，**禁止使用通用占位文字**（如"学习新知识"）
7. **duration**: 任务时长以分钟为单位，合理估算
8. **priority**: "高优先" / "中优先" / "低优先"
9. **resources（天级别）**: 为每天提取该天特定的学习资料（不是整周共享的），根据当天学习主题推荐合适资料。type 为 "paper"/"video"/"code"/"article"/"book"，source 为来源平台名称。每天 1-3 个资料，没有则留空数组
10. **theories**: 识别计划中涉及的学习理论（如番茄工作法、间隔重复、刻意练习等），icon 从 "brain","focus","timer","zap","layers","sunrise","repeat","book" 中选择

**关键要求：**
- 所有字段必须基于计划文本内容，不要编造
- JSON 必须合法可解析
- 只输出 JSON，不要输出任何其他文字、解释或 markdown 代码围栏
- 如果文本中某信息缺失，根据上下文合理推断，但不要留空字符串
- **resources 必须放在每天的 day 对象内部，不要放在 week 对象上**（week 上的 resources 会被忽略），每天的资料根据当天学习主题变化`

/**
 * Call AI to parse plan text into structured JSON.
 * Returns the parsed plan data or null on failure.
 */
export async function parsePlanTextWithAI(planText: string): Promise<ParsedPlanResult | null> {
  try {
    // Truncate to key content (first 6000 chars + last 500 chars for summary)
    const truncated = planText.length > 7000
      ? planText.slice(0, 6000) + "\n...(truncated)...\n" + planText.slice(-500)
      : planText

    const response = await chat(
      [
        { role: "system", content: PARSE_SYSTEM_PROMPT },
        { role: "user", content: `Convert the following learning plan text into structured JSON as specified:\n\n${truncated}` },
      ],
      { model: "mimo-v2-flash", temperature: 0.1, maxTokens: 4096 },
    )

    let jsonText = response.trim()

    // Strip markdown code fences
    jsonText = jsonText.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "")

    // If the response has text before/after JSON, try to extract just the JSON object
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      jsonText = jsonMatch[0]
    }

    // Remove trailing commas before closing braces/brackets (common AI mistake)
    jsonText = jsonText.replace(/,(\s*[}\]])/g, "$1")

    const parsed = JSON.parse(jsonText)

    // Basic validation
    if (!parsed.title || !Array.isArray(parsed.stages) || parsed.stages.length === 0) {
      console.error("AI parsed plan missing required fields:", Object.keys(parsed))
      return null
    }

    return parsed as ParsedPlanResult
  } catch (error) {
    console.error("Failed to parse plan with AI:", error)
    return null
  }
}
