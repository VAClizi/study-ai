"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Logo } from "@/components/shared/logo"
import { ThemeToggle } from "@/components/shared/theme-toggle"
import { Button } from "@/components/ui/button"
import { useAuthStore } from "@/stores/auth-store"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Menu, X, LayoutDashboard, CalendarCheck, ClipboardList, MessageSquare, Settings, LogOut, LogIn, ChevronRight } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/cn"
import { useT } from "@/lib/i18n"

const navItemKeys = [
  { href: "/chat", i18nKey: "nav.aiPlan", icon: MessageSquare },
  { href: "/plans", i18nKey: "nav.myPlans", icon: ClipboardList },
  { href: "/today", i18nKey: "nav.todayTasks", icon: CalendarCheck },
  { href: "/dashboard", i18nKey: "nav.dashboard", icon: LayoutDashboard },
]

export function Navbar() {
  const pathname = usePathname()
  const t = useT()
  const { user, isAuthenticated, logout } = useAuthStore()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-black/[0.04] dark:border-white/[0.04] bg-white/80 dark:bg-[#0a0a0f]/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Logo size="sm" />

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1" role="navigation" aria-label={t("nav.desktopNav")}>
            {navItemKeys.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all duration-200",
                  pathname === item.href
                    ? "bg-black/10 dark:bg-white/10 text-zinc-900 dark:text-white"
                    : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"
                )}
              >
                <item.icon className="h-3.5 w-3.5" />
                {t(item.i18nKey)}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <ThemeToggle />

            {isAuthenticated && (
              <Link
                href="/settings"
                className="w-9 h-9 rounded-lg flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-all"
                title={t("nav.settings")}
              >
                <Settings className="h-4 w-4" />
              </Link>
            )}

            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger className="relative h-8 w-8 rounded-full hover:bg-black/10 dark:hover:bg-white/10 inline-flex items-center justify-center outline-none">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-purple-600/20 text-purple-500 dark:text-purple-400 text-xs">
                      {user?.name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-48" align="end">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel>
                      <div className="flex flex-col gap-0.5">
                        <p className="text-sm font-medium">{user?.name}</p>
                        <p className="text-xs text-zinc-500">{user?.email}</p>
                      </div>
                    </DropdownMenuLabel>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem render={<Link href="/settings" />}>
                    <Settings className="mr-2 h-4 w-4" />
                    {t("nav.settings")}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => logout()} className="text-red-400 cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    {t("nav.logout")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium h-7 px-2.5 transition-all"
              >
                <LogIn className="h-3.5 w-3.5" />
                {t("nav.login")}
              </Link>
            )}

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden w-9 h-9"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      {mobileOpen && (
        <div className="md:hidden border-t border-black/[0.04] dark:border-white/[0.04] bg-white/95 dark:bg-[#0a0a0f]/95 backdrop-blur-xl">
          <nav className="px-4 py-3 space-y-1" role="navigation" aria-label={t("nav.mobileNav")}>
            {navItemKeys.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all",
                  pathname === item.href
                    ? "bg-black/10 dark:bg-white/10 text-zinc-900 dark:text-white"
                    : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"
                )}
              >
                <span className="flex items-center gap-2">
                  <item.icon className="h-4 w-4" />
                  {t(item.i18nKey)}
                </span>
                <ChevronRight className="h-4 w-4" />
              </Link>
            ))}
            <Link
              href="/settings"
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-between px-3 py-2.5 rounded-lg text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-all"
            >
              <span className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                {t("nav.settings")}
              </span>
              <ChevronRight className="h-4 w-4" />
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}
