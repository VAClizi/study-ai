import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "计划详情",
  description: "查看AI生成的个性化学习计划详情，包括阶段规划、每日任务和科学理论依据。",
  openGraph: {
    title: "计划详情 | StudyAI",
    description: "查看AI生成的个性化学习计划详情。",
  },
}

export default function PlanDetailLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
