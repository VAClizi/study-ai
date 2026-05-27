import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "设置",
  description: "管理个人偏好、AI模型配置、教练人格选择和学习目标设置。",
  openGraph: {
    title: "设置 | StudyAI",
    description: "管理个人偏好、AI模型配置和学习目标。",
  },
}

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
