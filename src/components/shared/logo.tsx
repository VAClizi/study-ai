import Link from "next/link"
import { Brain } from "lucide-react"

interface LogoProps {
  size?: "sm" | "md" | "lg"
  showText?: boolean
}

export function Logo({ size = "md", showText = true }: LogoProps) {
  const sizes = { sm: "text-lg", md: "text-xl", lg: "text-3xl" }
  const iconSizes = { sm: "h-5 w-5", md: "h-6 w-6", lg: "h-9 w-9" }

  return (
    <Link href="/" className="flex items-center gap-2 group">
      <div className="relative">
        <div className="absolute inset-0 bg-purple-500/30 rounded-lg blur-md group-hover:bg-purple-500/50 transition-all" />
        <div className="relative bg-gradient-to-br from-purple-600 to-violet-700 rounded-lg p-1.5">
          <Brain className={`${iconSizes[size]} text-white`} />
        </div>
      </div>
      {showText && (
        <span className={`${sizes[size]} font-bold text-zinc-900 dark:text-white tracking-tight`}>
          Study<span className="text-purple-500 dark:text-purple-400">AI</span>
        </span>
      )}
    </Link>
  )
}
