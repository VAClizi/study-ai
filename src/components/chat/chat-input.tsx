"use client"

import { useState, useRef, useEffect, KeyboardEvent } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Send, Loader2 } from "lucide-react"
import { cn } from "@/lib/cn"
import { useT } from "@/lib/i18n"

interface ChatInputProps {
  onSend: (message: string) => void
  isStreaming: boolean
  disabled?: boolean
  placeholder?: string
}

export function ChatInput({ onSend, isStreaming, disabled, placeholder }: ChatInputProps) {
  const [value, setValue] = useState("")
  const [isFocused, setIsFocused] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const t = useT()
  const defaultPlaceholder = placeholder || t("chatInput.placeholder")

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + "px"
    }
  }, [value])

  const handleSend = () => {
    if (!value.trim() || isStreaming || disabled) return
    onSend(value.trim())
    setValue("")
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
    }
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const canSend = value.trim() && !isStreaming && !disabled

  return (
    <div className="border-t border-black/[0.04] dark:border-white/[0.04] bg-white/80 dark:bg-[#0a0a0f]/80 backdrop-blur-xl p-4">
      <div className="max-w-3xl mx-auto">
        <div
          className={cn(
            "relative flex items-end gap-2 bg-black/[0.03] dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.06] rounded-2xl p-2 transition-all duration-300",
            isFocused && "border-purple-500/30 animate-input-glow-pulse",
          )}
        >
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={defaultPlaceholder}
            disabled={isStreaming || disabled}
            rows={1}
            className="flex-1 bg-transparent border-0 resize-none text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus-visible:ring-0 focus-visible:ring-offset-0 min-h-[40px] max-h-[200px] py-2 px-2"
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!canSend}
            className={cn(
              "flex-shrink-0 rounded-xl h-9 w-9 transition-all duration-300",
              canSend
                ? "bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-600/25 hover:shadow-purple-600/40 hover:scale-105 active:scale-95"
                : "bg-black/5 dark:bg-white/5 text-zinc-400 dark:text-zinc-600"
            )}
          >
            {isStreaming ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="text-[10px] text-zinc-400 dark:text-zinc-600 text-center mt-2">
          {t("chatInput.keyboardHint")}
        </p>
      </div>
    </div>
  )
}
