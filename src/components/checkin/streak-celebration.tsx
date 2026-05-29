"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { Flame, PartyPopper, Sparkles } from "lucide-react"
import { buildDayNodes, MILESTONES } from "@/lib/checkin-utils"

interface StreakCelebrationProps {
  show: boolean
  streakDays: number
  userName?: string
  onComplete: () => void
}

// Animated counter hook
function useAnimatedNumber(target: number, duration: number, start: boolean) {
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (!start) {
      setValue(0)
      return
    }
    const startVal = Math.max(0, target - 1)
    setValue(startVal)
    const startTime = performance.now()

    let raf: number
    const animate = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      // easeOutBack
      const c1 = 1.70158
      const c3 = c1 + 1
      const eased = 1 + c3 * Math.pow(progress - 1, 3) + c1 * Math.pow(progress - 1, 2)
      setValue(Math.round(startVal + (target - startVal) * eased))
      if (progress < 1) {
        raf = requestAnimationFrame(animate)
      }
    }
    raf = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(raf)
  }, [target, duration, start])

  return value
}

export function StreakCelebration({ show, streakDays, userName, onComplete }: StreakCelebrationProps) {
  const [phase, setPhase] = useState<"nodes" | "lighting" | "counter" | "card" | "milestone" | "done">("nodes")
  const [showConfetti, setShowConfetti] = useState(false)
  const [visible, setVisible] = useState(false)
  const nodes = useRef(buildDayNodes(false, "future"))
  const todayIdx = nodes.current.findIndex((n) => n.status === "today")

  const animatingCounter = useAnimatedNumber(streakDays, 800, phase === "counter" || phase === "card" || phase === "milestone" || phase === "done")

  // Phase sequencer
  useEffect(() => {
    if (!show) return
    setVisible(true)
    setPhase("nodes")
    setShowConfetti(false)

    const t1 = setTimeout(() => setPhase("lighting"), 500)
    const t2 = setTimeout(() => setPhase("counter"), 1100)
    const t3 = setTimeout(() => {
      setPhase("card")
      setShowConfetti(true)
    }, 1900)
    const t4 = setTimeout(() => setPhase("milestone"), 2500)
    const t5 = setTimeout(() => setPhase("done"), 3200)

    return () => {
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); clearTimeout(t5)
    }
  }, [show])

  const handleDismiss = useCallback(() => {
    setVisible(false)
    setTimeout(() => onComplete(), 300)
  }, [onComplete])

  if (!visible) return null

  const milestoneData = MILESTONES[streakDays]
  const isLighting = phase === "lighting" || phase === "counter" || phase === "card" || phase === "milestone" || phase === "done"
  const showCard = phase === "card" || phase === "milestone" || phase === "done"
  const showMilestone = (phase === "milestone" || phase === "done") && milestoneData

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-sm transition-opacity duration-500"
        onClick={handleDismiss}
      />

      {/* Confetti pieces */}
      {showConfetti && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 60 }, (_, i) => (
            <div
              key={i}
              className="absolute top-0 w-2 h-2 rounded-sm opacity-0"
              style={{
                left: `${Math.random() * 100}%`,
                backgroundColor: ["#a855f7", "#ec4899", "#f97316", "#facc15", "#10b981", "#06b6d4"][i % 6],
                animation: `confetti-fall ${1.5 + Math.random() * 2}s ${Math.random() * 0.5}s ease-in forwards`,
                '--drift': `${(Math.random() - 0.5) * 200}px`,
              } as React.CSSProperties}
            />
          ))}
        </div>
      )}

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center gap-6 max-w-sm w-full mx-4">
        {/* Streak nodes row */}
        <div
          className={`flex items-center gap-3 transition-all duration-500 ${
            phase !== "nodes" && phase !== "done" ? "scale-100 opacity-100" : "scale-95 opacity-0"
          }`}
          style={{ transitionDelay: "0s" }}
        >
          {nodes.current.map((node, i) => {
            const isTodayNode = i === todayIdx
            const filled = isTodayNode ? isLighting : node.status === "completed"

            return (
              <div key={node.date} className="flex flex-col items-center gap-1.5">
                {/* Node circle */}
                <div className="relative w-10 h-10">
                  {/* Background glow when lighting */}
                  {isTodayNode && isLighting && (
                    <div
                      className="absolute inset-0 rounded-full bg-orange-500/20 animate-ping"
                      style={{ animationDuration: "1.5s" }}
                    />
                  )}
                  <div
                    className={`relative w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-500 ${
                      filled
                        ? "bg-gradient-to-br from-orange-400 to-orange-500 text-white shadow-md shadow-orange-500/30 scale-100"
                        : node.status === "today"
                          ? "border-2 border-orange-400 dark:border-orange-500 text-orange-500 bg-orange-50 dark:bg-orange-500/10 scale-100"
                          : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500"
                    }`}
                    style={{
                      transitionDelay: isTodayNode && isLighting ? "0s" : "0s",
                    }}
                  >
                    {filled ? (
                      <Flame
                        className={`h-5 w-5 text-white fill-white/30 ${
                          isTodayNode && isLighting ? "animate-bounce-in" : ""
                        }`}
                        style={{
                          animationDuration: isTodayNode && isLighting ? "0.5s" : undefined,
                        }}
                      />
                    ) : (
                      node.dayNum
                    )}
                  </div>
                </div>
                {/* Day label */}
                <span className={`text-[11px] font-medium transition-colors duration-500 ${
                  filled ? "text-orange-500" : node.status === "today" ? "text-orange-500 font-semibold" : "text-zinc-400"
                }`}>
                  {node.dayLabel}
                </span>
              </div>
            )
          })}
        </div>

        {/* Streak counter */}
        <div
          className={`text-center transition-all duration-500 ${
            phase === "counter" || phase === "card" || phase === "milestone" || phase === "done"
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-4"
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <Flame className="h-8 w-8 text-orange-500 fill-orange-500/20" />
            <span className="text-5xl font-extrabold text-zinc-900 dark:text-white tabular-nums">
              {animatingCounter}
            </span>
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">连续打卡天数</p>
        </div>

        {/* Celebration card */}
        <div
          className={`w-full transition-all duration-500 ${
            showCard ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-90 translate-y-8"
          }`}
        >
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl shadow-purple-500/10 p-6 text-center">
            <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center">
              <Flame className="h-7 w-7 text-white fill-white/30" />
            </div>

            <p className="text-lg font-bold text-zinc-900 dark:text-white mb-1">
              太棒了{userName ? `，${userName}` : ""}！
            </p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
              已连续打卡 <span className="font-bold text-orange-500 text-lg">{streakDays}</span> 天
            </p>

            {showMilestone && milestoneData && (
              <div className="mb-4 p-3 rounded-xl bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-500/10 dark:to-amber-500/10 border border-orange-200/60 dark:border-orange-500/20 transition-all duration-500 animate-fade-in-up">
                <span className="text-3xl block mb-1">{milestoneData.badge}</span>
                <p className="text-sm font-semibold text-orange-600 dark:text-orange-400">{milestoneData.label}</p>
              </div>
            )}

            <button
              onClick={handleDismiss}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold text-sm shadow-lg shadow-orange-500/25 transition-all active:scale-95"
            >
              <PartyPopper className="h-4 w-4" />
              返回今日页面
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
