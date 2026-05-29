import type { Metadata } from "next"
import { cookies } from "next/headers"

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies()
  const lang = cookieStore.get("studyai-language")?.value === "zh-CN" ? "zh-CN" : "en"
  return {
    title: lang === "en" ? "About Us - StudyAI" : "关于我们 - StudyAI",
    description: lang === "en"
      ? "Learn about StudyAI's mission and team"
      : "了解 StudyAI 的使命和团队",
    openGraph: {
      title: lang === "en" ? "About Us | StudyAI" : "关于我们 | StudyAI",
      description: lang === "en"
        ? "Learn about StudyAI's mission and team"
        : "了解 StudyAI 的使命和团队",
    },
  }
}

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
