"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle, Sparkles, PartyPopper } from "lucide-react"

interface ConfettiCelebrationProps {
  show: boolean
  message?: string
  milestone?: number | null
  onComplete?: () => void
}

const COLORS = [
  "bg-purple-500", "bg-violet-500", "bg-pink-500", "bg-rose-500",
  "bg-orange-500", "bg-yellow-400", "bg-emerald-500", "bg-cyan-400",
]

const MILESTONES: Record<number, { badge: string; label: string }> = {
  7: { badge: "🌟", label: "一周里程碑！习惯正在形成" },
  30: { badge: "🏆", label: "月度里程碑！你已经坚持一个月了" },
  100: { badge: "👑", label: "百天里程碑！学习已成为你的生活方式" },
}

// Generate confetti piece configs
function generatePieces(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    color: COLORS[i % COLORS.length],
    delay: `${Math.random() * 0.6}s`,
    duration: `${1.5 + Math.random() * 2}s`,
    size: 6 + Math.random() * 8,
    rotation: Math.random() * 360,
    drift: `${(Math.random() - 0.5) * 200}px`,
  }))
}

export function ConfettiCelebration({ show, message, milestone, onComplete }: ConfettiCelebrationProps) {
  const [pieces] = useState(() => generatePieces(80))
  const [visible, setVisible] = useState(false)
  const [showCard, setShowCard] = useState(false)
  const [showMilestone, setShowMilestone] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (!show) return
    setVisible(true)
    setShowCard(false)
    setShowMilestone(false)

    const t1 = setTimeout(() => setShowCard(true), 400)
    const t2 = milestone ? setTimeout(() => setShowMilestone(true), 1200) : null

    return () => {
      clearTimeout(t1)
      if (t2) clearTimeout(t2)
    }
  }, [show, milestone])

  const handleDismiss = () => {
    setShowCard(false)
    setShowMilestone(false)
    setTimeout(() => {
      setVisible(false)
      if (onComplete) onComplete()
    }, 300)
  }

  if (!visible) return null

  const milestoneData = milestone ? MILESTONES[milestone] : null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-sm transition-opacity duration-300"
        onClick={handleDismiss}
      />

      {/* Confetti pieces — pure CSS animation */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {pieces.map((p) => (
          <div
            key={p.id}
            className={`absolute top-0 ${p.color} rounded-sm opacity-0`}
            style={{
              left: p.left,
              width: p.size,
              height: p.size * (Math.random() > 0.5 ? 1 : 0.6),
              animation: `confetti-fall ${p.duration} ${p.delay} ease-in forwards`,
              transform: `rotate(${p.rotation}deg)`,
              '--drift': p.drift,
            } as React.CSSProperties}
          />
        ))}
      </div>

      {/* Center card */}
      <div
        className={`relative z-10 max-w-sm w-full mx-4 transition-all duration-500 ${
          showCard ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-90 translate-y-8"
        }`}
      >
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl shadow-purple-500/10 p-8 text-center">
          {/* Icon */}
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <PartyPopper className="h-8 w-8 text-white" />
          </div>

          {/* Message */}
          {message && (
            <p className="text-xl font-bold text-zinc-900 dark:text-white mb-2 leading-snug">
              {message}
            </p>
          )}

          {/* Sparkle accent */}
          <div className="flex items-center justify-center gap-1 mb-6">
            {[...Array(3)].map((_, i) => (
              <Sparkles key={i} className="h-4 w-4 text-yellow-500" style={{ animationDelay: `${i * 0.3}s` }} />
            ))}
          </div>

          {/* Milestone badge */}
          {showMilestone && milestoneData && (
            <div className="mb-4 p-4 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-500/10 dark:to-pink-500/10 border border-purple-200/60 dark:border-purple-500/20">
              <span className="text-4xl block mb-1">{milestoneData.badge}</span>
              <span className="text-lg font-bold text-purple-600 dark:text-purple-400">
                {milestone} 天
              </span>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                {milestoneData.label}
              </p>
            </div>
          )}

          {/* Dismiss button */}
          <button
            onClick={handleDismiss}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white font-semibold text-sm shadow-lg shadow-purple-600/25 transition-all active:scale-95"
          >
            <CheckCircle className="h-4 w-4" />
            返回今日页面
          </button>
        </div>
      </div>
    </div>
  )
}
