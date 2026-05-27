import { ImageResponse } from "next/og"

export const runtime = "edge"

export const alt = "StudyAI — 你的AI自律成长教练"
export const size = {
  width: 1200,
  height: 630,
}

export const contentType = "image/png"

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 80, fontWeight: 700, color: "white", marginBottom: 20 }}>
          StudyAI
        </div>
        <div style={{ fontSize: 36, color: "rgba(255,255,255,0.85)", marginBottom: 16 }}>
          你的 AI 自律成长教练
        </div>
        <div style={{ fontSize: 22, color: "rgba(255,255,255,0.5)" }}>
          科学规划，而非盲目努力
        </div>
      </div>
    ),
    { ...size },
  )
}
