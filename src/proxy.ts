// src/proxy.ts
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

const COOKIE_NAME =
  process.env.SESSION_COOKIE_NAME ||
  (process.env.NODE_ENV === 'production'
    ? '__Host-vetra_session'
    : 'vetra_session')

function toLogin(req: NextRequest) {
  const url = req.nextUrl.clone()
  url.pathname = '/admin/login'
  url.searchParams.set('next', req.nextUrl.pathname + req.nextUrl.search)
  return url
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Allow login page itself
  if (pathname.startsWith('/admin/login')) return NextResponse.next()

  const token = req.cookies.get(COOKIE_NAME)?.value

  // Protect admin pages (redirect UX)
  if (pathname.startsWith('/admin/cms')) {
    if (!token) return NextResponse.redirect(toLogin(req))
    return NextResponse.next()
  }

  // Protect admin APIs (return 401 JSON, not redirect)
  if (pathname.startsWith('/api/admin')) {
    if (!token) {
      return NextResponse.json(
        { ok: false, message: 'Unauthorized' },
        { status: 401 },
      )
    }
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/cms/:path*', '/admin/login', '/api/admin/:path*'],
}
