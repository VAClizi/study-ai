"use client"

import { useT } from "@/lib/i18n"

export function SkipToContent() {
  const t = useT()
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-lg focus:bg-purple-600 focus:text-white focus:text-sm focus:font-medium focus:outline-none"
    >
      {t("common.skipToContent")}
    </a>
  )
}
