// src/app/api/auth/login/route.ts
import { NextResponse } from 'next/server'
import { z } from 'zod'
import mongoose from 'mongoose'
import { connectMongo } from '@/lib/db/mongoose'
import { User } from '@/models/User/User'
import { verifyPassword } from '@/lib/auth/password'
import { createSession, assertSameOrigin } from '@/lib/auth/session'

// Keep the username key for existing clients; the field also accepts email.
const BodySchema = z.object({
  username: z.string().trim().min(3).max(254),
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

  const identifier = parsed.data.username.toLowerCase()
  const password = parsed.data.password
  const now = new Date()

  const unavailable = () => NextResponse.json(
    { ok: false, message: 'Sign-in is temporarily unavailable. Please try again.' },
    { status: 503 },
  )

  try {
    await connectMongo()
  } catch {
    return unavailable()
  }

  // Always return same error (avoid user enumeration)
  const invalid = () =>
    NextResponse.json(
      { ok: false, message: 'Invalid credentials' },
      { status: 401 },
    )

  // Select sensitive fields explicitly (passwordHash/loginAttempts/lockUntil are select:false)
  let user: LeanLoginUser | null
  try {
    user = await User.findOne({
      deletedAt: null,
      $or: [{ username: identifier }, { email: identifier }],
    })
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
  } catch {
    return unavailable()
  }

  // Generic failure (don’t reveal if username exists)
  if (!user || !user.isActive) return invalid()

  // If locked, deny (same generic response)
  if (user.lockUntil && user.lockUntil.getTime() > now.getTime())
    return invalid()

  // Verify password
  const storedHash = String(user.passwordHash ?? '')
  const passOk = await verifyPassword(password, storedHash)

  if (!passOk) {
    try {
      const failed = await User.findOneAndUpdate(
        { _id: user._id, deletedAt: null, isActive: true },
        { $inc: { loginAttempts: 1 } },
        { returnDocument: 'after', projection: { loginAttempts: 1 } },
      ).lean<{ loginAttempts: number } | null>()
      if (failed && failed.loginAttempts >= MAX_ATTEMPTS) {
        await User.updateOne(
          { _id: user._id },
          { $set: { lockUntil: new Date(now.getTime() + LOCK_MINUTES * 60 * 1000) } },
        )
      }
    } catch {
      return unavailable()
    }
    return invalid()
  }

  try {
    // Reset the failure counter before issuing a session. A failed write must
    // not make a sign-in look successful while the account stays locked.
    const reset = await User.updateOne(
      { _id: user._id, deletedAt: null, isActive: true },
      { $set: { lastLoginAt: now, loginAttempts: 0, lockUntil: null } },
    )
    if (reset.matchedCount !== 1) return invalid()
    await createSession(String(user._id))
  } catch {
    return unavailable()
  }

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
