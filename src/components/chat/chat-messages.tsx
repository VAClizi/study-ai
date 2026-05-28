"use client"

import { useEffect, useRef } from "react"
import type { ChatMessage } from "@/types/chat"
import { ChatBubble } from "./chat-bubble"
import { AIThinkingSteps } from "./ai-thinking-steps"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useT } from "@/lib/i18n"

interface ChatMessagesProps {
  messages: ChatMessage[]
  isStreaming: boolean
  isThinking?: boolean
  planContent?: string | null
}

export function ChatMessages({ messages, isStreaming, isThinking, planContent }: ChatMessagesProps) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const t = useT()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isStreaming])

  const lastMsg = messages[messages.length - 1]
  const isAIGenerating = isStreaming && lastMsg?.role === "assistant" && !lastMsg.content

  /** Check if a message is the plan content (should show summary, not full text) */
  function isPlanMessage(msg: ChatMessage): boolean {
    return !!planContent && msg.role === "assistant" && msg.content === planContent
  }

  return (
    <ScrollArea className="flex-1 min-h-0">
      <div className="max-w-3xl mx-auto py-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-4">
            <div className="w-16 h-16 rounded-2xl bg-purple-600/10 flex items-center justify-center mb-4">
              <div className="w-8 h-8 rounded-lg bg-purple-600/20 flex items-center justify-center">
                <span className="text-purple-500 dark:text-purple-400 text-lg">?</span>
              </div>
            </div>
            <h3 className="text-lg font-medium text-zinc-600 dark:text-zinc-300 mb-2">{t("chat.startConversation")}</h3>
            <p className="text-sm text-zinc-400 dark:text-zinc-500 max-w-sm">
              {t("chat.emptyHint")}
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {messages.map((msg) => (
              <ChatBubble
                key={msg.id}
                message={msg}
                isStreaming={isStreaming && msg === lastMsg}
                isPlanMessage={isPlanMessage(msg)}
              />
            ))}

            {/* Simple thinking indicator when AI is generating */}
            <AIThinkingSteps isThinking={isAIGenerating || !!isThinking} />
          </div>
        )}

        <div ref={bottomRef} className="h-4" />
      </div>
    </ScrollArea>
  )
}
