import type { Metadata } from "next"
import { cookies } from "next/headers"

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies()
  const lang = cookieStore.get("studyai-language")?.value === "en" ? "en" : "zh-CN"
  return {
    title: lang === "en" ? "Today - StudyAI" : "今日任务 - StudyAI",
    description: lang === "en"
      ? "View today's learning tasks, complete daily check-in. Maintain learning consistency and discipline habits."
      : "查看今日学习任务，完成每日打卡。保持学习连续性和自律习惯。",
    openGraph: {
      title: lang === "en" ? "Today | StudyAI" : "今日任务 | StudyAI",
      description: lang === "en"
        ? "View today's learning tasks and complete your daily check-in."
        : "查看今日学习任务，完成每日打卡。",
    },
  }
}

export default function TodayLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
