"use client"

import { useT } from "@/lib/i18n"
import type { LearningResource } from "@/types/plan"
import { FileText, Video, Code, BookOpen, Globe, ExternalLink } from "lucide-react"

interface LearningResourcesProps {
  resources: LearningResource[]
  dayNumber: number
}

const typeIcon: Record<string, React.ReactNode> = {
  paper: <FileText className="h-3.5 w-3.5" />,
  video: <Video className="h-3.5 w-3.5" />,
  code: <Code className="h-3.5 w-3.5" />,
  article: <Globe className="h-3.5 w-3.5" />,
  book: <BookOpen className="h-3.5 w-3.5" />,
}

const typeLabelKey: Record<string, string> = {
  paper: "resource.paper",
  video: "resource.video",
  code: "resource.code",
  article: "resource.article",
  book: "resource.book",
}

export function LearningResources({ resources, dayNumber }: LearningResourcesProps) {
  const t = useT()
  const grouped = resources.reduce<Record<string, LearningResource[]>>((acc, r) => {
    ;(acc[r.type] ??= []).push(r)
    return acc
  }, {})

  if (resources.length === 0) {
    return (
      <div className="w-[230px] flex-shrink-0 rounded-xl border border-black/[0.06] dark:border-white/[0.05] p-4 text-center">
        <p className="text-xs text-zinc-500">{t("resource.noResources")}</p>
      </div>
    )
  }

  return (
    <div className="w-[230px] flex-shrink-0 sticky top-16 rounded-xl border border-yellow-500/[0.08] bg-yellow-500/[0.02] p-4 max-h-[calc(100vh-6rem)] overflow-y-auto">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-sm">📚</span>
        <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Day {dayNumber} {t("resource.title")}</span>
      </div>

      {Object.entries(grouped).map(([type, items]) => (
        <div key={type} className="mt-3">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold text-zinc-500 uppercase mb-1.5">
            {typeIcon[type]}
            {t(typeLabelKey[type] || type)}
          </div>
          <div className="space-y-1">
            {items.map((r) => (
              <a
                key={r.id}
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-2 rounded-lg border border-black/[0.06] dark:border-white/[0.04] bg-black/[0.02] dark:bg-white/[0.02] hover:bg-black/[0.05] dark:hover:bg-white/[0.05] transition-colors group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="text-[11px] text-zinc-700 dark:text-zinc-300 group-hover:text-black dark:group-hover:text-white leading-snug">
                    {r.title}
                  </div>
                  <ExternalLink className="h-3 w-3 text-zinc-600 flex-shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="text-[9px] text-zinc-600 mt-1">{r.source}</div>
              </a>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
