"use client"

import { useMemo, useState } from "react"
import { cn } from "@/lib/cn"
import { ChevronDown, ChevronUp, Target, Calendar, Lightbulb, BookOpen, Clock, GripVertical } from "lucide-react"
import ReactMarkdown from "react-markdown"

interface PlanSectionProps {
  content: string
}

interface PlanSegment {
  heading: string
  body: string
  level: "##" | "###"
}

/** Parse plan markdown into segments by ## and ### headings */
function parsePlanSegments(md: string): PlanSegment[] {
  const segments: PlanSegment[] = []
  const lines = md.split("\n")
  let currentHeading = ""
  let currentBody: string[] = []
  let currentLevel: "##" | "###" = "##"

  for (const line of lines) {
    const h2 = line.match(/^## (.+)/)
    const h3 = line.match(/^### (.+)/)
    if (h2 || h3) {
      if (currentBody.length > 0 || currentHeading) {
        segments.push({
          heading: currentHeading,
          body: currentBody.join("\n").trim(),
          level: currentLevel,
        })
      }
      currentHeading = h2 ? h2[1] : h3![1]
      currentBody = []
      currentLevel = h2 ? "##" : "###"
    } else if (currentHeading) {
      currentBody.push(line)
    }
  }

  if (currentHeading && currentBody.length > 0) {
    segments.push({
      heading: currentHeading,
      body: currentBody.join("\n").trim(),
      level: currentLevel,
    })
  }

  return segments
}

/** Extract table rows from markdown table body */
function parseTable(body: string): { headers: string[]; rows: string[][] } | null {
  const lines = body.trim().split("\n")
  if (lines.length < 2) return null
  if (!lines[0].includes("|") || !lines[1].includes("---")) return null

  const headers = lines[0]
    .split("|")
    .map((h) => h.trim())
    .filter(Boolean)

  const rows = lines
    .slice(2)
    .filter((l) => l.includes("|"))
    .map((l) =>
      l
        .split("|")
        .map((c) => c.trim())
        .filter(Boolean)
    )

  return { headers, rows }
}

export function PlanSection({ content }: PlanSectionProps) {
  const [collapsed, setCollapsed] = useState(false)

  const segments = useMemo(() => parsePlanSegments(content), [content])

  if (!content || segments.length === 0) return null

  return (
    <div className="border-b border-purple-200/60 dark:border-purple-500/15 bg-gradient-to-b from-purple-50/80 to-white/60 dark:from-purple-950/20 dark:to-zinc-900/60 backdrop-blur-xl">
      {/* Header bar */}
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-purple-100/30 dark:hover:bg-purple-500/5 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-purple-600/15 dark:bg-purple-500/20 flex items-center justify-center">
            <Target className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
          </div>
          <span className="text-sm font-semibold text-purple-700 dark:text-purple-300">
            学习计划
          </span>
          <span className="text-xs text-zinc-400 dark:text-zinc-500">
            {segments.length} 个模块
          </span>
        </div>
        <div className="flex items-center gap-1 text-zinc-400 dark:text-zinc-500">
          {collapsed ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronUp className="h-4 w-4" />
          )}
        </div>
      </button>

      {/* Plan content */}
      {!collapsed && (
        <div className="px-4 pb-4 space-y-3 max-h-[50vh] overflow-y-auto">
          {segments.map((seg, i) => (
            <PlanSegmentCard key={i} segment={seg} />
          ))}
        </div>
      )}
    </div>
  )
}

function PlanSegmentCard({ segment }: { segment: PlanSegment }) {
  const isH2 = segment.level === "##"
  const table = parseTable(segment.body)

  // Choose icon based on heading keywords
  const icon = (() => {
    const h = segment.heading
    if (h.includes("概述") || h.includes("概览")) return <Target className="h-3.5 w-3.5" />
    if (h.includes("阶段") || h.includes("规划")) return <GripVertical className="h-3.5 w-3.5" />
    if (h.includes("周") || h.includes("Day") || h.includes("天") || h.includes("计划")) return <Calendar className="h-3.5 w-3.5" />
    if (h.includes("理论") || h.includes("依据")) return <BookOpen className="h-3.5 w-3.5" />
    if (h.includes("建议") || h.includes("给")) return <Lightbulb className="h-3.5 w-3.5" />
    return <Clock className="h-3.5 w-3.5" />
  })()

  return (
    <div
      className={cn(
        "rounded-xl border p-3.5 transition-colors",
        isH2
          ? "border-purple-200/60 dark:border-purple-500/15 bg-white/70 dark:bg-zinc-800/50 shadow-sm"
          : "border-black/[0.04] dark:border-white/[0.04] bg-black/[0.01] dark:bg-white/[0.02] ml-4"
      )}
    >
      {/* Heading */}
      <div className="flex items-center gap-2 mb-2">
        <div className={cn(
          "w-5 h-5 rounded flex items-center justify-center shrink-0",
          isH2 ? "bg-purple-600/10 dark:bg-purple-500/15" : "bg-zinc-100 dark:bg-zinc-700"
        )}>
          <span className={isH2 ? "text-purple-600 dark:text-purple-400" : "text-zinc-500 dark:text-zinc-400"}>
            {icon}
          </span>
        </div>
        <h4 className={cn(
          "text-sm font-semibold",
          isH2 ? "text-purple-700 dark:text-purple-300" : "text-zinc-700 dark:text-zinc-300"
        )}>
          {segment.heading}
        </h4>
      </div>

      {/* Body: table or markdown */}
      {table ? (
        <div className="overflow-x-auto rounded-lg border border-black/[0.06] dark:border-white/[0.06]">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-black/[0.02] dark:bg-white/[0.03]">
                {table.headers.map((h, i) => (
                  <th
                    key={i}
                    className="px-2.5 py-2 text-left font-medium text-zinc-500 dark:text-zinc-400 border-b border-black/[0.04] dark:border-white/[0.04]"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.rows.map((row, ri) => (
                <tr
                  key={ri}
                  className="border-b border-black/[0.02] dark:border-white/[0.02] last:border-0 hover:bg-black/[0.01] dark:hover:bg-white/[0.02] transition-colors"
                >
                  {row.map((cell, ci) => (
                    <td
                      key={ci}
                      className={cn(
                        "px-2.5 py-2 text-zinc-600 dark:text-zinc-300",
                        ci === 0 && "text-zinc-500 dark:text-zinc-400 font-medium"
                      )}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="prose prose-xs dark:prose-invert max-w-none prose-headings:text-zinc-800 dark:prose-headings:text-zinc-200 prose-p:text-zinc-600 dark:prose-p:text-zinc-300 prose-li:text-zinc-600 dark:prose-li:text-zinc-300 prose-strong:text-zinc-700 dark:prose-strong:text-zinc-200">
          <ReactMarkdown>{segment.body}</ReactMarkdown>
        </div>
      )}
    </div>
  )
}
