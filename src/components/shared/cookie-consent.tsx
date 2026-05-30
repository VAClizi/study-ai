"use client"

import { useState, useEffect } from "react"
import { X } from "lucide-react"
import Link from "next/link"

const STORAGE_KEY = "studyai-cookie-consent"

export function CookieConsent() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) setVisible(true)
  }, [])

  function accept() {
    localStorage.setItem(STORAGE_KEY, "accepted")
    setVisible(false)
  }

  function decline() {
    localStorage.setItem(STORAGE_KEY, "declined")
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 sm:p-6 pointer-events-none">
      <div className="mx-auto max-w-3xl pointer-events-auto">
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl shadow-2xl p-4 sm:p-5">
          <div className="flex items-start gap-4">
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-1">
                本网站使用 Cookie
              </h3>
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                我们使用必要的 Cookie 维持登录状态和语言偏好，并使用 Vercel Analytics 收集匿名的页面访问统计数据以优化体验。不包含个人身份信息，不用于广告追踪。
                详情请查看我们的
                {" "}
                <Link
                  href="/privacy"
                  className="text-purple-600 dark:text-purple-400 underline hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
                >
                  隐私政策
                </Link>
                。
              </p>
            </div>
            <button
              onClick={decline}
              className="shrink-0 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              aria-label="关闭"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex items-center gap-2 mt-3 justify-end">
            <button
              onClick={decline}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              仅必要 Cookie
            </button>
            <button
              onClick={accept}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white transition-colors shadow-sm"
            >
              接受全部
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
