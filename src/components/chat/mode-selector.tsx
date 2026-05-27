"use client"

import { useState } from "react"
import type { ChatMode } from "@/types/chat"
import { usePersonaStore, PERSONAS } from "@/stores/persona-store"
import { cn } from "@/lib/cn"
import { Zap, Microscope, ArrowRight, Sparkles, ArrowLeft } from "lucide-react"

interface ModeSelectorProps {
  onSelect: (mode: ChatMode) => void
}

const personaList = Object.values(PERSONAS)

export function ModeSelector({ onSelect }: ModeSelectorProps) {
  const [hovered, setHovered] = useState<ChatMode | null>(null)
  const [step, setStep] = useState<"persona" | "mode">("persona")
  const { persona, setPersona } = usePersonaStore()

  // ===== Step 1: Select coach persona =====
  if (step === "persona") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 animate-fade-in-up">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-600/10 border border-purple-500/20 text-purple-600 dark:text-purple-300 text-sm mb-6 backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5" />
            第一步：选择教练风格
          </div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">谁来做你的学习教练？</h2>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm">不同教练会带来完全不同的学习体验</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl mb-10">
          {personaList.map((p) => {
            const isActive = persona === p.id
            return (
              <button
                key={p.id}
                onClick={() => setPersona(p.id)}
                className={cn(
                  "relative group text-left p-5 rounded-2xl border transition-all duration-300 cursor-pointer",
                  isActive
                    ? "border-purple-500/50 bg-purple-600/[0.08] shadow-lg shadow-purple-500/10 ring-1 ring-purple-500/20"
                    : "border-black/[0.06] dark:border-white/[0.06] bg-black/[0.02] dark:bg-white/[0.02] backdrop-blur-sm hover:bg-black/[0.04] dark:hover:bg-white/[0.04] hover:border-purple-500/25"
                )}
              >
                <div className="text-3xl mb-3">{p.icon}</div>
                <h3 className="text-base font-semibold text-zinc-900 dark:text-white mb-1.5">
                  {p.name["zh-CN"]}
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  {p.description["zh-CN"]}
                </p>
                {isActive && (
                  <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-purple-600 flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </button>
            )
          })}
        </div>

        <button
          onClick={() => setStep("mode")}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium transition-all shadow-lg shadow-purple-600/25 hover:shadow-purple-600/40 active:scale-95"
        >
          下一步：选择规划模式
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    )
  }

  // ===== Step 2: Select planning mode =====
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 animate-fade-in-up">
      {/* Back button */}
      <button
        onClick={() => setStep("persona")}
        className="self-start mb-4 inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        返回选择教练
      </button>

      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-600/10 border border-purple-500/20 text-purple-600 dark:text-purple-300 text-sm mb-6 backdrop-blur-sm">
          <Sparkles className="h-3.5 w-3.5" />
          第二步：选择规划模式
        </div>
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">开始你的 AI 学习规划</h2>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm">
          当前教练：<span className="font-medium text-zinc-700 dark:text-zinc-300">{PERSONAS[persona].icon} {PERSONAS[persona].name["zh-CN"]}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-xl">
        <button
          onClick={() => onSelect("quick")}
          onMouseEnter={() => setHovered("quick")}
          onMouseLeave={() => setHovered(null)}
          className={cn(
            "relative group text-left p-6 rounded-2xl border transition-all duration-300 cursor-pointer",
            "border-black/[0.06] dark:border-white/[0.06] bg-black/[0.02] dark:bg-white/[0.02] backdrop-blur-sm",
            "hover:bg-black/[0.04] dark:hover:bg-white/[0.04] hover:border-purple-500/30",
            hovered === "detailed" && "opacity-50"
          )}
        >
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-purple-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative z-10">
            <div className="w-10 h-10 rounded-xl bg-purple-600/10 flex items-center justify-center mb-4">
              <Zap className="h-5 w-5 text-purple-500 dark:text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">快速定制</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
              聚焦核心目标<br />
              快速梳理需求<br />
              即刻生成学习计划
            </p>
            <div className="flex items-center gap-1 text-purple-500 dark:text-purple-400 text-sm font-medium group-hover:gap-2 transition-all">
              选择快速定制 <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </div>
        </button>

        <button
          onClick={() => onSelect("detailed")}
          onMouseEnter={() => setHovered("detailed")}
          onMouseLeave={() => setHovered(null)}
          className={cn(
            "relative group text-left p-6 rounded-2xl border transition-all duration-300 cursor-pointer",
            "border-black/[0.06] dark:border-white/[0.06] bg-black/[0.02] dark:bg-white/[0.02] backdrop-blur-sm",
            "hover:bg-black/[0.04] dark:hover:bg-white/[0.04] hover:border-purple-500/30",
            hovered === "quick" && "opacity-50"
          )}
        >
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-purple-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative z-10">
            <div className="w-10 h-10 rounded-xl bg-purple-600/10 flex items-center justify-center mb-4">
              <Microscope className="h-5 w-5 text-purple-500 dark:text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">深度规划</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
              全方位分析学习模式<br />
              深度挖掘潜在需求<br />
              更科学更个性化
            </p>
            <div className="flex items-center gap-1 text-purple-500 dark:text-purple-400 text-sm font-medium group-hover:gap-2 transition-all">
              选择深度规划 <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </div>
        </button>
      </div>
    </div>
  )
}
