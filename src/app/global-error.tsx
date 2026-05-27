"use client"

import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a0f] text-zinc-100 px-4 text-center font-sans">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mb-6">
          <AlertTriangle className="h-8 w-8 text-red-400" />
        </div>
        <h1 className="text-xl font-bold mb-3">严重错误</h1>
        <p className="text-sm text-zinc-400 max-w-md mb-6">
          应用遇到了一个严重错误，请尝试刷新页面。如果问题持续，请联系我们。
        </p>
        <Button
          onClick={reset}
          className="bg-purple-600 hover:bg-purple-700 text-white gap-2"
        >
          刷新页面
        </Button>
      </body>
    </html>
  )
}
