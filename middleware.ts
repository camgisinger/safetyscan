import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // ── 1. Supabase session refresh ───────────────────────────────────────────
  // Runs on every request so tokens are refreshed before they expire.
  // supabaseResponse starts as a plain next() and may be rebuilt by setAll
  // when a token refresh writes new cookie values.
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Write updated cookies onto the request (so downstream server code
          // sees them) and rebuild supabaseResponse so they reach the browser.
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // getUser() is what triggers the token refresh check — must not be removed.
  await supabase.auth.getUser()

  // ── 2. Site-password gate ─────────────────────────────────────────────────
  // Always return supabaseResponse (not a bare NextResponse.next()) so that
  // any refreshed session cookies are forwarded to the browser. When we must
  // redirect, copy those cookies onto the redirect response first.
  const { pathname } = request.nextUrl

  // /access page and all API routes bypass the gate
  if (pathname.startsWith('/access') || pathname.startsWith('/api/')) {
    return supabaseResponse
  }

  const sitePassword = process.env.SITE_PASSWORD
  if (!sitePassword) return supabaseResponse

  const accessCookie = request.cookies.get('site_access')
  if (accessCookie?.value === sitePassword) return supabaseResponse

  // Gate fails — redirect to /access, carrying over any Supabase cookies so
  // a token refresh that occurred during this request is not silently dropped.
  const url = request.nextUrl.clone()
  url.pathname = '/access'
  const redirect = NextResponse.redirect(url)
  supabaseResponse.cookies.getAll().forEach(({ name, value, ...rest }) =>
    redirect.cookies.set({ name, value, ...rest })
  )
  return redirect
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)',],
}
