"use client"
import { useAppInit } from "@/hooks/use-app-init"
import { LoadingSpinner } from "@/components/shared/loading-spinner"

export function AppInitializer({ children }: { children: React.ReactNode }) {
  const ready = useAppInit()
  if (!ready) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center">
        <LoadingSpinner size="lg" text="加载中..." />
      </div>
    )
  }
  return <>{children}</>
}
