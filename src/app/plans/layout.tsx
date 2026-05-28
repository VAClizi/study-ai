import type { Metadata } from "next"
import { cookies } from "next/headers"

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies()
  const lang = cookieStore.get("studyai-language")?.value === "en" ? "en" : "zh-CN"
  return {
    title: lang === "en" ? "My Plans - StudyAI" : "我的计划 - StudyAI",
    description: lang === "en"
      ? "Manage all AI-generated learning plans, track progress and completion for each plan."
      : "管理所有AI生成的学习计划，追踪每个计划的学习进度和完成情况。",
    openGraph: {
      title: lang === "en" ? "My Plans | StudyAI" : "我的计划 | StudyAI",
      description: lang === "en"
        ? "Manage all AI-generated learning plans and track progress."
        : "管理所有AI生成的学习计划，追踪学习进度。",
    },
  }
}

export default function PlansLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
