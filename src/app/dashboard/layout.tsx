import type { Metadata } from "next"
import { cookies } from "next/headers"

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies()
  const lang = cookieStore.get("studyai-language")?.value === "en" ? "en" : "zh-CN"
  return {
    title: lang === "en" ? "Dashboard - StudyAI" : "成长数据 - StudyAI",
    description: lang === "en"
      ? "View your learning data, growth trajectory, and AI-powered personalized assessment. Visualized learning trends and habit analysis."
      : "查看你的学习数据、成长轨迹与AI个性化评估。可视化学习趋势和习惯分析。",
    openGraph: {
      title: lang === "en" ? "Dashboard | StudyAI" : "成长数据 | StudyAI",
      description: lang === "en"
        ? "View your learning data, growth trajectory, and AI assessment."
        : "查看你的学习数据、成长轨迹与AI个性化评估。",
    },
  }
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
