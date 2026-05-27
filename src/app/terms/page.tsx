import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "服务条款",
  description: "StudyAI 服务条款和使用协议",
}

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <article className="prose prose-zinc dark:prose-invert max-w-none">
        <h1>服务条款</h1>
        <p className="text-sm text-zinc-400">最后更新：2026年5月</p>

        <h2>1. 接受条款</h2>
        <p>
          使用 StudyAI（以下简称"本服务"），即表示您同意遵守本服务条款。如果您不同意这些条款，请勿使用本服务。
        </p>

        <h2>2. 服务描述</h2>
        <p>
          StudyAI 是一个基于人工智能的学习规划与自律成长平台，提供个性化学习计划生成、学习进度追踪和数据分析服务。
        </p>

        <h2>3. 用户责任</h2>
        <ul>
          <li>您需对使用本服务时提供的所有信息的准确性负责。</li>
          <li>您需妥善保管您的账号和密码。</li>
          <li>您不得利用本服务从事任何违法或不当活动。</li>
        </ul>

        <h2>4. AI 生成内容声明</h2>
        <p>
          本服务使用人工智能生成学习计划和建议，这些内容仅供参考。AI 生成的内容可能存在不准确之处，用户应结合自身情况进行判断。
        </p>

        <h2>5. 服务可用性</h2>
        <p>
          我们尽力确保服务的稳定运行，但不对服务的中断或终止承担责任。我们保留随时修改或终止服务的权利。
        </p>

        <h2>6. 知识产权</h2>
        <p>
          StudyAI 的名称、标识、界面设计和代码均受知识产权法保护。用户生成的学习计划内容归用户所有。
        </p>

        <h2>7. 联系我们</h2>
        <p>
          如对本条款有任何疑问，请联系：<a href="mailto:hello@studyai.app" className="text-purple-500 hover:text-purple-600">hello@studyai.app</a>
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
