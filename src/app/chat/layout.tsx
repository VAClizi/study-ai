import type { Metadata } from "next"
import { cookies } from "next/headers"

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies()
  const lang = cookieStore.get("studyai-language")?.value === "en" ? "en" : "zh-CN"
  return {
    title: lang === "en" ? "AI Plan - StudyAI" : "AI 规划 - StudyAI",
    description: lang === "en"
      ? "Chat with your AI coach to generate a highly personalized, science-backed learning plan. Two modes: quick and deep planning."
      : "与AI教练对话，生成高度个性化的科学学习计划。两种规划模式：快速定制和深度规划。",
    openGraph: {
      title: lang === "en" ? "AI Plan | StudyAI" : "AI 规划 | StudyAI",
      description: lang === "en"
        ? "Chat with your AI coach to generate a highly personalized learning plan."
        : "与AI教练对话，生成高度个性化的科学学习计划。",
    },
  }
}

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
