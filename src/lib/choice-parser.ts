/** Check if text matches A/B/C/D or 1/2/3 choice pattern and parse it */
export function parseChoice(text: string): { label: string; text: string } | null {
  const cleaned = text.replace(/\*\*/g, "").trim()
  const match = cleaned.match(/^([A-Da-d]|\d)[\.\)、:\s：]\s*(.+)$/)
  if (match && match[2] && match[2].length > 0) {
    const label = /[A-Da-d]/.test(match[1]) ? match[1].toUpperCase() : match[1]
    return { label, text: match[2] }
  }
  return null
}

export interface ChoiceOption {
  label: string
  text: string
}

/** Strip markdown emphasis markers so question-mark detection isn't fooled by **bold** or *italic* */
function stripMarkdownEmphasis(text: string): string {
  return text.replace(/\*{1,3}/g, "").replace(/_{1,3}/g, "").trim()
}

/** Check if a line looks like a question or choice prompt.
 *  Matches lines ending with ？/? or containing invitation keywords. */
function isPromptLine(line: string): boolean {
  const trimmed = line.trim()
  if (!trimmed) return false
  const stripped = stripMarkdownEmphasis(trimmed)
  if (!stripped) return false
  // Question mark ending
  if (/[？?]$/.test(stripped)) return true
  // Explicit invitation language
  if (/请选择|请回答|请告诉|选一个|作出选择|你的选择|哪个选项|你的答案是|请挑选|choose|select|pick one|which (one|option)/i.test(stripped)) return true
  return false
}

/** Check if a line contains a question or choice prompt anywhere. */
function isPromptLike(line: string): boolean {
  const trimmed = line.trim()
  if (!trimmed) return false
  const stripped = stripMarkdownEmphasis(trimmed)
  if (!stripped) return false
  if (/[？?]/.test(stripped)) return true
  if (/请选择|请回答|请告诉|选一个|作出选择|你的选择|哪个选项|你的答案是|请挑选|choose|select|pick one|which (one|option)/i.test(stripped)) return true
  return false
}

/** Parse inline choices: "问题？ A. xxx B. xxx C. xxx D. xxx" on one line */
function parseInlineChoices(line: string): { choices: ChoiceOption[] } | null {
  const trimmed = line.trim()
  // Find where choices start — first A./B./C./D. marker
  const choiceStart = trimmed.search(/(?:^|\s)[A-Da-d][\.\)、:\s：]/)
  if (choiceStart === -1) return null

  const choicePart = trimmed.substring(choiceStart).trim()
  // Split by A./B./C./D. markers that appear mid-string
  const parts = choicePart.split(/\s+(?=[A-Da-d][\.\)、:\s：]\s)/)
  const choices: ChoiceOption[] = []
  for (const part of parts) {
    const c = parseChoice(part.trim())
    if (c) choices.push(c)
  }
  return choices.length >= 2 ? { choices } : null
}

/** Check if the content looks like a generated plan. */
function looksLikePlan(content: string): boolean {
  const planIndicators = [
    /\[PLAN_DATA\]/,
    /第[一二三四五六七八九十\d]+阶段/,
    /第[一二三四五六七八九十\d]+周/,
    /每日学习任务/,
    /学习计划/,
    /阶段目标/,
    /周目标/,
    /你是我的专属AI/,
    /认知科学理论依据/,
  ]
  const matchCount = planIndicators.filter((p) => p.test(content)).length
  return matchCount >= 2
}

/** Extract choice options from message content.
 *
 *  Detection order:
 *  1. [CHOICES] … [/CHOICES] markers (explicit format)
 *  2. —————— … —————— markers (legacy format)
 *  3. Smart detection: a prompt line (？/? or invitation keywords)
 *     followed within 0-3 lines by 2+ consecutive choice-pattern lines,
 *     provided the content does NOT look like a generated plan. */
export function extractChoices(content: string): {
  choices: ChoiceOption[]
  textWithoutChoices: string
} | null {
  if (!content) return null

  // Phase 1: [CHOICES] … [/CHOICES] markers
  const openIdx = content.indexOf("[CHOICES]")
  const closeIdx = content.indexOf("[/CHOICES]")

  if (openIdx !== -1 && closeIdx > openIdx) {
    const blockContent = content.slice(openIdx + 9, closeIdx)
    const choices = extractFromBlock(blockContent)
    if (choices.length >= 2) {
      const before = content.slice(0, openIdx)
      const after = content.slice(closeIdx + 10)
      return { choices, textWithoutChoices: (before + after).trim() }
    }
  }

  // Phase 2: legacy —————— markers
  const MARKER_RE = /^[—\-—―─一]{4,}$/
  const lines = content.split("\n")
  const textLines: string[] = []
  const dashChoices: ChoiceOption[] = []
  let inDash = false

  for (const line of lines) {
    if (MARKER_RE.test(line.trim())) {
      inDash = !inDash
      continue
    }
    if (inDash) {
      const stripped = line.replace(/^[-*]+\s*/, "").trim()
      const choice = parseChoice(stripped)
      if (choice) {
        dashChoices.push(choice)
        continue
      }
    }
    textLines.push(line)
  }

  if (dashChoices.length >= 2) {
    return { choices: dashChoices, textWithoutChoices: textLines.join("\n") }
  }

  // Phase 3: inline choices — all on one line like "问题？ A. xxx B. xxx C. xxx"
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (!isPromptLike(line)) continue
    const inline = parseInlineChoices(line)
    if (inline && inline.choices.length >= 2) {
      const resultLines = [...lines]
      resultLines.splice(i, 1)
      return { choices: inline.choices, textWithoutChoices: resultLines.join("\n") }
    }
  }

  // Phase 4: smart detection — prompt line followed by choice block
  if (looksLikePlan(content)) return null

  for (let i = 0; i < lines.length; i++) {
    if (!isPromptLine(lines[i])) continue

    // Check the next 0-3 lines for choices (multi-line or inline)
    for (let j = i + 1; j <= Math.min(i + 4, lines.length - 1); j++) {
      const raw = lines[j].replace(/^[-*]+\s*/, "").trim()
      if (!raw) continue

      // Try inline first (handles "A. xxx B. xxx C. xxx" on one line)
      const inline = parseInlineChoices(raw)
      if (inline && inline.choices.length >= 2) {
        const resultLines = [...lines]
        resultLines.splice(j, 1)
        return { choices: inline.choices, textWithoutChoices: resultLines.join("\n") }
      }

      // Try multi-line: collect consecutive choice lines
      const first = parseChoice(raw)
      if (!first) {
        // Line doesn't look like a choice — stop looking
        if (raw.length > 20) break
        continue
      }

      const block: ChoiceOption[] = [first]
      let k = j + 1
      while (k < lines.length) {
        const s = lines[k].replace(/^[-*]+\s*/, "").trim()
        const choice = parseChoice(s)
        if (choice) {
          block.push(choice)
          k++
        } else if (!s) {
          break
        } else {
          break
        }
      }

      if (block.length >= 2) {
        const resultLines = [...lines]
        resultLines.splice(j, block.length)
        return { choices: block, textWithoutChoices: resultLines.join("\n") }
      }

      // If we found 1 choice but not 2+, stop scanning this prompt
      if (block.length === 1) break
    }
  }

  return null
}

/** Extract choices from inside a marker block (handles [CHOICES] content) */
function extractFromBlock(blockContent: string): ChoiceOption[] {
  const choices: ChoiceOption[] = []
  for (const line of blockContent.split("\n")) {
    const trimmed = line.trim()
    if (!trimmed) continue
    const stripped = trimmed.replace(/^[-*]+\s*/, "")
    const choice = parseChoice(stripped)
    if (choice) choices.push(choice)
  }
  return choices
}
