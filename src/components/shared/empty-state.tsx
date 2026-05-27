import { ReactNode } from "react"
import { cn } from "@/lib/cn"
import { Inbox } from "lucide-react"

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description: string
  action?: ReactNode
  className?: string
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 px-4 text-center", className)}>
      <div className="w-16 h-16 rounded-2xl bg-black/5 dark:bg-white/5 flex items-center justify-center mb-4 text-zinc-400 dark:text-zinc-600">
        {icon || <Inbox className="h-8 w-8" />}
      </div>
      <h3 className="text-lg font-medium text-zinc-600 dark:text-zinc-300 mb-2">{title}</h3>
      <p className="text-sm text-zinc-400 dark:text-zinc-500 max-w-sm mb-6">{description}</p>
      {action}
    </div>
  )
}
