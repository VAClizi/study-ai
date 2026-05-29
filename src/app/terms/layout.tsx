import type { Metadata } from "next"
import { cookies } from "next/headers"

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies()
  const lang = cookieStore.get("studyai-language")?.value === "zh-CN" ? "zh-CN" : "en"
  return {
    title: lang === "en" ? "Terms of Service - StudyAI" : "服务条款 - StudyAI",
    description: lang === "en"
      ? "StudyAI Terms of Service and Usage Agreement"
      : "StudyAI 服务条款和使用协议",
    openGraph: {
      title: lang === "en" ? "Terms of Service | StudyAI" : "服务条款 | StudyAI",
      description: lang === "en"
        ? "StudyAI Terms of Service and Usage Agreement"
        : "StudyAI 服务条款和使用协议",
    },
  }
}

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
