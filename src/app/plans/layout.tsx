import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "我的计划",
  description: "管理所有AI生成的学习计划，追踪每个计划的学习进度和完成情况。",
  openGraph: {
    title: "我的计划 | StudyAI",
    description: "管理所有AI生成的学习计划，追踪学习进度。",
  },
}

export default function PlansLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
