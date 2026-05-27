"use client"

import { useState } from "react"
import { useAuthStore } from "@/stores/auth-store"
import { useLanguageStore, type Language } from "@/stores/language-store"
import { useAPIKeyStore, type LLMModel } from "@/stores/api-key-store"
import { usePersonaStore, type CoachPersona, PERSONAS } from "@/stores/persona-store"
import { useMemoryStore } from "@/stores/memory-store"
import { testConnection } from "@/services/llm"
import { useT } from "@/lib/i18n"
import { useTheme } from "@/hooks/use-theme"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { EmptyState } from "@/components/shared/empty-state"
import {
  User, Mail, Bell, Moon, Sun, Monitor, LogOut, Save, Globe,
  Clock, Shield, ChevronRight, Eye, EyeOff,
  Zap, Brain, Cpu, CheckCircle2, XCircle, Loader2, Trash2, FileText,
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/cn"

export default function SettingsPage() {
  const { user, isAuthenticated, logout, updateSettings } = useAuthStore()
  const { language, setLanguage } = useLanguageStore()
  const t = useT()
  const { theme, setTheme } = useTheme()

  // API Key
  const { apiKey, model, setApiKey, setModel, clearApiKey } = useAPIKeyStore()
  const [keyInput, setKeyInput] = useState(apiKey || "")
  const [showKey, setShowKey] = useState(false)
  const [testStatus, setTestStatus] = useState<"idle" | "testing" | "ok" | "fail">("idle")
  const [testError, setTestError] = useState("")

  // Persona
  const { persona, setPersona, quickCustomInstructions, detailedCustomInstructions, setQuickCustomInstructions, setDetailedCustomInstructions } = usePersonaStore()
  const [quickInput, setQuickInput] = useState(quickCustomInstructions)
  const [detailedInput, setDetailedInput] = useState(detailedCustomInstructions)
  const [instructionsTab, setInstructionsTab] = useState<"quick" | "detailed">("quick")
  const { clearAllMemories } = useMemoryStore()

  // Preferences state (persisted to localStorage)
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    if (typeof window === "undefined") return true
    return localStorage.getItem("studyai-notifications") !== "false"
  })
  const [weeklyGoalHours, setWeeklyGoalHours] = useState(() => {
    if (typeof window === "undefined") return 10
    return Number(localStorage.getItem("studyai-weekly-goal")) || 10
  })

  const toggleNotifications = () => {
    const next = !notificationsEnabled
    setNotificationsEnabled(next)
    localStorage.setItem("studyai-notifications", String(next))
  }

  const handleWeeklyGoalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Math.max(1, Math.min(40, Number(e.target.value) || 1))
    setWeeklyGoalHours(val)
    localStorage.setItem("studyai-weekly-goal", String(val))
  }

  // Profile
  const [name, setName] = useState(user?.name || "")
  const [email] = useState(user?.email || "")
  const [saved, setSaved] = useState(false)

  if (!isAuthenticated) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-4">
        <EmptyState
          title={t("settings.loginPrompt")}
          description={t("settings.loginPromptDesc")}
          action={
            <Link href="/login" className="inline-flex items-center justify-center rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium h-9 px-4 py-2 transition-all">
              {t("common.goLogin")}
            </Link>
          }
        />
      </div>
    )
  }

  const handleSaveProfile = async () => {
    await updateSettings({})
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleTestConnection = async () => {
    if (!keyInput.trim()) return
    setTestStatus("testing")
    setTestError("")
    const result = await testConnection(keyInput.trim())
    if (result.ok) {
      setTestStatus("ok")
      setApiKey(keyInput.trim())
    } else {
      setTestStatus("fail")
      setTestError(result.error || "Connection failed")
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleTestConnection()
  }

  const personaList: CoachPersona[] = ["strict", "gentle", "data-driven"]

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">{t("settings.title")}</h1>

      {/* Profile */}
      <Card className="border-black/[0.04] dark:border-white/[0.04] bg-black/[0.01] dark:bg-white/[0.01]">
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-purple-600/20 text-purple-500 dark:text-purple-400 text-xl">
                {user?.name?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-zinc-900 dark:text-white">{user?.name}</CardTitle>
              <CardDescription>{user?.email}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" />
              {t("login.username")}
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-black/[0.03] dark:bg-white/[0.03] border-black/[0.06] dark:border-white/[0.06] text-zinc-900 dark:text-white"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5" />
              {t("login.email")}
            </label>
            <Input
              value={email}
              disabled
              className="bg-black/[0.03] dark:bg-white/[0.03] border-black/[0.06] dark:border-white/[0.06] text-zinc-400 dark:text-zinc-500"
            />
          </div>
          <Button onClick={handleSaveProfile} className="gap-2 bg-purple-600 hover:bg-purple-700 text-white">
            {saved ? t("settings.saved") : t("settings.saveChanges")}
            <Save className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card className="border-black/[0.04] dark:border-white/[0.04] bg-black/[0.01] dark:bg-white/[0.01]">
        <CardHeader>
          <CardTitle className="text-zinc-900 dark:text-white text-lg">{t("settings.appearance")}</CardTitle>
          <CardDescription>{t("settings.chooseTheme")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: "dark", label: t("settings.dark"), icon: Moon, desc: t("settings.darkDesc") },
              { value: "light", label: t("settings.light"), icon: Sun, desc: t("settings.lightDesc") },
              { value: "system", label: t("settings.system"), icon: Monitor, desc: t("settings.systemDesc") },
            ].map((item) => (
              <button
                key={item.value}
                onClick={() => setTheme(item.value as "dark" | "light" | "system")}
                className={cn(
                  "flex flex-col items-center gap-2 p-4 rounded-xl border transition-all",
                  theme === item.value
                    ? "border-purple-500/30 bg-purple-600/10 text-zinc-900 dark:text-white"
                    : "border-black/[0.04] dark:border-white/[0.04] bg-black/[0.02] dark:bg-white/[0.02] text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:border-black/10 dark:hover:border-white/10",
                )}
              >
                <item.icon className="h-5 w-5" />
                <span className="text-sm font-medium">{item.label}</span>
                <span className="text-[10px] text-zinc-500">{item.desc}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* AI Coach Personality */}
      <Card className="border-black/[0.04] dark:border-white/[0.04] bg-black/[0.01] dark:bg-white/[0.01]">
        <CardHeader>
          <CardTitle className="text-zinc-900 dark:text-white text-lg flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-500" />
            AI 教练人格
          </CardTitle>
          <CardDescription>选择与你最匹配的 AI 教练风格</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {personaList.map((pid) => {
              const p = PERSONAS[pid]
              return (
                <button
                  key={pid}
                  onClick={() => setPersona(pid)}
                  className={cn(
                    "flex flex-col items-center gap-3 p-4 rounded-xl border transition-all text-left",
                    persona === pid
                      ? "border-purple-500/30 bg-purple-600/10"
                      : "border-black/[0.04] dark:border-white/[0.04] bg-black/[0.02] dark:bg-white/[0.02] hover:border-purple-500/20 hover:bg-purple-50/50 dark:hover:bg-purple-500/5",
                  )}
                >
                  <span className="text-2xl">{p.icon}</span>
                  <div className="text-center">
                    <p className={cn(
                      "text-sm font-semibold mb-1",
                      persona === pid ? "text-purple-600 dark:text-purple-400" : "text-zinc-900 dark:text-white",
                    )}>
                      {p.name[language]}
                    </p>
                    <p className="text-[11px] text-zinc-400 dark:text-zinc-500 leading-relaxed">
                      {p.description[language]}
                    </p>
                  </div>
                  {persona === pid && (
                    <Badge className="bg-purple-600/20 text-purple-500 dark:text-purple-400 border-purple-500/20 text-[10px]">
                      当前
                    </Badge>
                  )}
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* AI Model Configuration */}
      <Card className="border-black/[0.04] dark:border-white/[0.04] bg-black/[0.01] dark:bg-white/[0.01]">
        <CardHeader>
          <CardTitle className="text-zinc-900 dark:text-white text-lg flex items-center gap-2">
            <Cpu className="h-5 w-5 text-purple-500" />
            AI 模型配置
          </CardTitle>
          <CardDescription>配置 DeepSeek API 以启用 AI 对话能力</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Model selector */}
          <div className="space-y-2">
            <label className="text-sm text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5" />
              模型选择
            </label>
            <div className="grid grid-cols-2 gap-2">
              {([
                { value: "deepseek-chat" as LLMModel, label: "DeepSeek Chat", desc: "通用对话，快速响应" },
                { value: "deepseek-reasoner" as LLMModel, label: "DeepSeek Reasoner", desc: "深度推理，适合规划" },
              ]).map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setModel(opt.value)}
                  className={cn(
                    "flex flex-col items-center gap-1 p-3 rounded-xl border transition-all text-center",
                    model === opt.value
                      ? "border-purple-500/30 bg-purple-600/10"
                      : "border-black/[0.04] dark:border-white/[0.04] bg-black/[0.02] dark:bg-white/[0.02] hover:border-purple-500/20",
                  )}
                >
                  <span className={cn(
                    "text-sm font-medium",
                    model === opt.value ? "text-purple-600 dark:text-purple-400" : "text-zinc-900 dark:text-white",
                  )}>
                    {opt.label}
                  </span>
                  <span className="text-[10px] text-zinc-400 dark:text-zinc-500">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* API Key */}
          <div className="space-y-2">
            <label className="text-sm text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5" />
              API Key
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  type={showKey ? "text" : "password"}
                  value={keyInput}
                  onChange={(e) => {
                    setKeyInput(e.target.value)
                    if (testStatus !== "idle") setTestStatus("idle")
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="sk-..."
                  className="bg-black/[0.03] dark:bg-white/[0.03] border-black/[0.06] dark:border-white/[0.06] text-zinc-900 dark:text-white pr-9 font-mono text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                >
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <Button
                size="sm"
                onClick={handleTestConnection}
                disabled={!keyInput.trim() || testStatus === "testing"}
                className={cn(
                  "gap-1.5 shrink-0",
                  testStatus === "ok"
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                    : "bg-purple-600 hover:bg-purple-700 text-white",
                )}
              >
                {testStatus === "testing" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {testStatus === "ok" && <CheckCircle2 className="h-3.5 w-3.5" />}
                {testStatus === "fail" && <XCircle className="h-3.5 w-3.5" />}
                {testStatus === "idle" && <Zap className="h-3.5 w-3.5" />}
                {testStatus === "testing" ? "测试中..." : testStatus === "ok" ? "已连接" : testStatus === "fail" ? "重试" : "测试连接"}
              </Button>
            </div>

            {/* Status messages */}
            {testStatus === "ok" && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                API 连接成功，AI 对话已就绪
              </p>
            )}
            {testStatus === "fail" && (
              <p className="text-xs text-red-500 dark:text-red-400 flex items-center gap-1">
                <XCircle className="h-3 w-3" />
                {testError || "连接失败，请检查 API Key"}
              </p>
            )}
            {apiKey && testStatus !== "ok" && (
              <div className="flex items-center gap-2">
                <Badge className="bg-purple-600/10 text-purple-500 dark:text-purple-400 border-purple-500/20 text-[10px]">
                  已保存
                </Badge>
                <button
                  onClick={() => { clearApiKey(); setKeyInput(""); setTestStatus("idle") }}
                  className="text-xs text-zinc-400 dark:text-zinc-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                >
                  清除 Key
                </button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Custom AI Instructions */}
      <Card className="border-purple-500/10 dark:border-purple-500/15 bg-purple-600/[0.01] dark:bg-purple-500/[0.02]">
        <CardHeader>
          <CardTitle className="text-zinc-900 dark:text-white text-lg flex items-center gap-2">
            <FileText className="h-5 w-5 text-purple-500 dark:text-purple-400" />
            自定义 AI 指令
          </CardTitle>
          <CardDescription>
            分别为两种定制模式编写系统提示词。留空则使用教练人格预设。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Tab switcher */}
          <div className="flex items-center gap-1 bg-black/[0.03] dark:bg-white/[0.03] rounded-lg p-0.5">
            <button
              onClick={() => setInstructionsTab("quick")}
              className={cn(
                "flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                instructionsTab === "quick"
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white",
              )}
            >
              快速定制
            </button>
            <button
              onClick={() => setInstructionsTab("detailed")}
              className={cn(
                "flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                instructionsTab === "detailed"
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white",
              )}
            >
              深度规划
            </button>
          </div>

          {/* Quick mode instructions */}
          {instructionsTab === "quick" && (
            <div className="space-y-2">
              <textarea
                value={quickInput}
                onChange={(e) => setQuickInput(e.target.value)}
                rows={7}
                placeholder={`「快速定制」模式的自定义提示词，例如：

快速了解用户目标，3-5 轮对话内给出精简计划。
重点是：
- 抓住核心需求，不展开追问
- 输出 500 字以内的可执行方案
- 格式清晰：目标 → 任务 → 检验节点`}
                className="w-full bg-black/[0.03] dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.06] rounded-xl px-4 py-3 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 resize-y min-h-[150px] focus:outline-none focus:border-purple-500/30 dark:focus:border-purple-500/40 focus:ring-1 focus:ring-purple-500/20 transition-colors font-mono"
              />
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
                  {quickInput ? `${quickInput.length} 字符` : quickCustomInstructions ? "已保存" : "未设置 — 将使用教练人格预设"}
                </span>
                <div className="flex items-center gap-2">
                  {quickInput && (
                    <button
                      onClick={() => { setQuickInput(""); setQuickCustomInstructions("") }}
                      className="text-xs text-zinc-400 dark:text-zinc-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                    >
                      清除
                    </button>
                  )}
                  <Button
                    size="sm"
                    onClick={() => setQuickCustomInstructions(quickInput)}
                    disabled={quickInput === quickCustomInstructions}
                    className="gap-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs"
                  >
                    <Save className="h-3 w-3" />
                    {quickInput === quickCustomInstructions ? "已保存" : "保存"}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Detailed mode instructions */}
          {instructionsTab === "detailed" && (
            <div className="space-y-2">
              <textarea
                value={detailedInput}
                onChange={(e) => setDetailedInput(e.target.value)}
                rows={10}
                placeholder={`「深度规划」模式的自定义提示词，例如：

全方位分析用户的学习背景、习惯和障碍，制定系统化的长期方案。

你需要做到：
- 多轮深入追问，不急于给结论
- 挖掘用户自己未意识到的模式和问题
- 输出包含：阶段目标、每周分解、每日结构、认知理论支撑
- 每个安排说明「为什么」
- 用科学理论支撑你的建议（间隔重复、深度工作、刻意练习等）`}
                className="w-full bg-black/[0.03] dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.06] rounded-xl px-4 py-3 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 resize-y min-h-[180px] focus:outline-none focus:border-purple-500/30 dark:focus:border-purple-500/40 focus:ring-1 focus:ring-purple-500/20 transition-colors font-mono"
              />
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
                  {detailedInput ? `${detailedInput.length} 字符` : detailedCustomInstructions ? "已保存" : "未设置 — 将使用教练人格预设"}
                </span>
                <div className="flex items-center gap-2">
                  {detailedInput && (
                    <button
                      onClick={() => { setDetailedInput(""); setDetailedCustomInstructions("") }}
                      className="text-xs text-zinc-400 dark:text-zinc-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                    >
                      清除
                    </button>
                  )}
                  <Button
                    size="sm"
                    onClick={() => setDetailedCustomInstructions(detailedInput)}
                    disabled={detailedInput === detailedCustomInstructions}
                    className="gap-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs"
                  >
                    <Save className="h-3 w-3" />
                    {detailedInput === detailedCustomInstructions ? "已保存" : "保存"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card className="border-black/[0.04] dark:border-white/[0.04] bg-black/[0.01] dark:bg-white/[0.01]">
        <CardHeader>
          <CardTitle className="text-zinc-900 dark:text-white text-lg">{t("settings.preferences")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Notifications */}
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-black/[0.03] dark:bg-white/[0.03] flex items-center justify-center">
                <Bell className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
              </div>
              <div>
                <p className="text-sm text-zinc-900 dark:text-white">{t("settings.notifications")}</p>
                <p className="text-xs text-zinc-400 dark:text-zinc-500">{t("settings.notificationsDesc")}</p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={notificationsEnabled}
              onClick={toggleNotifications}
              className={cn(
                "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200",
                notificationsEnabled ? "bg-purple-600" : "bg-black/[0.08] dark:bg-white/[0.08]"
              )}
            >
              <span
                className={cn(
                  "pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm ring-0 transition-transform duration-200",
                  notificationsEnabled ? "translate-x-4" : "translate-x-0"
                )}
              />
            </button>
          </div>

          {/* Language */}
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-black/[0.03] dark:bg-white/[0.03] flex items-center justify-center">
                <Globe className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
              </div>
              <div>
                <p className="text-sm text-zinc-900 dark:text-white">{t("settings.language")}</p>
                <p className="text-xs text-zinc-400 dark:text-zinc-500">
                  {language === "zh-CN" ? t("settings.chinese") : t("settings.english")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 bg-black/[0.03] dark:bg-white/[0.03] rounded-lg p-0.5">
              {(["zh-CN", "en"] as Language[]).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setLanguage(lang)}
                  className={cn(
                    "px-2.5 py-1 rounded-md text-xs font-medium transition-all",
                    language === lang
                      ? "bg-purple-600 text-white shadow-sm"
                      : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white",
                  )}
                >
                  {lang === "zh-CN" ? "中文" : "EN"}
                </button>
              ))}
            </div>
          </div>

          {/* Weekly Goal */}
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-black/[0.03] dark:bg-white/[0.03] flex items-center justify-center">
                <Clock className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
              </div>
              <div>
                <p className="text-sm text-zinc-900 dark:text-white">{t("settings.weeklyGoal")}</p>
                <p className="text-xs text-zinc-400 dark:text-zinc-500">{t("settings.weeklyGoalDesc")}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={40}
                value={weeklyGoalHours}
                onChange={handleWeeklyGoalChange}
                className="w-14 h-8 rounded-lg bg-black/[0.03] dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.06] text-center text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-purple-500/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <span className="text-xs text-zinc-400 dark:text-zinc-500">小时/周</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Memory Management */}
      <Card className="border-black/[0.04] dark:border-white/[0.04] bg-black/[0.01] dark:bg-white/[0.01]">
        <CardHeader>
          <CardTitle className="text-zinc-900 dark:text-white text-lg flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-500" />
            AI 记忆管理
          </CardTitle>
          <CardDescription>AI 对你的了解都存储在这里。清除记忆会让 AI 忘记你的学习偏好和历史。</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            onClick={clearAllMemories}
            className="border-red-500/20 text-red-400 hover:bg-red-500/10 hover:text-red-300 gap-2"
          >
            <Trash2 className="h-4 w-4" />
            清除所有 AI 记忆
          </Button>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-500/10 bg-red-500/[0.01]">
        <CardHeader>
          <CardTitle className="text-red-400 text-lg">{t("settings.dangerZone")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            onClick={() => logout()}
            className="border-red-500/20 text-red-400 hover:bg-red-500/10 hover:text-red-300 gap-2"
          >
            <LogOut className="h-4 w-4" />
            {t("settings.logout")}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
