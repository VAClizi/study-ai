"use client"

import Link from "next/link"
import { Logo } from "@/components/shared/logo"
import { useT } from "@/lib/i18n"

const footerLinkGroups = [
  {
    i18nKey: "footer.product",
    links: [
      { i18nKey: "nav.aiPlan", href: "/chat" },
      { i18nKey: "nav.myPlans", href: "/plans" },
      { i18nKey: "nav.todayTasks", href: "/today" },
      { i18nKey: "nav.dashboard", href: "/dashboard" },
    ],
  },
  {
    i18nKey: "footer.about",
    links: [
      { i18nKey: "footer.aboutUs", href: "/about" },
      { i18nKey: "footer.terms", href: "/terms" },
      { i18nKey: "footer.privacy", href: "/privacy" },
      { i18nKey: "footer.contact", href: "mailto:3427400856@qq.com" },
    ],
  },
]

export function Footer() {
  const t = useT()

  return (
    <footer className="border-t border-black/[0.04] dark:border-white/[0.04] bg-white/60 dark:bg-[#0a0a0f]/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col gap-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8">
            <div>
              <Logo size="sm" showText />
              <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-500 leading-relaxed">
                {t("footer.tagline")}
              </p>
            </div>
            {footerLinkGroups.map((group) => (
              <div key={group.i18nKey}>
                <h4 className="text-sm font-semibold text-zinc-900 dark:text-white mb-3">
                  {t(group.i18nKey)}
                </h4>
                <ul className="space-y-2">
                  {group.links.map((link) => (
                    <li key={link.href}>
                      {link.href.startsWith("/") ? (
                        <Link
                          href={link.href}
                          className="text-xs text-zinc-500 dark:text-zinc-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                        >
                          {t(link.i18nKey)}
                        </Link>
                      ) : (
                        <a
                          href={link.href}
                          className="text-xs text-zinc-500 dark:text-zinc-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                        >
                          {t(link.i18nKey)}
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
                {t("footer.terms")}
              </Link>
              <Link href="/privacy" className="text-zinc-400 dark:text-zinc-600 hover:text-zinc-600 dark:hover:text-zinc-400 transition-colors">
                {t("footer.privacy")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
