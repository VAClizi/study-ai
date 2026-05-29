import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "StudyAI — AI自律成长教练",
    short_name: "StudyAI",
    description: "通过认知科学与AI技术的融合，为你打造高度个性化、科学化的学习计划",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0a0f",
    theme_color: "#a855f7",
    icons: [
      {
        src: "/icon-192.svg",
        sizes: "192x192",
        type: "image/svg+xml",
      },
      {
        src: "/icon-512.svg",
        sizes: "512x512",
        type: "image/svg+xml",
      },
    ],
    lang: "en",
    dir: "ltr",
    categories: ["education", "productivity"],
  }
}
