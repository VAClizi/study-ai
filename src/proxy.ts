import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const publicRoutes = ["/", "/login"]
const staticPattern = /\.(svg|png|jpg|jpeg|gif|ico|json|xml|txt|webmanifest)$/

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (staticPattern.test(pathname)) {
    return NextResponse.next()
  }

  if (publicRoutes.includes(pathname) || pathname.startsWith("/_next")) {
    return NextResponse.next()
  }

  const sessionCookie = request.cookies.get("studyai_session")

  if (!sessionCookie) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("redirect", pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next|api|favicon.ico).*)"],
}
