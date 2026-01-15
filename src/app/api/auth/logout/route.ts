// src/app/api/auth/logout/route.ts
import { NextResponse } from 'next/server'
import { destroySession, assertSameOrigin } from '@/lib/auth/session'

export async function POST(req: Request) {
  try {
    await assertSameOrigin(req)
  } catch {
    return NextResponse.json(
      { ok: false, message: 'Bad origin' },
      { status: 403 }
    )
  }

  await destroySession()
  return NextResponse.json({ ok: true })
}
