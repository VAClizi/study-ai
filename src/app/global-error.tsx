"use client"

import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"
import { useT } from "@/lib/i18n"
import { useLanguageStore } from "@/stores/language-store"

export default function GlobalError({
  error: _error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const t = useT()
  const language = useLanguageStore((s) => s.language)

  return (
    <html lang={language}>
      <body className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a0f] text-zinc-100 px-4 text-center font-sans">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mb-6">
          <AlertTriangle className="h-8 w-8 text-red-400" />
        </div>
        <h1 className="text-xl font-bold mb-3">{t("error.criticalError")}</h1>
        <p className="text-sm text-zinc-400 max-w-md mb-6">
          {t("error.criticalErrorDesc")}
        </p>
        <Button
          onClick={reset}
          className="bg-purple-600 hover:bg-purple-700 text-white gap-2"
        >
          {t("error.refresh")}
        </Button>
      </body>
    </html>
  )
}
