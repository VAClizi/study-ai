import { LoadingSpinner } from "@/components/shared/loading-spinner"

export default function PlanDetailLoading() {
  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center">
      <LoadingSpinner size="lg" text="加载计划详情..." />
    </div>
  )
}
