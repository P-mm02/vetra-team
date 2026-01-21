// src/app/api/auth/logout/route.ts
import { NextResponse } from 'next/server'
import { destroySession, assertSameOrigin } from '@/lib/auth/session'

export async function POST() {
  // CSRF hardening: allow only same-origin POSTs
  try {
    await assertSameOrigin()
  } catch {
    return NextResponse.json(
      { ok: false, message: 'Bad origin' },
      { status: 403 },
    )
  }

  // Destroy session + clear cookie (best-effort)
  await destroySession().catch(() => null)

  // Always return ok (don’t leak if session existed)
  return NextResponse.json({ ok: true })
}
