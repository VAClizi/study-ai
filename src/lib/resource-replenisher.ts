/**
 * 学习资料补生成工具
 *
 * 当 AI 生成的 resources 被校验丢弃后，根据丢弃上下文调用 AI 重新生成替代资料。
 * 一次 AI 调用处理多个天的补位请求（按 contexts 顺序分批），
 * 返回按 context 顺序分组的 LearningResource[][]。
 */

import { chat } from "@/services/llm"
import { filterValidResources, type ResourceInput } from "./resource-validator"
import type { LearningResource } from "@/types/plan"

export interface ReplenishContext {
  planTitle: string
  stageName: string
  weekName: string
  dayNumber: number
  taskTitles: string[]
  droppedCount: number
}

const REPLENISH_SYSTEM_PROMPT = `你是一个学习资料推荐助手。用户在学习计划中需要补充学习资料，请根据每天的学习主题推荐真实、高质量的资料。

**要求：**
- URL 必须是真实可访问的链接（http/https），严禁 example.com、localhost 等占位地址
- 标题必须具体描述资料内容，严禁"学习资料"、"参考资料"等通用文字
- 来源必须是真实平台名称（Bilibili、知乎、Coursera、GitHub、YouTube、arXiv 等）
- type 为 "paper"/"video"/"code"/"article"/"book"
- 优先推荐中文资料（除非是经典英文教程/论文）
- 推荐资源应为公开、合法的教育内容，禁止推荐盗版资源、付费破解内容或侵权材料
- groups 数组的第 N 个元素对应用户的第 N 组请求，每个 group 内的资源数量与用户请求的数量一致`

const REPLENISH_OUTPUT_FORMAT = `{
  "groups": [
    [
      { "title": "资料具体标题", "url": "https://...", "type": "article", "source": "平台名" }
    ]
  ]
}`

/**
 * 补生成被丢弃的学习资料。
 * 一次 AI 调用处理多个天的补位请求，
 * 返回按 context 顺序分组的 LearningResource[][]。
 */
export async function replenishResources(
  contexts: ReplenishContext[]
): Promise<LearningResource[][]> {
  if (!contexts.length) return []

  const dayDescriptions = contexts.map((ctx, i) => {
    const tasks = ctx.taskTitles.map(t => `  - ${t}`).join("\n")
    return `第${i + 1}组（第${ctx.dayNumber}天）：
  阶段：${ctx.stageName}
  周主题：${ctx.weekName}
  学习任务：
${tasks}
  需要补充 ${ctx.droppedCount} 个学习资料`
  }).join("\n\n")

  const userPrompt = `计划：${contexts[0]?.planTitle ?? "学习计划"}

请为以下学习日推荐真实的学习资料。groups 数组的第 N 个元素对应用户的第 N 组请求。

${dayDescriptions}

总共需要 ${contexts.reduce((s, c) => s + c.droppedCount, 0)} 个资料。`

  try {
    const response = await chat(
      [
        { role: "system", content: REPLENISH_SYSTEM_PROMPT + "\n\n**输出格式（严格按此 JSON，只输出 JSON，不要其他文字）：**\n" + REPLENISH_OUTPUT_FORMAT },
        { role: "user", content: userPrompt },
      ],
      { model: "mimo-v2-flash", temperature: 0.3, maxTokens: 4096 },
    )

    let jsonText = response.trim()
    jsonText = jsonText.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "")

    const startBrace = jsonText.indexOf("{")
    if (startBrace === -1) {
      console.error("[resource-replenisher] 响应中未找到 JSON")
      return contexts.map(() => [])
    }
    jsonText = jsonText.slice(startBrace)

    // 提取完整 JSON 对象（brace balancing）
    let depth = 0
    let inString = false
    let escaped = false
    let endIdx = -1
    for (let i = 0; i < jsonText.length; i++) {
      const ch = jsonText[i]
      if (inString) {
        if (escaped) escaped = false
        else if (ch === "\\") escaped = true
        else if (ch === '"') inString = false
        continue
      }
      if (ch === '"') { inString = true; continue }
      if (ch === "{") depth++
      else if (ch === "}") {
        depth--
        if (depth === 0) { endIdx = i + 1; break }
      }
    }
    if (endIdx === -1) {
      console.error("[resource-replenisher] JSON 对象未闭合")
      return contexts.map(() => [])
    }
    jsonText = jsonText.slice(0, endIdx)
    jsonText = jsonText.replace(/,(\s*[}\]])/g, "$1")

    const parsed = JSON.parse(jsonText)
    const groups: ResourceInput[][] = parsed.groups ?? []

    return groups.map((group, gi) => {
      if (!Array.isArray(group)) {
        console.warn(`[resource-replenisher] 第${gi + 1}组不是数组，跳过`)
        return []
      }
      const valid = filterValidResources(group)
      return valid.map((r, vi) => ({
        id: `replenish-${Date.now()}-${gi}-${vi}`,
        title: String(r.title ?? ""),
        url: String(r.url ?? ""),
        type: (["paper", "video", "code", "article", "book"].includes(r.type) ? r.type : "article") as LearningResource["type"],
        source: String(r.source ?? ""),
      }))
    })
  } catch (error) {
    console.error("[resource-replenisher] 补生成失败:", error)
    return contexts.map(() => [])
  }
}
