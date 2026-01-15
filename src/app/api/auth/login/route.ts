// src/app/api/auth/login/route.ts
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { connectMongo } from '@/lib/db/mongoose'
import { User } from '@/models/User/User'
import { verifyPassword } from '@/lib/auth/password'
import { createSession, assertSameOrigin } from '@/lib/auth/session'

const BodySchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(8).max(200),
})

export async function POST(req: Request) {
  try {
    // ✅ CSRF hardening: allow only same-origin POSTs (works for browser fetch)
    await assertSameOrigin(req)
  } catch {
    return NextResponse.json(
      { ok: false, message: 'Bad origin' },
      { status: 403 }
    )
  }

  const json = await req.json().catch(() => null)
  const parsed = BodySchema.safeParse(json)

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, message: 'Invalid input' },
      { status: 400 }
    )
  }

  const email = parsed.data.email.trim().toLowerCase()
  const password = parsed.data.password

  await connectMongo()

  // ✅ Avoid leaking whether email exists: same error for all failures
  const user = await User.findOne({ email }).lean()
  if (!user || !user.isActive) {
    return NextResponse.json(
      { ok: false, message: 'Invalid credentials' },
      { status: 401 }
    )
  }

  const passOk = await verifyPassword(password, String(user.passwordHash))
  if (!passOk) {
    return NextResponse.json(
      { ok: false, message: 'Invalid credentials' },
      { status: 401 }
    )
  }

  // ✅ Create session + set httpOnly cookie
  await createSession(String(user._id))

  // ✅ update last login timestamp (non-blocking is ok, but keep simple)
  await User.updateOne(
    { _id: user._id },
    { $set: { lastLoginAt: new Date() } }
  ).catch(() => null)

  // Return minimal info (don’t leak internals)
  return NextResponse.json({
    ok: true,
    user: {
      id: String(user._id),
      email: String(user.email),
      role: String(user.role),
    },
  })
}
