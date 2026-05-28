"use client"

import type { PlanTheory } from "@/types/plan"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { useState } from "react"
import { ChevronDown, Brain, BookOpen, Clock, Zap, Layers, Sun, Repeat, Lightbulb } from "lucide-react"
import { useT, useTF } from "@/lib/i18n"

interface TheoryPanelProps {
  theories: PlanTheory[]
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  brain: Brain,
  book: BookOpen,
  timer: Clock,
  zap: Zap,
  layers: Layers,
  sunrise: Sun,
  repeat: Repeat,
  focus: Brain,
}

export function TheoryPanel({ theories }: TheoryPanelProps) {
  const [isOpen, setIsOpen] = useState(false)
  const t = useT()
  const tf = useTF()

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="border-black/[0.04] dark:border-white/[0.04] bg-black/[0.01] dark:bg-white/[0.01]">
        <CardHeader className="pb-2">
          <CollapsibleTrigger className="flex items-center justify-between w-full text-left group">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-purple-500 dark:text-purple-400" />
              <CardTitle className="text-base text-zinc-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-300 transition-colors">
                {t("theory.basis")}
              </CardTitle>
              <Badge className="bg-purple-600/20 text-purple-600 dark:text-purple-300 text-xs">
                {tf("planDetail.theoryCount", { count: theories.length })}
              </Badge>
            </div>
            <ChevronDown className="h-4 w-4 text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-900 dark:group-hover:text-white transition-all data-[state=open]:rotate-180" />
          </CollapsibleTrigger>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="pt-0 pb-4">
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
              {t("theory.desc")}
            </p>
            <div className="space-y-3">
              {theories.map((theory, i) => {
                const Icon = iconMap[theory.icon] || Brain
                return (
                  <div
                    key={i}
                    className="flex gap-3 p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.04] dark:border-white/[0.04]"
                  >
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-purple-600/10 flex items-center justify-center">
                      <Icon className="h-4 w-4 text-purple-500 dark:text-purple-400" />
                    </div>
                    <div>
                      <h5 className="text-sm font-medium text-zinc-900 dark:text-white">{theory.name}</h5>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{theory.description}</p>
                      <p className="text-xs text-purple-500/80 dark:text-purple-400/70 mt-1">
                        {t("theory.application")}：{theory.application}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}
