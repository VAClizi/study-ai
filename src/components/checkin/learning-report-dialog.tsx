"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { ClipboardList, Loader2, Send } from "lucide-react"
import { useT } from "@/lib/i18n"
import { cn } from "@/lib/cn"

export interface LearningReportData {
  content: string
  difficulties: string
  selfRating: string
  studyDuration: string
  tomorrowFocus: string
}

interface LearningReportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onComplete: (data: LearningReportData) => void
  planName?: string
  streakDays?: number
}

const RATING_OPTIONS = [
  { emoji: "😫", labelKey: "report.ratingHard" },
  { emoji: "😐", labelKey: "report.ratingMeh" },
  { emoji: "🙂", labelKey: "report.ratingGood" },
  { emoji: "🔥", labelKey: "report.ratingGreat" },
]

const DURATION_OPTIONS = [
  { value: "<15", labelKey: "report.durationShort" },
  { value: "15-30", labelKey: "report.durationMedium" },
  { value: "30-60", labelKey: "report.durationLong" },
  { value: ">60", labelKey: "report.durationLonger" },
]

export function LearningReportDialog({
  open,
  onOpenChange,
  onComplete,
  planName,
  streakDays,
}: LearningReportDialogProps) {
  const [loading, setLoading] = useState(false)
  const t = useT()

  const [formData, setFormData] = useState<LearningReportData>({
    content: "",
    difficulties: "",
    selfRating: "",
    studyDuration: "",
    tomorrowFocus: "",
  })

  const isValid = formData.content.trim() && formData.selfRating && formData.studyDuration

  const handleSubmit = async () => {
    if (!isValid || loading) return
    setLoading(true)
    await new Promise((r) => setTimeout(r, 600))
    onComplete(formData)
    setLoading(false)
    onOpenChange(false)
    setFormData({
      content: "",
      difficulties: "",
      selfRating: "",
      studyDuration: "",
      tomorrowFocus: "",
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white dark:bg-[#12121a] border-black/[0.06] dark:border-white/[0.06] text-zinc-900 dark:text-white max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-purple-600/20 flex items-center justify-center">
              <ClipboardList className="h-4 w-4 text-purple-500 dark:text-purple-400" />
            </div>
            <span className="text-sm text-purple-500 dark:text-purple-400">{t("report.aiCoachFeedback")}</span>
          </div>
          <DialogTitle className="text-lg">{t("report.title")}</DialogTitle>
          <DialogDescription className="text-zinc-400 dark:text-zinc-500">
            {t("report.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Field 1: What did you learn today */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-900 dark:text-white">
              {t("report.learnedContent")} <span className="text-red-400">*</span>
            </label>
            <Textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder={t("report.learnedContentPlaceholder")}
              rows={3}
              className="bg-black/[0.03] dark:bg-white/[0.03] border-black/[0.06] dark:border-white/[0.06] text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 resize-none"
            />
          </div>

          {/* Field 2: Difficulties encountered */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-900 dark:text-white">
              {t("report.difficulties")}
            </label>
            <Textarea
              value={formData.difficulties}
              onChange={(e) => setFormData({ ...formData, difficulties: e.target.value })}
              placeholder={t("report.difficultiesPlaceholder")}
              rows={2}
              className="bg-black/[0.03] dark:bg-white/[0.03] border-black/[0.06] dark:border-white/[0.06] text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 resize-none"
            />
          </div>

          {/* Field 3: Self-rating */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-900 dark:text-white">
              {t("report.selfRating")} <span className="text-red-400">*</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {RATING_OPTIONS.map((opt) => (
                <button
                  key={opt.labelKey}
                  type="button"
                  onClick={() => setFormData({ ...formData, selfRating: opt.labelKey })}
                  className={cn(
                    "flex flex-col items-center gap-1 py-3 rounded-xl border transition-all",
                    formData.selfRating === opt.labelKey
                      ? "border-purple-500 bg-purple-50 dark:bg-purple-500/15 shadow-sm"
                      : "border-black/[0.06] dark:border-white/[0.06] hover:border-purple-300 dark:hover:border-purple-500/30"
                  )}
                >
                  <span className="text-2xl">{opt.emoji}</span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">{t(opt.labelKey)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Field 4: Study duration */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-900 dark:text-white">
              {t("report.studyDuration")} <span className="text-red-400">*</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {DURATION_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, studyDuration: opt.value })}
                  className={cn(
                    "py-2.5 rounded-xl border text-xs font-medium transition-all",
                    formData.studyDuration === opt.value
                      ? "border-purple-500 bg-purple-50 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300 shadow-sm"
                      : "border-black/[0.06] dark:border-white/[0.06] text-zinc-500 dark:text-zinc-400 hover:border-purple-300 dark:hover:border-purple-500/30"
                  )}
                >
                  {t(opt.labelKey)}
                </button>
              ))}
            </div>
          </div>

          {/* Field 5: Tomorrow focus */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-900 dark:text-white">
              {t("report.tomorrowFocus")}
            </label>
            <Input
              value={formData.tomorrowFocus}
              onChange={(e) => setFormData({ ...formData, tomorrowFocus: e.target.value })}
              placeholder={t("report.tomorrowFocusPlaceholder")}
              className="bg-black/[0.03] dark:bg-white/[0.03] border-black/[0.06] dark:border-white/[0.06] text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 h-10"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={handleSubmit}
            disabled={!isValid || loading}
            className="w-full bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white gap-2 shadow-lg shadow-purple-600/25"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("report.submitting")}
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                {t("report.submit")}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
