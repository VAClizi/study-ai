import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "隐私政策",
  description: "StudyAI 隐私政策，我们如何收集和使用你的数据",
}

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <article className="prose prose-zinc dark:prose-invert max-w-none">
        <h1>隐私政策</h1>
        <p className="text-sm text-zinc-400">最后更新：2026年5月</p>

        <h2>1. 我们收集的信息</h2>
        <ul>
          <li><strong>账号信息：</strong>邮箱地址、用户名。</li>
          <li><strong>使用数据：</strong>学习计划内容、学习进度、打卡记录。</li>
          <li><strong>偏好设置：</strong>语言偏好、主题设置、AI 教练人格偏好。</li>
        </ul>

        <h2>2. 信息的使用方式</h2>
        <p>我们收集的信息用于：</p>
        <ul>
          <li>生成个性化的学习计划和内容推荐</li>
          <li>追踪学习进度并提供数据分析</li>
          <li>改进和优化服务质量</li>
        </ul>

        <h2>3. 数据存储</h2>
        <p>
          您的数据存储在浏览器的本地存储（localStorage）中。部分数据（如 AI API 密钥）仅保存在您的设备上，不会上传到我们的服务器。
        </p>

        <h2>4. 第三方服务</h2>
        <p>
          本服务可能使用以下第三方服务：
        </p>
        <ul>
          <li><strong>DeepSeek API：</strong>用于提供 AI 对话和计划生成功能</li>
          <li><strong>Vercel Analytics：</strong>用于匿名网站访问统计</li>
        </ul>

        <h2>5. Cookie 使用</h2>
        <p>
          我们使用必要的 Cookie 来维持登录状态和用户偏好。不使用跟踪 Cookie 进行广告投放。
        </p>

        <h2>6. 您的权利</h2>
        <p>
          您可以随时查看、修改或删除您的个人信息。清除浏览器数据将删除所有本地存储的学习数据。
        </p>

        <h2>7. 联系我们</h2>
        <p>
          如对隐私政策有任何疑问，请联系：<a href="mailto:hello@studyai.app" className="text-purple-500 hover:text-purple-600">hello@studyai.app</a>
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
