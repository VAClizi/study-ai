import type { MetadataRoute } from "next"

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://studyai.app"

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = [
    { path: "", priority: 1, changeFreq: "daily" as const },
    { path: "/chat", priority: 0.9, changeFreq: "weekly" as const },
    { path: "/about", priority: 0.6, changeFreq: "monthly" as const },
    { path: "/login", priority: 0.3, changeFreq: "monthly" as const },
    { path: "/terms", priority: 0.2, changeFreq: "monthly" as const },
    { path: "/privacy", priority: 0.2, changeFreq: "monthly" as const },
  ]

  return staticRoutes.map((route) => ({
    url: `${BASE_URL}${route.path}`,
    lastModified: new Date(),
    changeFrequency: route.changeFreq,
    priority: route.priority,
  }))
}
