"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/stores/auth-store"
import { Logo } from "@/components/shared/logo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Mail, Lock, User, ArrowRight, Loader2 } from "lucide-react"
import Link from "next/link"
import { useT, useTF } from "@/lib/i18n"

export default function LoginPage() {
  const router = useRouter()
  const t = useT()
  const tf = useTF()
  const { login, register, loginWithGoogle, isAuthenticated } = useAuthStore()

  const [mode, setMode] = useState<"login" | "register">("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // 如果已登录，跳转首页
  if (isAuthenticated) {
    router.push("/chat")
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      if (mode === "login") {
        await login(email, password)
      } else {
        await register(email, password, name)
      }
      router.push("/chat")
    } catch {
      setError(t("login.loginFailed"))
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setLoading(true)
    try {
      await loginWithGoogle()
      router.push("/chat")
    } catch {
      setError(t("login.googleFailed"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-4 py-12">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-purple-600/8 rounded-full blur-[120px]" />
      </div>

      <Card className="w-full max-w-md border-black/[0.06] dark:border-white/[0.06] bg-white/80 dark:bg-[#0a0a0f]/80 backdrop-blur-xl">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <Logo size="lg" showText={false} />
          </div>
          <CardTitle className="text-2xl text-zinc-900 dark:text-white">
            {mode === "login" ? t("login.welcomeBack") : t("login.createAccount")}
          </CardTitle>
          <CardDescription className="text-zinc-400 dark:text-zinc-500">
            {mode === "login" ? t("login.desc") : t("login.createDesc")}
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-4">
          <Tabs value={mode} onValueChange={(v) => setMode(v as "login" | "register")}>
            <TabsList className="w-full bg-black/[0.03] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.04]">
              <TabsTrigger value="login" className="flex-1 data-[state=active]:bg-black/[0.06] dark:data-[state=active]:bg-white/[0.06]">
                {t("login.login")}
              </TabsTrigger>
              <TabsTrigger value="register" className="flex-1 data-[state=active]:bg-black/[0.06] dark:data-[state=active]:bg-white/[0.06]">
                {t("login.register")}
              </TabsTrigger>
            </TabsList>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {mode === "register" && (
                <div className="space-y-2">
                  <label htmlFor="login-name" className="text-sm text-zinc-500 dark:text-zinc-400">{t("login.username")}</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                    <Input
                      id="login-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={t("login.namePlaceholder")}
                      className="pl-10 bg-black/[0.03] dark:bg-white/[0.03] border-black/[0.06] dark:border-white/[0.06] text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="login-email" className="text-sm text-zinc-500 dark:text-zinc-400">{t("login.email")}</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 dark:text-zinc-500" />
                  <Input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="pl-10 bg-black/[0.03] dark:bg-white/[0.03] border-black/[0.06] dark:border-white/[0.06] text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="login-password" className="text-sm text-zinc-500 dark:text-zinc-400">{t("login.password")}</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 dark:text-zinc-500" />
                  <Input
                    id="login-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-10 bg-black/[0.03] dark:bg-white/[0.03] border-black/[0.06] dark:border-white/[0.06] text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
                    required
                  />
                </div>
              </div>

              {error && (
                <p className="text-sm text-red-400 bg-red-500/5 border border-red-500/10 rounded-lg p-3">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white gap-2 h-11 rounded-xl"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    {mode === "login" ? t("login.login") : t("login.register")}
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            <div className="relative my-6">
              <Separator className="bg-black/[0.06] dark:bg-white/[0.06]" />
              <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-[#0a0a0f] px-2 text-xs text-zinc-400 dark:text-zinc-600">
                {t("login.orContinue")}
              </span>
            </div>

            <Button
              variant="outline"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full border-black/[0.06] dark:border-white/[0.06] text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 h-11 rounded-xl"
            >
              <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              {t("login.googleLogin")}
            </Button>

            <p className="text-center text-xs text-zinc-400 dark:text-zinc-600 mt-4">
              {tf("login.clickAgree", { action: mode === "login" ? t("login.login") : t("login.register") })}
            </p>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
