import type { Metadata } from "next"
import { cookies } from "next/headers"

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies()
  const lang = cookieStore.get("studyai-language")?.value === "en" ? "en" : "zh-CN"
  return {
    title: lang === "en" ? "Privacy Policy - StudyAI" : "隐私政策 - StudyAI",
    description: lang === "en"
      ? "StudyAI Privacy Policy - how we collect and use your data"
      : "StudyAI 隐私政策，我们如何收集和使用你的数据",
    openGraph: {
      title: lang === "en" ? "Privacy Policy | StudyAI" : "隐私政策 | StudyAI",
      description: lang === "en"
        ? "StudyAI Privacy Policy - how we collect and use your data"
        : "StudyAI 隐私政策，我们如何收集和使用你的数据",
    },
  }
}

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
