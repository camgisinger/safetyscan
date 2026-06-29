import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Never gate: the access page itself, all API routes
  if (pathname.startsWith('/access') || pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  const sitePassword = process.env.SITE_PASSWORD
  // If no password is configured, allow everything through
  if (!sitePassword) return NextResponse.next()

  const cookie = req.cookies.get('site_access')
  if (cookie?.value === sitePassword) return NextResponse.next()

  const url = req.nextUrl.clone()
  url.pathname = '/access'
  return NextResponse.redirect(url)
}

export const config = {
  // Match all routes except _next internals and static assets (files with extensions)
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)',],
}
