import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { ThemeProvider } from "next-themes"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { ParticleBackground } from "@/components/shared/particle-background"
import { AuthInitializer } from "@/components/shared/auth-initializer"
import { HtmlLangUpdater } from "@/components/shared/html-lang-updater"
import { SkipToContent } from "@/components/shared/skip-to-content"
import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { cookies } from "next/headers"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://studyai.app"

const METADATA_BY_LANG: Record<string, {
  defaultTitle: string
  titleTemplate: string
  description: string
  keywords: string[]
  ogTitle: string
  ogDescription: string
  ogLocale: string
  ogImageAlt: string
  twitterTitle: string
  twitterDescription: string
}> = {
  "zh-CN": {
    defaultTitle: "StudyAI — 你的AI自律成长教练",
    titleTemplate: "%s | StudyAI",
    description: "通过认知科学与AI技术的融合，为你打造高度个性化、科学化的学习计划。科学规划，而不是盲目努力。",
    keywords: ["学习规划", "AI学习", "自律", "学习计划", "认知科学", "AI教练", "番茄工作法", "间隔重复", "深度工作", "刻意练习", "个性化学习"],
    ogTitle: "StudyAI — 你的AI自律成长教练",
    ogDescription: "通过认知科学与AI技术的融合，为你打造高度个性化、科学化的学习计划。",
    ogLocale: "zh-CN",
    ogImageAlt: "StudyAI — AI自律成长教练",
    twitterTitle: "StudyAI — 你的AI自律成长教练",
    twitterDescription: "AI驱动的智能学习规划与自律成长平台",
  },
  en: {
    defaultTitle: "StudyAI — Your AI Discipline Coach",
    titleTemplate: "%s | StudyAI",
    description: "Fusing cognitive science with AI to create highly personalized, scientifically-backed learning plans. Plan scientifically, not blindly.",
    keywords: ["study planner", "AI learning", "discipline", "learning plan", "cognitive science", "AI coach", "pomodoro", "spaced repetition", "deep work", "deliberate practice", "personalized learning"],
    ogTitle: "StudyAI — Your AI Discipline Coach",
    ogDescription: "Fusing cognitive science with AI to create highly personalized, scientifically-backed learning plans.",
    ogLocale: "en",
    ogImageAlt: "StudyAI — AI Discipline Coach",
    twitterTitle: "StudyAI — Your AI Discipline Coach",
    twitterDescription: "AI-powered intelligent learning planning and discipline growth platform",
  },
}

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies()
  const langCookie = cookieStore.get("studyai-language")?.value
  const lang = langCookie === "zh-CN" ? "zh-CN" : "en"
  const m = METADATA_BY_LANG[lang]

  return {
    metadataBase: new URL(BASE_URL),
    title: { default: m.defaultTitle, template: m.titleTemplate },
    description: m.description,
    keywords: m.keywords,
    authors: [{ name: "StudyAI", url: BASE_URL }],
    creator: "StudyAI",
    publisher: "StudyAI",
    applicationName: "StudyAI",
    category: "Education",
    alternates: { canonical: BASE_URL },
    openGraph: {
      title: m.ogTitle,
      description: m.ogDescription,
      url: BASE_URL,
      siteName: "StudyAI",
      type: "website",
      locale: m.ogLocale,
      images: [{ url: `${BASE_URL}/opengraph-image`, width: 1200, height: 630, alt: m.ogImageAlt }],
    },
    twitter: {
      card: "summary_large_image",
      site: "@studyai",
      creator: "@studyai",
      title: m.twitterTitle,
      description: m.twitterDescription,
      images: [`${BASE_URL}/opengraph-image`],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, "max-video-preview": -1, "max-image-preview": "large", "max-snippet": -1 },
    },
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider delay={300}>
            <HtmlLangUpdater />
            <AuthInitializer />
            <SkipToContent />
            <ParticleBackground />
            <Navbar />
            <main id="main-content" className="flex-1 flex flex-col">{children}</main>
            <Footer />
          </TooltipProvider>
          <Analytics />
          <SpeedInsights />
        </ThemeProvider>
      </body>
    </html>
  )
}
