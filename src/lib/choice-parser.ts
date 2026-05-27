/** Detect a marker line (4+ consecutive em dashes, hyphens, or similar) */
const MARKER_RE = /^[—\-—―─一]{4,}$/

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

/** Extract choice options from message content.
 *  Only extracts choices inside —————— … —————— marker blocks.
 *  Returns the choices array and the text content WITHOUT the marker blocks. */
export function extractChoices(content: string): {
  choices: ChoiceOption[]
  textWithoutChoices: string
} | null {
  const lines = content.split("\n")
  const textLines: string[] = []
  const allChoices: ChoiceOption[] = []

  let inMarker = false

  for (const line of lines) {
    if (MARKER_RE.test(line.trim())) {
      inMarker = !inMarker
      continue
    }

    if (inMarker) {
      const stripped = line.replace(/^[-*]\s+/, "").trim()
      const choice = parseChoice(stripped)
      if (choice) {
        allChoices.push(choice)
        continue
      }
      // Non-choice line inside marker: treat as text
    }

    textLines.push(line)
  }

  if (allChoices.length === 0) return null

  return {
    choices: allChoices,
    textWithoutChoices: textLines.join("\n"),
  }
}
