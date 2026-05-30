/**
 * 学习资料校验工具
 *
 * 规则：所有给到用户的学习资料（resources）在展示/保存前，
 * 必须经过可用性和合理性检查。
 */

// --- 合理性：标题黑名单（AI 生成的占位/通用标题） ---

const GENERIC_TITLE_PATTERNS = [
  /^学习资料$/,
  /^参考资料$/,
  /^相关资源$/,
  /^推荐资源$/,
  /^更多资源$/,
  /^补充材料$/,
  /^扩展阅读$/,
  /^学习资源\d*$/,
  /^resource(s)?\d*$/i,
  /^参考链接$/,
  /^相关链接$/,
  /^点击查看$/,
  /^了解更多$/,
  /^详细内容$/,
  /^TBD$/i,
  /^TODO$/i,
  /^待定$/,
  /^未命名$/,
  /^无$/,
  /^暂无$/,
  /^暂无资源$/,
]

// --- 合理性：来源平台名黑名单 ---

const GENERIC_SOURCE_PATTERNS = [
  /^未知$/,
  /^其他$/,
  /^无$/,
  /^暂无$/,
  /^unknown$/i,
  /^other$/i,
  /^N\/A$/i,
  /^TBD$/i,
]

// --- 合理性：URL 黑名单 ---

const BLOCKED_URL_PATTERNS = [
  /^https?:\/\/example\.com/i,
  /^https?:\/\/localhost/i,
  /^https?:\/\/127\.0\.0\.1/i,
  /^https?:\/\/\.\.\.$/,
  /^https?:\/\/\s*$/,
  /^https?:\/\/xxx/i,
  /^https?:\/\/test\.com/i,
  /^https?:\/\/placeholder/i,
  /^https?:\/\/sample/i,
  /^https?:\/\/fake/i,
]

// --- URL 格式校验 ---

function isValidUrlFormat(url: string): boolean {
  if (!url || typeof url !== "string") return false
  const trimmed = url.trim()
  if (!trimmed) return false

  try {
    const parsed = new URL(trimmed)
    // 只允许 http/https 协议
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false
    // 必须有有效的 hostname（至少包含一个点或为 localhost）
    if (!parsed.hostname || parsed.hostname.length < 4) return false
    return true
  } catch {
    return false
  }
}

// --- 标题合理性校验 ---

function isReasonableTitle(title: string): boolean {
  if (!title || typeof title !== "string") return false
  const trimmed = title.trim()
  if (trimmed.length < 2) return false
  if (trimmed.length > 200) return false

  for (const pattern of GENERIC_TITLE_PATTERNS) {
    if (pattern.test(trimmed)) return false
  }

  return true
}

// --- 来源合理性校验 ---

function isReasonableSource(source: string): boolean {
  if (!source || typeof source !== "string") return true // source 允许为空
  const trimmed = source.trim()
  if (!trimmed) return true

  for (const pattern of GENERIC_SOURCE_PATTERNS) {
    if (pattern.test(trimmed)) return false
  }

  return true
}

// --- URL 可用性校验（格式 + 黑名单，不发起网络请求） ---

function isAvailableUrl(url: string): boolean {
  if (!url || typeof url !== "string") return false
  const trimmed = url.trim()
  if (!trimmed) return false

  if (!isValidUrlFormat(trimmed)) return false

  for (const pattern of BLOCKED_URL_PATTERNS) {
    if (pattern.test(trimmed)) return false
  }

  return true
}

// --- 对外接口 ---

export interface ResourceInput {
  title: string
  url: string
  type: string
  source: string
}

export interface ValidationResult {
  valid: boolean
  reason?: string
}

/** 被丢弃的资源信息 */
export interface DroppedResource<T extends ResourceInput = ResourceInput> {
  resource: T
  reason: string
}

/**
 * 校验单条学习资料的可用性和合理性。
 * 返回通过/不通过及原因。
 */
export function validateResource(r: ResourceInput): ValidationResult {
  // 1. 可用性：URL 必须是可访问的 http/https 链接
  if (!r.url || !isAvailableUrl(r.url)) {
    return { valid: false, reason: `URL 不可用: "${r.url}"` }
  }

  // 2. 合理性：标题不能是占位/通用文字
  if (!isReasonableTitle(r.title)) {
    return { valid: false, reason: `标题不合理: "${r.title}"` }
  }

  // 3. 合理性：来源不能是占位文字
  if (!isReasonableSource(r.source)) {
    return { valid: false, reason: `来源不合理: "${r.source}"` }
  }

  return { valid: true }
}

/**
 * 过滤并返回有效的资源列表。
 * 无效资源会被静默丢弃，同时在 console 输出警告便于调试。
 * 泛型 T 允许保留调用方的扩展字段（如 legacy 格式的 week 字段）。
 */
export function filterValidResources<T extends ResourceInput>(resources: T[]): T[] {
  return filterValidResourcesWithReport(resources).valid
}

/**
 * 过滤有效资源，同时返回被丢弃的资源及原因。
 * 用于需要了解丢弃详情并触发补生成的场景。
 */
export function filterValidResourcesWithReport<T extends ResourceInput>(
  resources: T[]
): { valid: T[]; dropped: DroppedResource<T>[] } {
  if (!Array.isArray(resources)) return { valid: [], dropped: [] }

  const valid: T[] = []
  const dropped: DroppedResource<T>[] = []
  for (const r of resources) {
    const result = validateResource(r)
    if (result.valid) {
      valid.push(r)
    } else {
      console.warn(`[resource-validator] 丢弃无效资料: ${result.reason}`, r)
      dropped.push({ resource: r, reason: result.reason! })
    }
  }
  return { valid, dropped }
}

/**
 * 检查资源列表是否全部有效（用于快速判断）。
 */
export function hasInvalidResources<T extends ResourceInput>(resources: T[]): boolean {
  if (!Array.isArray(resources)) return false
  return resources.some((r) => !validateResource(r).valid)
}
