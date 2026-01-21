// src/middleware.ts
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

const COOKIE_NAME = process.env.SESSION_COOKIE_NAME || '__Host-vetra_session'

function toLogin(req: NextRequest) {
  const url = req.nextUrl.clone()
  url.pathname = '/admin/login'
  url.searchParams.set('next', req.nextUrl.pathname + req.nextUrl.search)
  return url
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Always allow admin login
  if (pathname.startsWith('/admin/login')) return NextResponse.next()

  // Protect admin CMS
  if (pathname.startsWith('/admin/cms')) {
    const token = req.cookies.get(COOKIE_NAME)?.value
    if (!token) return NextResponse.redirect(toLogin(req))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/cms/:path*', '/admin/login'],
}
