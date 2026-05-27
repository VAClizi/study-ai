"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

interface ErrorPageProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error("App error boundary caught:", error)
  }, [error])

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex flex-col items-center justify-center px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mb-6">
        <AlertTriangle className="h-8 w-8 text-red-400" />
      </div>
      <h1 className="text-xl font-bold text-zinc-900 dark:text-white mb-3">
        出了点问题
      </h1>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-md mb-6">
        页面加载时发生了意外错误，请尝试刷新页面。
      </p>
      <Button onClick={reset} className="bg-purple-600 hover:bg-purple-700 text-white gap-2">
        重试
      </Button>
      {process.env.NODE_ENV === "development" && (
        <pre className="mt-8 max-w-lg text-left text-xs text-red-400 bg-red-500/5 rounded-lg p-4 overflow-auto">
          {error.message}
          {"\n"}
          {error.stack}
        </pre>
      )}
    </div>
  )
}
