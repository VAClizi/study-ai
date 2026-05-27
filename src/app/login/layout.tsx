import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "登录",
  description: "登录 StudyAI，开启你的AI智能学习规划之旅。科学规划，而非盲目努力。",
  openGraph: {
    title: "登录 | StudyAI",
    description: "登录 StudyAI，开启你的AI智能学习规划之旅。",
  },
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
