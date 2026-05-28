import type { Metadata } from "next"
import { cookies } from "next/headers"

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies()
  const lang = cookieStore.get("studyai-language")?.value === "en" ? "en" : "zh-CN"
  return {
    title: lang === "en" ? "Settings - StudyAI" : "设置 - StudyAI",
    description: lang === "en"
      ? "Manage personal preferences, AI coach personality, and learning goal settings."
      : "管理个人偏好、AI模型配置、教练人格选择和学习目标设置。",
    openGraph: {
      title: lang === "en" ? "Settings | StudyAI" : "设置 | StudyAI",
      description: lang === "en"
        ? "Manage personal preferences, AI coach personality, and learning goals."
        : "管理个人偏好、AI模型配置和学习目标。",
    },
  }
}

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
