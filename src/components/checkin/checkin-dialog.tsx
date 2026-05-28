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
import { Slider } from "@/components/ui/slider"
import { Brain, Loader2, Star } from "lucide-react"
import { useT } from "@/lib/i18n"

interface CheckinDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onComplete: (data: CheckinFormData) => void
}

export interface CheckinFormData {
  stuckPoints: string
  difficulties: string
  summary: string
  focusScore: number
  needAdjustment: boolean
  tomorrowGoal: string
}

export function CheckinDialog({ open, onOpenChange, onComplete }: CheckinDialogProps) {
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const t = useT()

  const questions = [
    { key: "summary", question: t("checkin.summary") },
    { key: "stuckPoints", question: t("checkin.stuckPoints") },
    { key: "difficulties", question: t("checkin.difficulties") },
    { key: "tomorrowGoal", question: t("checkin.tomorrowGoal") },
  ]
  const [formData, setFormData] = useState<CheckinFormData>({
    stuckPoints: "",
    difficulties: "",
    summary: "",
    focusScore: 7,
    needAdjustment: false,
    tomorrowGoal: "",
  })

  const currentQ = questions[step]

  const handleNext = () => {
    if (step < questions.length - 1) {
      setStep(step + 1)
    } else {
      handleComplete()
    }
  }

  const handleComplete = async () => {
    setLoading(true)
    await new Promise(r => setTimeout(r, 1000))
    onComplete(formData)
    setLoading(false)
    onOpenChange(false)
    setStep(0)
    setFormData({
      stuckPoints: "",
      difficulties: "",
      summary: "",
      focusScore: 7,
      needAdjustment: false,
      tomorrowGoal: "",
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white dark:bg-[#12121a] border-black/[0.06] dark:border-white/[0.06] text-zinc-900 dark:text-white max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-purple-600/20 flex items-center justify-center">
              <Brain className="h-4 w-4 text-purple-500 dark:text-purple-400" />
            </div>
            <span className="text-sm text-purple-500 dark:text-purple-400">{t("checkin.aiReview")}</span>
          </div>
          <DialogTitle className="text-lg">
            {t("checkin.dailyReview")}
          </DialogTitle>
          <DialogDescription className="text-zinc-400 dark:text-zinc-500">
            {step + 1} / {questions.length + 1} · {t("checkin.helpingAI")}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {/* Focus Score (always last step) */}
          {step === questions.length ? (
            <div className="space-y-4">
              <p className="text-sm text-zinc-900 dark:text-white">{t("checkin.focusQuestion")}（1-10）</p>
              <div className="flex items-center gap-4">
                <Slider
                  value={formData.focusScore}
                  onValueChange={(v) => setFormData({ ...formData, focusScore: v as number })}
                  min={1}
                  max={10}
                  step={1}
                  className="flex-1"
                />
                <span className="text-2xl font-bold text-purple-500 dark:text-purple-400 w-8 text-center">
                  {formData.focusScore}
                </span>
              </div>
              <div className="flex justify-between text-xs text-zinc-400 dark:text-zinc-600">
                <span>{t("checkin.cannotFocus")}</span>
                <span>{t("checkin.optimalState")}</span>
              </div>

              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-black/[0.04] dark:border-white/[0.04]">
                <input
                  type="checkbox"
                  id="needAdjustment"
                  checked={formData.needAdjustment}
                  onChange={(e) => setFormData({ ...formData, needAdjustment: e.target.checked })}
                  className="rounded border-white/20 bg-white/5"
                />
                <label htmlFor="needAdjustment" className="text-sm text-zinc-500 dark:text-zinc-400">
                  {t("checkin.adjustPlan")}
                </label>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <label className="text-sm text-zinc-900 dark:text-white">{currentQ.question}</label>
              <Textarea
                value={formData[currentQ.key as keyof CheckinFormData] as string}
                onChange={(e) => setFormData({ ...formData, [currentQ.key]: e.target.value })}
                placeholder={t("checkin.enterAnswer")}
                rows={3}
                className="bg-black/[0.03] dark:bg-white/[0.03] border-black/[0.06] dark:border-white/[0.06] text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 resize-none"
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <div className="flex items-center justify-between w-full">
            <span className="text-xs text-zinc-400 dark:text-zinc-600">
              {step + 1} / {questions.length + 1}
            </span>
            <Button
              onClick={handleNext}
              disabled={loading}
              className="bg-purple-600 hover:bg-purple-700 text-white gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("checkin.generating")}
                </>
              ) : step < questions.length ? (
                t("checkin.next")
              ) : (
                t("checkin.complete")
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
