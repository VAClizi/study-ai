import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "关于我们",
  description: "了解 StudyAI 的使命和团队",
}

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <article className="prose prose-zinc dark:prose-invert max-w-none">
        <h1>关于 StudyAI</h1>

        <h2>我们的使命</h2>
        <p>
          StudyAI 致力于通过人工智能和认知科学的融合，帮助每个人实现高效、可持续的学习成长。
          我们相信，好的规划比盲目的努力更重要。
        </p>

        <h2>核心理念</h2>

        <h3>科学学习</h3>
        <p>
          我们的学习计划基于经过验证的认知科学理论：间隔重复、深度工作、番茄工作法、费曼学习法等。
          每一项建议背后都有研究支撑。
        </p>

        <h3>个性化</h3>
        <p>
          每个人的学习方式都不同。StudyAI 通过分析你的作息习惯、注意力特点、学习风格和学习目标，
          生成真正适合你的学习计划。
        </p>

        <h3>持续性</h3>
        <p>
          学习是长期的过程。我们不追求短期的冲刺，而是帮助你建立可持续的学习习惯，
          让自律成为一种生活方式。
        </p>

        <h2>技术驱动</h2>
        <p>
          我们利用最新的人工智能技术，让每位学习者都能获得专业教练级别的个性化指导。
          AI 教练会根据你的表现不断调整策略，就像一位真正了解你的私人导师。
        </p>

        <h2>联系我们</h2>
        <p>
          有任何问题、建议或合作意向？欢迎随时联系：<a href="mailto:hello@studyai.app" className="text-purple-500 hover:text-purple-600">hello@studyai.app</a>
        </p>
      </article>

      <div className="mt-8 text-center">
        <Link href="/" className="text-sm text-purple-500 hover:text-purple-600 transition-colors">
          ← 返回首页
        </Link>
      </div>
    </div>
  )
}
