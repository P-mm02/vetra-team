// src/app/api/auth/login/route.ts
import { NextResponse } from 'next/server'
import { z } from 'zod'
import mongoose from 'mongoose'
import { connectMongo } from '@/lib/db/mongoose'
import { User } from '@/models/User/User'
import { verifyPassword } from '@/lib/auth/password'
import { createSession, assertSameOrigin } from '@/lib/auth/session'

// 1) Validate request body (username + password)
const BodySchema = z.object({
  username: z.string().min(3).max(30),
  password: z.string().min(8).max(200),
})

// 2) Brute-force protection
const MAX_ATTEMPTS = 5
const LOCK_MINUTES = 15

// 3) Typed lean result (fix lockUntil typing)
type LeanLoginUser = {
  _id: mongoose.Types.ObjectId
  username?: string
  email: string
  role: string
  isActive: boolean
  passwordHash?: string
  loginAttempts?: number
  lockUntil?: Date | null
}

export async function POST(req: Request) {
  // CSRF hardening: same-origin only
  try {
    await assertSameOrigin()
  } catch {
    return NextResponse.json(
      { ok: false, message: 'Bad origin' },
      { status: 403 },
    )
  }

  // Parse + validate JSON
  const json = await req.json().catch(() => null)
  const parsed = BodySchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, message: 'Invalid input' },
      { status: 400 },
    )
  }

  const username = parsed.data.username.trim().toLowerCase()
  const password = parsed.data.password
  const now = new Date()

  await connectMongo()

  // Always return same error (avoid user enumeration)
  const invalid = () =>
    NextResponse.json(
      { ok: false, message: 'Invalid credentials' },
      { status: 401 },
    )

  // Select sensitive fields explicitly (passwordHash/loginAttempts/lockUntil are select:false)
  const user = await User.findOne({ username })
    .select({
      username: 1,
      email: 1,
      role: 1,
      isActive: 1,
      passwordHash: 1,
      loginAttempts: 1,
      lockUntil: 1,
    })
    .lean<LeanLoginUser | null>()

  // Generic failure (don’t reveal if username exists)
  if (!user || !user.isActive) return invalid()

  // If locked, deny (same generic response)
  if (user.lockUntil && user.lockUntil.getTime() > now.getTime())
    return invalid()

  // Verify password
  const storedHash = String(user.passwordHash ?? '')
  const passOk = await verifyPassword(password, storedHash)

  if (!passOk) {
    const attempts = Number(user.loginAttempts ?? 0) + 1
    const update: Record<string, unknown> = {
      $set: { loginAttempts: attempts },
    }

    if (attempts >= MAX_ATTEMPTS) {
      ;(update.$set as Record<string, unknown>).lockUntil = new Date(
        now.getTime() + LOCK_MINUTES * 60 * 1000,
      )
    }

    await User.updateOne({ _id: user._id }, update).catch(() => null)
    return invalid()
  }

  // Success: create session cookie
  await createSession(String(user._id))

  // Reset lock state + audit
  await User.updateOne(
    { _id: user._id },
    { $set: { lastLoginAt: now, loginAttempts: 0, lockUntil: null } },
  ).catch(() => null)

  return NextResponse.json({
    ok: true,
    user: {
      id: String(user._id),
      username: String(user.username ?? ''),
      email: user.email, // keep for recovery + admin UI if needed
      role: user.role,
    },
  })
}
