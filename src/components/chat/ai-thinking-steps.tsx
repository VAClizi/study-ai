"use client"

import { Brain, Loader2 } from "lucide-react"

interface AIThinkingStepsProps {
  isThinking: boolean
}

export function AIThinkingSteps({ isThinking }: AIThinkingStepsProps) {
  if (!isThinking) return null

  return (
    <div className="flex justify-start px-4 py-2 animate-fade-in-up">
      <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-purple-600/[0.04] dark:bg-purple-500/[0.06] border border-purple-500/10 dark:border-purple-500/15">
        <Brain className="h-4 w-4 text-purple-500 dark:text-purple-400" />
        <span className="text-sm text-purple-600 dark:text-purple-400">AI 正在思考中...</span>
        <Loader2 className="h-3.5 w-3.5 text-purple-500/60 animate-spin" />
      </div>
    </div>
  )
}
