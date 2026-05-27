import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "今日任务",
  description: "查看今日学习任务，完成每日打卡。保持学习连续性和自律习惯。",
  openGraph: {
    title: "今日任务 | StudyAI",
    description: "查看今日学习任务，完成每日打卡。",
  },
}

export default function TodayLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
