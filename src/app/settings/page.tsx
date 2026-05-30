"use client"

import { useState, useEffect } from "react"
import { useAuthStore } from "@/stores/auth-store"
import { useLanguageStore, type Language } from "@/stores/language-store"
import { usePersonaStore, type CoachPersona, PERSONAS } from "@/stores/persona-store"
import { useMemoryStore } from "@/stores/memory-store"
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
  Clock, Brain, Trash2,
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/cn"

export default function SettingsPage() {
  const { user, isAuthenticated, logout, updateSettings } = useAuthStore()
  const { language, setLanguage } = useLanguageStore()
  const t = useT()
  const { theme, setTheme } = useTheme()

  // Persona
  const { persona, setPersona } = usePersonaStore()
  const { clearAllMemories } = useMemoryStore()

  // Preferences state (loaded from API)
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [weeklyGoalHours, setWeeklyGoalHours] = useState(10)

  useEffect(() => {
    fetch("/api/user/settings")
      .then((r) => r.json())
      .then((s) => {
        if (s.notifications !== undefined) setNotificationsEnabled(s.notifications)
        if (s.weeklyGoal !== undefined) setWeeklyGoalHours(Number(s.weeklyGoal))
      })
      .catch(() => {})
  }, [])

  const toggleNotifications = () => {
    const next = !notificationsEnabled
    setNotificationsEnabled(next)
    fetch("/api/user/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notifications: next }),
    }).catch(() => {})
  }

  const handleWeeklyGoalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Math.max(1, Math.min(40, Number(e.target.value) || 1))
    setWeeklyGoalHours(val)
    fetch("/api/user/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ weeklyGoal: val }),
    }).catch(() => {})
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
    await updateSettings({ name })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const personaList: CoachPersona[] = ["strict", "gentle", "data-driven"]

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-white animate-fade-in-up">{t("settings.title")}</h1>

      {/* Profile */}
      <Card className="border-black/[0.04] dark:border-white/[0.04] bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm animate-stagger-1">
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
      <Card className="border-black/[0.04] dark:border-white/[0.04] bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm animate-stagger-2">
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
      <Card className="border-black/[0.04] dark:border-white/[0.04] bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm animate-stagger-3">
        <CardHeader>
          <CardTitle className="text-zinc-900 dark:text-white text-lg flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-500" />
            {t("settings.aiCoachPersona")}
          </CardTitle>
          <CardDescription>{t("settings.aiCoachPersonaDesc")}</CardDescription>
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
                      {t("settings.current")}
                    </Badge>
                  )}
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card className="border-black/[0.04] dark:border-white/[0.04] bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm animate-stagger-4">
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
              <span className="text-xs text-zinc-400 dark:text-zinc-500">{t("settings.hoursPerWeek")}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Memory Management */}
      <Card className="border-black/[0.04] dark:border-white/[0.04] bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm animate-stagger-5">
        <CardHeader>
          <CardTitle className="text-zinc-900 dark:text-white text-lg flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-500" />
            {t("settings.aiMemory")}
          </CardTitle>
          <CardDescription>{t("settings.aiMemoryDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            onClick={clearAllMemories}
            className="border-red-500/20 text-red-400 hover:bg-red-500/10 hover:text-red-300 gap-2"
          >
            <Trash2 className="h-4 w-4" />
            {t("settings.clearMemory")}
          </Button>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-500/10 bg-red-500/[0.01] animate-stagger-6">
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
