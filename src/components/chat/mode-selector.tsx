"use client"

import { useState } from "react"
import type { ChatMode } from "@/types/chat"
import { usePersonaStore, PERSONAS } from "@/stores/persona-store"
import type { ContentPreference } from "@/stores/persona-store"
import { useLanguageStore } from "@/stores/language-store"
import { useT, useTF } from "@/lib/i18n"
import { cn } from "@/lib/cn"
import { Zap, Microscope, ArrowRight, Sparkles, ArrowLeft, Video, FileText, Layers } from "lucide-react"

interface ModeSelectorProps {
  onSelect: (mode: ChatMode) => void
}

const personaList = Object.values(PERSONAS)

const CONTENT_PREFS: { id: ContentPreference; icon: typeof Video; labelKey: string; descKey: string }[] = [
  { id: "video", icon: Video, labelKey: "mode.contentPrefVideo", descKey: "mode.contentPrefVideoDesc" },
  { id: "article", icon: FileText, labelKey: "mode.contentPrefArticle", descKey: "mode.contentPrefArticleDesc" },
  { id: "balanced", icon: Layers, labelKey: "mode.contentPrefBalanced", descKey: "mode.contentPrefBalancedDesc" },
]

function StaggerBadge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-600/10 border border-purple-500/20 text-purple-600 dark:text-purple-300 text-sm mb-6 backdrop-blur-sm animate-stagger-1", className)}>
      <Sparkles className="h-3.5 w-3.5" />
      {children}
    </div>
  )
}

function StaggerTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2 animate-stagger-2">
      {children}
    </h2>
  )
}

function StaggerSubtitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-zinc-500 dark:text-zinc-400 text-sm animate-stagger-3">
      {children}
    </p>
  )
}

function StaggerButton({ children, onClick, className }: { children: React.ReactNode; onClick: () => void; className?: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium transition-all shadow-lg shadow-purple-600/25 hover:shadow-purple-600/40 active:scale-95 animate-stagger-4",
        className,
      )}
    >
      {children}
      <ArrowRight className="h-4 w-4" />
    </button>
  )
}

function StaggerBack({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="self-start mb-4 inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors animate-stagger-1"
    >
      <ArrowLeft className="h-3.5 w-3.5" />
      {children}
    </button>
  )
}

export function ModeSelector({ onSelect }: ModeSelectorProps) {
  const [hovered, setHovered] = useState<ChatMode | null>(null)
  const [step, setStep] = useState<"persona" | "contentPref" | "mode">("persona")
  const { persona, setPersona, contentPreference, setContentPreference } = usePersonaStore()
  const language = useLanguageStore((s) => s.language)
  const t = useT()
  const tf = useTF()

  // ===== Step 1: Select coach persona =====
  if (step === "persona") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <div className="text-center mb-8">
          <StaggerBadge>{t("mode.step1Label")}</StaggerBadge>
          <StaggerTitle>{t("mode.coachTitle")}</StaggerTitle>
          <StaggerSubtitle>{t("mode.coachDesc")}</StaggerSubtitle>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl mb-10">
          {personaList.map((p, i) => {
            const isActive = persona === p.id
            return (
              <button
                key={p.id}
                onClick={() => setPersona(p.id)}
                className={cn(
                  "relative group text-left p-5 rounded-2xl border transition-all duration-300 cursor-pointer",
                  `animate-scale-stagger-${i + 1}`,
                  isActive
                    ? "border-purple-500/50 bg-purple-600/[0.08] shadow-lg shadow-purple-500/10 ring-1 ring-purple-500/20"
                    : "border-black/[0.06] dark:border-white/[0.06] bg-black/[0.02] dark:bg-white/[0.02] backdrop-blur-sm hover:bg-black/[0.04] dark:hover:bg-white/[0.04] hover:border-purple-500/25"
                )}
              >
                <div className="text-3xl mb-3">{p.icon}</div>
                <h3 className="text-base font-semibold text-zinc-900 dark:text-white mb-1.5">
                  {p.name[language]}
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  {p.description[language]}
                </p>
                {isActive && (
                  <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-purple-600 flex items-center justify-center animate-scale-in">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </button>
            )
          })}
        </div>

        <StaggerButton onClick={() => setStep("contentPref")}>
          {t("mode.nextStep")}：{t("mode.contentPrefTitle")}
        </StaggerButton>
      </div>
    )
  }

  // ===== Step 2: Select content preference =====
  if (step === "contentPref") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <StaggerBack onClick={() => setStep("persona")}>{t("mode.backToCoach")}</StaggerBack>

        <div className="text-center mb-8">
          <StaggerBadge>{t("mode.step2Label")}</StaggerBadge>
          <StaggerTitle>{t("mode.contentPrefTitle")}</StaggerTitle>
          <StaggerSubtitle>{t("mode.contentPrefDesc")}</StaggerSubtitle>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl mb-10">
          {CONTENT_PREFS.map((pref, i) => {
            const isActive = contentPreference === pref.id
            return (
              <button
                key={pref.id}
                onClick={() => setContentPreference(pref.id)}
                className={cn(
                  "relative group text-left p-5 rounded-2xl border transition-all duration-300 cursor-pointer",
                  `animate-scale-stagger-${i + 1}`,
                  isActive
                    ? "border-purple-500/50 bg-purple-600/[0.08] shadow-lg shadow-purple-500/10 ring-1 ring-purple-500/20"
                    : "border-black/[0.06] dark:border-white/[0.06] bg-black/[0.02] dark:bg-white/[0.02] backdrop-blur-sm hover:bg-black/[0.04] dark:hover:bg-white/[0.04] hover:border-purple-500/25"
                )}
              >
                <div className="w-10 h-10 rounded-xl bg-purple-600/10 flex items-center justify-center mb-4">
                  <pref.icon className="h-5 w-5 text-purple-500 dark:text-purple-400" />
                </div>
                <h3 className="text-base font-semibold text-zinc-900 dark:text-white mb-1.5">
                  {t(pref.labelKey)}
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  {t(pref.descKey)}
                </p>
                {isActive && (
                  <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-purple-600 flex items-center justify-center animate-scale-in">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </button>
            )
          })}
        </div>

        <StaggerButton onClick={() => setStep("mode")}>
          {t("mode.nextStep")}：{t("mode.step2Title")}
        </StaggerButton>
      </div>
    )
  }

  // ===== Step 3: Select planning mode =====
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <StaggerBack onClick={() => setStep("contentPref")}>{t("mode.backToContentPref")}</StaggerBack>

      <div className="text-center mb-10">
        <StaggerBadge>{t("mode.step3Label")}</StaggerBadge>
        <StaggerTitle>{t("mode.step2Title")}</StaggerTitle>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm animate-stagger-3">
          {tf("mode.currentCoach", { name: PERSONAS[persona].name[language], icon: PERSONAS[persona].icon })}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-xl">
        <button
          onClick={() => onSelect("quick")}
          onMouseEnter={() => setHovered("quick")}
          onMouseLeave={() => setHovered(null)}
          className={cn(
            "relative group text-left p-6 rounded-2xl border transition-all duration-300 cursor-pointer animate-scale-stagger-1",
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
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">{t("chat.quickPlan")}</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
              {t("mode.quickDesc1")}<br />
              {t("mode.quickDesc2")}<br />
              {t("mode.quickDesc3")}
            </p>
            <div className="flex items-center gap-1 text-purple-500 dark:text-purple-400 text-sm font-medium group-hover:gap-2 transition-all">
              {t("mode.selectQuick")} <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </div>
        </button>

        <button
          onClick={() => onSelect("detailed")}
          onMouseEnter={() => setHovered("detailed")}
          onMouseLeave={() => setHovered(null)}
          className={cn(
            "relative group text-left p-6 rounded-2xl border transition-all duration-300 cursor-pointer animate-scale-stagger-2",
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
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">{t("chat.detailedPlan")}</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
              {t("mode.detailedDesc1")}<br />
              {t("mode.detailedDesc2")}<br />
              {t("mode.detailedDesc3")}
            </p>
            <div className="flex items-center gap-1 text-purple-500 dark:text-purple-400 text-sm font-medium group-hover:gap-2 transition-all">
              {t("mode.selectDetailed")} <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </div>
        </button>
      </div>
    </div>
  )
}
