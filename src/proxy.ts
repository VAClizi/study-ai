import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const publicRoutes = ["/", "/login"]
const staticPattern = /\.(svg|png|jpg|jpeg|gif|ico|json|xml|txt|html|webmanifest)$/
const ZH_REGIONS = new Set(["CN", "HK", "TW", "SG", "MO"])

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  let response: NextResponse | null = null

  if (!request.cookies.get("studyai-language")) {
    const country = request.headers.get("x-vercel-ip-country") ?? ""
    const lang = ZH_REGIONS.has(country) ? "zh-CN" : "en"
    response = NextResponse.next()
    response.cookies.set("studyai-language", lang, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    })
  }

  if (staticPattern.test(pathname)) {
    return response ?? NextResponse.next()
  }

  if (publicRoutes.includes(pathname) || pathname.startsWith("/_next")) {
    return response ?? NextResponse.next()
  }

  const sessionCookie = request.cookies.get("studyai_session")

  if (!sessionCookie) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("redirect", pathname)
    const redirect = NextResponse.redirect(loginUrl)
    if (response) {
      redirect.cookies.set("studyai-language", response.cookies.get("studyai-language")?.value ?? "en", {
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
        sameSite: "lax",
      })
    }
    return redirect
  }

  return response ?? NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next|api|favicon.ico).*)"],
}
