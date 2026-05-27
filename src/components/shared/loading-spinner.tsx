import { Loader2 } from "lucide-react"
import { cn } from "@/lib/cn"

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg"
  className?: string
  text?: string
}

export function LoadingSpinner({ size = "md", className, text }: LoadingSpinnerProps) {
  const sizes = { sm: "h-4 w-4", md: "h-8 w-8", lg: "h-12 w-12" }

  return (
    <div className={cn("flex flex-col items-center justify-center gap-3", className)}>
      <div className="relative">
        <div className="absolute inset-0 bg-purple-500/20 rounded-full blur-xl animate-pulse" />
        <Loader2 className={cn(sizes[size], "text-purple-500 dark:text-purple-400 animate-spin relative z-10")} />
      </div>
      {text && <p className="text-sm text-zinc-400 dark:text-zinc-500 animate-pulse">{text}</p>}
    </div>
  )
}
