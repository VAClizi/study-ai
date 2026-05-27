import Link from "next/link"
import { Logo } from "@/components/shared/logo"

const footerLinks = [
  {
    title: "产品",
    links: [
      { label: "AI 规划", href: "/chat" },
      { label: "我的计划", href: "/plans" },
      { label: "今日任务", href: "/today" },
      { label: "数据面板", href: "/dashboard" },
    ],
  },
  {
    title: "关于",
    links: [
      { label: "关于我们", href: "/about" },
      { label: "服务条款", href: "/terms" },
      { label: "隐私政策", href: "/privacy" },
      { label: "联系我们", href: "mailto:hello@studyai.app" },
    ],
  },
]

export function Footer() {
  return (
    <footer className="border-t border-black/[0.04] dark:border-white/[0.04] bg-white/60 dark:bg-[#0a0a0f]/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col gap-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8">
            <div>
              <Logo size="sm" showText />
              <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-500 leading-relaxed">
                AI驱动的智能学习规划与自律成长平台。科学规划，而非盲目努力。
              </p>
            </div>
            {footerLinks.map((group) => (
              <div key={group.title}>
                <h4 className="text-sm font-semibold text-zinc-900 dark:text-white mb-3">
                  {group.title}
                </h4>
                <ul className="space-y-2">
                  {group.links.map((link) => (
                    <li key={link.href}>
                      {link.href.startsWith("/") ? (
                        <Link
                          href={link.href}
                          className="text-xs text-zinc-500 dark:text-zinc-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                        >
                          {link.label}
                        </Link>
                      ) : (
                        <a
                          href={link.href}
                          className="text-xs text-zinc-500 dark:text-zinc-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                        >
                          {link.label}
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="border-t border-black/[0.04] dark:border-white/[0.04] pt-6 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-[11px] text-zinc-400 dark:text-zinc-600">
              &copy; {new Date().getFullYear()} StudyAI. All rights reserved.
            </p>
            <div className="flex items-center gap-4 text-[11px]">
              <Link href="/terms" className="text-zinc-400 dark:text-zinc-600 hover:text-zinc-600 dark:hover:text-zinc-400 transition-colors">
                服务条款
              </Link>
              <Link href="/privacy" className="text-zinc-400 dark:text-zinc-600 hover:text-zinc-600 dark:hover:text-zinc-400 transition-colors">
                隐私政策
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
