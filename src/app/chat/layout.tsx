import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "AI 规划",
  description: "与AI教练对话，生成高度个性化的科学学习计划。两种规划模式：快速定制和深度规划。",
  openGraph: {
    title: "AI 规划 | StudyAI",
    description: "与AI教练对话，生成高度个性化的科学学习计划。",
  },
}

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
