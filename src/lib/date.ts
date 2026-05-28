/**
 * Shared date utilities — always uses local timezone (browser / user's IP region).
 * Never use toISOString().split("T")[0] for "today" calculations — it gives UTC date.
 */

/** Get today's date string in user's local timezone: YYYY-MM-DD */
export function getLocalDate(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

/** Get a date string offset by N days from today (local timezone) */
export function getLocalDateOffset(offset: number): string {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

/** Format a Date object as YYYY-MM-DD in local timezone */
export function formatLocalDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

/** Get user's IANA timezone (e.g. "Asia/Shanghai"), falls back to guessing from offset */
export function getUserTimezone(): string {
  if (typeof Intl !== "undefined") {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    if (tz) return tz
  }
  // Fallback: guess from UTC offset
  const offset = -new Date().getTimezoneOffset()
  const h = Math.floor(Math.abs(offset) / 60)
  const m = Math.abs(offset) % 60
  const sign = offset >= 0 ? "+" : "-"
  return `UTC${sign}${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
}

/** Check if two local date strings represent the same day */
export function isSameLocalDay(a: string, b: string): boolean {
  return a === b
}
