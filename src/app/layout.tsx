import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { ThemeProvider } from "next-themes"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { ParticleBackground } from "@/components/shared/particle-background"
import { AuthInitializer } from "@/components/shared/auth-initializer"
import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from "@vercel/speed-insights/next"
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

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "StudyAI — 你的AI自律成长教练",
    template: "%s | StudyAI",
  },
  description:
    "通过认知科学与AI技术的融合，为你打造高度个性化、科学化的学习计划。科学规划，而不是盲目努力。",
  keywords: [
    "学习规划", "AI学习", "自律", "学习计划", "认知科学", "AI教练",
    "番茄工作法", "间隔重复", "深度工作", "刻意练习", "个性化学习",
  ],
  authors: [{ name: "StudyAI", url: BASE_URL }],
  creator: "StudyAI",
  publisher: "StudyAI",
  applicationName: "StudyAI",
  category: "Education",
  alternates: {
    canonical: BASE_URL,
  },
  openGraph: {
    title: "StudyAI — 你的AI自律成长教练",
    description: "通过认知科学与AI技术的融合，为你打造高度个性化、科学化的学习计划。",
    url: BASE_URL,
    siteName: "StudyAI",
    type: "website",
    locale: "zh-CN",
    images: [
      {
        url: `${BASE_URL}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: "StudyAI — AI自律成长教练",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@studyai",
    creator: "@studyai",
    title: "StudyAI — 你的AI自律成长教练",
    description: "AI驱动的智能学习规划与自律成长平台",
    images: [`${BASE_URL}/opengraph-image`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="zh-CN"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider delay={300}>
            <AuthInitializer />
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-lg focus:bg-purple-600 focus:text-white focus:text-sm focus:font-medium focus:outline-none"
            >
              跳转到主要内容
            </a>
            <ParticleBackground />
            <Navbar />
            <main id="main-content" className="flex-1">{children}</main>
            <Footer />
          </TooltipProvider>
          <Analytics />
          <SpeedInsights />
        </ThemeProvider>
      </body>
    </html>
  )
}
