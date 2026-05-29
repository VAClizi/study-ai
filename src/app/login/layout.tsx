import type { Metadata } from "next"
import { cookies } from "next/headers"

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies()
  const lang = cookieStore.get("studyai-language")?.value === "zh-CN" ? "zh-CN" : "en"
  return {
    title: lang === "en" ? "Login - StudyAI" : "登录 - StudyAI",
    description: lang === "en"
      ? "Log in to StudyAI and begin your AI-powered learning journey. Plan scientifically, not blindly."
      : "登录 StudyAI，开启你的AI智能学习规划之旅。科学规划，而非盲目努力。",
    openGraph: {
      title: lang === "en" ? "Login | StudyAI" : "登录 | StudyAI",
      description: lang === "en"
        ? "Log in to StudyAI and begin your AI-powered learning journey."
        : "登录 StudyAI，开启你的AI智能学习规划之旅。",
    },
  }
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
