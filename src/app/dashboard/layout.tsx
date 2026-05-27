import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "成长数据",
  description: "查看你的学习数据、成长轨迹与AI个性化评估。可视化学习趋势和习惯分析。",
  openGraph: {
    title: "成长数据 | StudyAI",
    description: "查看你的学习数据、成长轨迹与AI个性化评估。",
  },
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
