"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  Sparkles, Brain, Clock, GraduationCap,
  Globe, Send, Activity, Loader2,
} from "lucide-react"
import { useT } from "@/lib/i18n"
import { useAuthStore } from "@/stores/auth-store"
import { cn } from "@/lib/cn"

const suggestions = [
  { icon: GraduationCap, key: "home.suggestion1" },
  { icon: Clock, key: "home.suggestion2" },
  { icon: Globe, key: "home.suggestion3" },
  { icon: Brain, key: "home.suggestion4" },
]

const placeholders = [
  "home.inputPlaceholder1",
  "home.inputPlaceholder2",
  "home.inputPlaceholder3",
  "home.inputPlaceholder4",
]

const features = [
  { icon: Brain, key: "home.basedOn" },
  { icon: Activity, key: "home.realTimeAdjust" },
  { icon: Sparkles, key: "home.aiPersonalized" },
]

export function HeroSection() {
  const [prompt, setPrompt] = useState("")
  const [isFocused, setIsFocused] = useState(false)
  const [placeholderIndex, setPlaceholderIndex] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const [isActivating, setIsActivating] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const t = useT()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      setPlaceholderIndex((i) => (i + 1) % placeholders.length)
    }, 3000)
    return () => clearInterval(timer)
  }, [])

  const handleSubmit = useCallback(() => {
    if (!prompt.trim() || isActivating) return
    if (!isAuthenticated) { router.push("/login"); return }

    setIsActivating(true)
    setTimeout(() => {
      setIsActivating(false)
      setPrompt("")
    }, 900)
    router.push(`/chat?prompt=${encodeURIComponent(prompt.trim())}&mode=quick`)
  }, [prompt, isActivating, isAuthenticated, router])

  const handleSuggestionClick = useCallback((key: string) => {
    if (!isAuthenticated) { router.push("/login"); return }
    setIsActivating(true)
    setTimeout(() => setIsActivating(false), 900)
    router.push(`/chat?prompt=${encodeURIComponent(t(key))}&mode=quick`)
  }, [isAuthenticated, router, t])

  return (
    <section className="relative min-h-[calc(100vh-3.5rem)] flex flex-col items-center justify-center px-4 overflow-hidden">
      {/* ===== Animated Background ===== */}
      <div className="absolute inset-0 -z-10">
        {/* Primary orb - center glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-600/20 dark:bg-purple-500/15 rounded-full blur-[150px] animate-pulse" />

        {/* Floating orbs */}
        <div className="absolute top-[15%] left-[10%] w-[500px] h-[500px] bg-violet-500/10 dark:bg-violet-400/8 rounded-full blur-[130px] animate-orb-drift" />
        <div className="absolute bottom-[10%] right-[8%] w-[450px] h-[450px] bg-indigo-500/10 dark:bg-indigo-400/8 rounded-full blur-[120px] animate-orb-drift" style={{ animationDelay: "3s" }} />
        <div className="absolute top-[45%] right-[15%] w-[350px] h-[350px] bg-fuchsia-500/8 dark:bg-fuchsia-400/6 rounded-full blur-[110px] animate-orb-drift" style={{ animationDelay: "6s" }} />
        <div className="absolute bottom-[30%] left-[20%] w-[300px] h-[300px] bg-purple-400/8 rounded-full blur-[100px] animate-orb-drift" style={{ animationDelay: "9s" }} />

        {/* Dot pattern grid */}
        <div
          className="absolute inset-0 opacity-[0.025] dark:opacity-[0.04]"
          style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, rgb(168 85 247) 1px, transparent 0)",
            backgroundSize: "44px 44px",
          }}
        />
      </div>

      {/* ===== Content ===== */}
      <div className="relative z-10 w-full max-w-2xl mx-auto text-center">
        {/* AI Status Badge */}
        <div
          className={cn(
            "inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-8",
            "bg-emerald-500/[0.06] dark:bg-emerald-500/[0.08]",
            "border border-emerald-500/15 dark:border-emerald-500/20",
            "backdrop-blur-md",
            "transition-all duration-700",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
          )}
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping-slow absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 tracking-wide">
            {t("home.aiReady")}
          </span>
        </div>

        {/* Heading */}
        <h1
          className={cn(
            "text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 leading-[1.1]",
            "transition-all duration-700 delay-100",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          )}
        >
          <span className="text-zinc-900 dark:text-white">{t("home.your")}</span>
          <span className="bg-gradient-to-r from-purple-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent animate-glow">
            {t("home.aiCoach")}
          </span>
        </h1>

        {/* Subtitle */}
        <p
          className={cn(
            "text-lg text-zinc-500 dark:text-zinc-400 mb-12 max-w-xl mx-auto leading-relaxed",
            "transition-all duration-700 delay-200",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          )}
        >
          {t("home.subtitle")}
        </p>

        {/* ===== ChatGPT-Style Input ===== */}
        <div
          className={cn(
            "relative mb-6 transition-all duration-700 delay-300",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          )}
        >
          {/* Glow effect behind input */}
          <div
            className={cn(
              "absolute inset-0 rounded-2xl blur-xl transition-all duration-500",
              isFocused
                ? "bg-purple-500/15 dark:bg-purple-500/20 scale-[1.02]"
                : "bg-purple-500/5 dark:bg-purple-500/5 scale-100"
            )}
          />

          {/* Input container */}
          <div
            className={cn(
              "relative rounded-2xl border transition-all duration-500",
              "bg-white/70 dark:bg-zinc-900/50 backdrop-blur-xl",
              "shadow-lg shadow-black/[0.02] dark:shadow-purple-500/[0.02]",
              isFocused
                ? "border-purple-500/30 dark:border-purple-500/40 shadow-xl shadow-purple-500/[0.06] dark:shadow-purple-500/[0.08]"
                : "border-black/[0.06] dark:border-white/[0.08] animate-border-glow"
            )}
          >
            <input
              ref={inputRef}
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleSubmit()
                }
              }}
              placeholder={t(placeholders[placeholderIndex])}
              className={cn(
                "w-full bg-transparent px-5 py-4.5 text-[15px]",
                "text-zinc-900 dark:text-white",
                "placeholder:text-zinc-400 dark:placeholder:text-zinc-500",
                "placeholder:transition-all placeholder:duration-500",
                "outline-none"
              )}
            />

            {/* Send button */}
            <button
              onClick={handleSubmit}
              disabled={!prompt.trim()}
              className={cn(
                "absolute right-2.5 top-1/2 -translate-y-1/2",
                "w-9 h-9 rounded-xl flex items-center justify-center",
                "transition-all duration-300",
                prompt.trim()
                  ? "bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-600/30 hover:shadow-purple-600/40 hover:scale-105 active:scale-95"
                  : "bg-black/[0.04] dark:bg-white/[0.04] text-zinc-400 dark:text-zinc-500"
              )}
            >
              <Send className="h-4 w-4" />
            </button>
          </div>

          {/* ===== AI Suggestion Chips ===== */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
            {suggestions.map((item, i) => (
              <button
                key={item.key}
                onClick={() => handleSuggestionClick(item.key)}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[13px]",
                  "border border-black/[0.05] dark:border-white/[0.06]",
                  "bg-white/50 dark:bg-zinc-900/40 backdrop-blur-md",
                  "text-zinc-500 dark:text-zinc-400",
                  "hover:border-purple-500/25 dark:hover:border-purple-500/30",
                  "hover:text-purple-600 dark:hover:text-purple-400",
                  "hover:bg-purple-50/80 dark:hover:bg-purple-500/[0.06]",
                  "transition-all duration-300",
                  "hover:scale-[1.03] hover:-translate-y-0.5",
                  "active:scale-[0.97]",
                  "shadow-sm"
                )}
                style={{
                  animationDelay: `${0.4 + i * 0.08}s`,
                }}
              >
                <item.icon className="h-3.5 w-3.5 opacity-70" />
                {t(item.key)}
              </button>
            ))}
          </div>
        </div>

        {/* ===== Feature indicators ===== */}
        <div
          className={cn(
            "flex items-center justify-center gap-6 text-xs text-zinc-400 dark:text-zinc-500",
            "transition-all duration-700 delay-500",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          )}
        >
          {features.map((item, i) => (
            <span
              key={item.key}
              className="inline-flex items-center gap-1.5 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors duration-300"
            >
              <item.icon className="h-3 w-3 text-purple-500/60 dark:text-purple-400/60" />
              {t(item.key)}
            </span>
          ))}
        </div>
      </div>

      {/* ===== Scroll hint ===== */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
        <div className="w-5 h-8 rounded-full border border-black/10 dark:border-white/10 flex items-start justify-center p-1">
          <div className="w-1 h-2 rounded-full bg-purple-500/40 animate-bounce" />
        </div>
      </div>

      {/* ===== Navigation Overlay ===== */}
      {isActivating && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/90 dark:bg-zinc-950/90 backdrop-blur-xl">
          <div className="relative mb-8">
            <div className="w-20 h-20 rounded-2xl bg-purple-600/20 flex items-center justify-center">
              <Loader2 className="h-10 w-10 text-purple-500 animate-spin" />
            </div>
            <div className="absolute -inset-2 rounded-2xl bg-purple-500/10 blur-xl animate-pulse" />
          </div>
          <p className="text-lg font-medium text-zinc-900 dark:text-white mb-2">
            {t("home.activating")}
          </p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {t("home.activatingDesc")}
          </p>
          <div className="flex gap-1.5 mt-6">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-purple-500 animate-bounce"
                style={{ animationDelay: `${i * 150}ms` }}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
