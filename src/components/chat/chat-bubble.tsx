"use client"

import type { ChatMessage } from "@/types/chat"
import { cn } from "@/lib/cn"
import { Brain, User, Target, ArrowUp } from "lucide-react"
import ReactMarkdown from "react-markdown"

interface ChatBubbleProps {
  message: ChatMessage
  isStreaming?: boolean
  isPlanMessage?: boolean
}

const PROSE_CLASSES = [
  "prose prose-sm dark:prose-invert max-w-none",
  "prose-headings:text-zinc-900 dark:prose-headings:text-white prose-headings:font-semibold",
  "prose-p:text-zinc-600 dark:prose-p:text-zinc-300",
  "prose-strong:text-zinc-900 dark:prose-strong:text-white",
  "prose-li:text-zinc-600 dark:prose-li:text-zinc-300",
  "prose-code:text-purple-600 dark:prose-code:text-purple-300",
  "prose-code:bg-black/5 dark:prose-code:bg-white/5 prose-code:px-1 prose-code:py-0.5 prose-code:rounded",
  "prose-table:border-separate prose-table:border-spacing-0",
  "prose-th:border-black/10 dark:prose-th:border-white/10 prose-th:bg-black/5 dark:prose-th:bg-white/5 prose-th:px-3 prose-th:py-2",
  "prose-td:border-black/5 dark:prose-td:border-white/5 prose-td:px-3 prose-td:py-2",
  "[&_table]:overflow-hidden [&_table]:rounded-lg [&_table]:border [&_table]:border-black/10 dark:[&_table]:border-white/10",
].join(" ")

export function ChatBubble({ message, isStreaming, isPlanMessage }: ChatBubbleProps) {
  const isUser = message.role === "user"

  return (
    <div className={cn("flex gap-3 px-4 py-4", isUser ? "justify-end" : "justify-start")}>
      {/* AI Avatar */}
      {!isUser && (
        <div className="flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-purple-600/20 flex items-center justify-center">
            <Brain className="h-4 w-4 text-purple-500 dark:text-purple-400" />
          </div>
        </div>
      )}

      {/* Message Content */}
      <div className={cn("max-w-[80%] min-w-0", isUser && "order-first")}>
        {/* Plan summary card (replaces full plan text in bubble) */}
        {isPlanMessage ? (
          <div className="rounded-2xl rounded-bl-md border border-purple-200/60 dark:border-purple-500/20 bg-gradient-to-br from-purple-50/90 to-white/80 dark:from-purple-950/30 dark:to-zinc-800/80 backdrop-blur-sm overflow-hidden">
            <div className="px-4 py-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-purple-600/15 dark:bg-purple-500/20 flex items-center justify-center">
                  <Target className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-purple-700 dark:text-purple-300">
                    学习计划已生成
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    AI 已根据你的情况完成个性化计划
                  </p>
                </div>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                详细计划已展示在页面顶部的「学习计划」分区中，包含阶段规划、每周安排、理论依据和实用建议。
                <span className="inline-flex items-center gap-1 text-purple-600 dark:text-purple-400 font-medium ml-1">
                  向上滚动查看 <ArrowUp className="h-3 w-3" />
                </span>
              </p>
            </div>
          </div>
        ) : (
          <div
            className={cn(
              "rounded-2xl px-4 py-3 text-sm leading-relaxed",
              isUser
                ? "bg-purple-600 text-white rounded-br-md"
                : "bg-black/[0.03] dark:bg-white/[0.03] border border-black/[0.05] dark:border-white/[0.05] text-zinc-700 dark:text-zinc-200 rounded-bl-md"
            )}
          >
            {isUser ? (
              <p className="whitespace-pre-wrap">{message.content}</p>
            ) : message.content ? (
              <div className={PROSE_CLASSES}>
                <ReactMarkdown>{message.content}</ReactMarkdown>
                {isStreaming && (
                  <span className="inline-block w-0.5 h-4 bg-purple-500 ml-0.5 align-text-bottom animate-pulse" />
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1 text-zinc-400 dark:text-zinc-500">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            )}
          </div>
        )}

        {/* Timestamp */}
        <p className={cn("text-[10px] text-zinc-400 dark:text-zinc-600 mt-1", isUser ? "text-right" : "text-left")}>
          {new Date(message.timestamp).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>

      {/* User Avatar */}
      {isUser && (
        <div className="flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-black/10 dark:bg-white/10 flex items-center justify-center">
            <User className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400" />
          </div>
        </div>
      )}
    </div>
  )
}
