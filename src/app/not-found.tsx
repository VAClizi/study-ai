"use client"

import Link from "next/link"
import { useT } from "@/lib/i18n"

export default function NotFoundPage() {
  const t = useT()

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex flex-col items-center justify-center px-4 text-center">
      <div className="w-20 h-20 rounded-2xl bg-purple-600/10 flex items-center justify-center mb-6">
        <span className="text-4xl font-bold text-purple-500">404</span>
      </div>
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-3">
        {t("error.notFound")}
      </h1>
      <p className="text-zinc-500 dark:text-zinc-400 max-w-md mb-8">
        {t("error.notFoundDesc")}
      </p>
      <div className="flex gap-3">
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium h-10 px-5 transition-all"
        >
          {t("error.backHome")}
        </Link>
        <Link
          href="/chat"
          className="inline-flex items-center justify-center rounded-lg border border-black/10 dark:border-white/10 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white text-sm font-medium h-10 px-5 transition-all"
        >
          {t("error.aiPlan")}
        </Link>
      </div>
    </div>
  )
}
