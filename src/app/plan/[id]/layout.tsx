import type { Metadata } from "next"
import { cookies } from "next/headers"

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies()
  const lang = cookieStore.get("studyai-language")?.value === "zh-CN" ? "zh-CN" : "en"
  return {
    title: lang === "en" ? "Plan Details - StudyAI" : "计划详情 - StudyAI",
    description: lang === "en"
      ? "View your AI-generated personalized learning plan details, including phased planning, daily tasks, and scientific theory insights."
      : "查看AI生成的个性化学习计划详情，包括阶段规划、每日任务和科学理论依据。",
    openGraph: {
      title: lang === "en" ? "Plan Details | StudyAI" : "计划详情 | StudyAI",
      description: lang === "en"
        ? "View your AI-generated personalized learning plan details."
        : "查看AI生成的个性化学习计划详情。",
    },
  }
}

export default function PlanDetailLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
