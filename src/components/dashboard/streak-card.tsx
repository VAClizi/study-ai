"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Flame, Trophy, Target } from "lucide-react"

interface StreakCardProps {
  currentStreak: number
  longestStreak: number
  totalDays: number
}

export function StreakCard({ currentStreak, longestStreak, totalDays }: StreakCardProps) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <Card className="border-black/[0.04] dark:border-white/[0.04] bg-black/[0.01] dark:bg-white/[0.01] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-orange-600/5 to-transparent" />
        <CardContent className="p-4 relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <Flame className="h-4 w-4 text-orange-500 dark:text-orange-400" />
            </div>
          </div>
          <span className="text-2xl font-bold text-zinc-900 dark:text-white block">{currentStreak}</span>
          <span className="text-xs text-zinc-400 dark:text-zinc-500">当前连续天数</span>
        </CardContent>
      </Card>

      <Card className="border-black/[0.04] dark:border-white/[0.04] bg-black/[0.01] dark:bg-white/[0.01] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-600/5 to-transparent" />
        <CardContent className="p-4 relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Trophy className="h-4 w-4 text-purple-500 dark:text-purple-400" />
            </div>
          </div>
          <span className="text-2xl font-bold text-zinc-900 dark:text-white block">{longestStreak}</span>
          <span className="text-xs text-zinc-400 dark:text-zinc-500">最长连续记录</span>
        </CardContent>
      </Card>

      <Card className="border-black/[0.04] dark:border-white/[0.04] bg-black/[0.01] dark:bg-white/[0.01] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-green-600/5 to-transparent" />
        <CardContent className="p-4 relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
              <Target className="h-4 w-4 text-green-500 dark:text-green-400" />
            </div>
          </div>
          <span className="text-2xl font-bold text-zinc-900 dark:text-white block">{totalDays}</span>
          <span className="text-xs text-zinc-400 dark:text-zinc-500">累计学习天数</span>
        </CardContent>
      </Card>
    </div>
  )
}
