// src/app/api/admin/bootstrap/route.ts
import { NextResponse } from 'next/server'
import { z } from 'zod'
import crypto from 'crypto'
import mongoose from 'mongoose'
import { connectMongo } from '@/lib/db/mongoose'
import { User } from '@/models/User/User'
import { ensureUserIdentityIndexes } from '@/models/User/ensureIdentityIndexes'
import { hashPassword } from '@/lib/auth/password'
import { assertSameOrigin } from '@/lib/auth/session'

// 1) Bootstrap now creates the FIRST OWNER with username+password (email for recovery)
const USERNAME_REGEX = /^[a-z0-9](?:[a-z0-9_\.]*[a-z0-9])?$/i

const BodySchema = z.object({
  username: z.string().min(3).max(30).regex(USERNAME_REGEX),
  email: z.string().email().max(254),
  password: z.string().min(10).max(200),
})

// A fixed first-owner ID makes two concurrent bootstrap requests unable to
// create two owners even before database indexes on email/username are ready.
const FIRST_OWNER_ID = new mongoose.Types.ObjectId('000000000000000000000001')

function timingSafeEqualStr(a: string, b: string) {
  const aa = Buffer.from(a)
  const bb = Buffer.from(b)
  if (aa.length !== bb.length) return false
  return crypto.timingSafeEqual(aa, bb)
}

export async function POST(req: Request) {
  // 2) CSRF hardening: only same-origin (if called from browser)
  try {
    await assertSameOrigin()
  } catch {
    return NextResponse.json(
      { ok: false, message: 'Bad origin' },
      { status: 403 },
    )
  }

  // 3) Require server-side token to enable bootstrap
  const expected = process.env.CMS_BOOTSTRAP_TOKEN
  if (!expected || expected.length < 12) {
    return NextResponse.json(
      { ok: false, message: 'Bootstrap disabled' },
      { status: 403 },
    )
  }

  // 4) Verify provided token (constant-time compare)
  const provided = req.headers.get('x-bootstrap-token') || ''
  if (!timingSafeEqualStr(provided, expected)) {
    return NextResponse.json(
      { ok: false, message: 'Unauthorized' },
      { status: 401 },
    )
  }

  // 5) Validate JSON body
  const json = await req.json().catch(() => null)
  const parsed = BodySchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, message: 'Invalid input' },
      { status: 400 },
    )
  }

  const username = parsed.data.username.trim().toLowerCase()
  const email = parsed.data.email.trim().toLowerCase()
  const password = parsed.data.password

  await connectMongo()

  // 6) Only allow bootstrap if there are NO users
  const userCount = await User.countDocuments({})
  if (userCount > 0) {
    return NextResponse.json(
      { ok: false, message: 'Users already exist' },
      { status: 409 },
    )
  }

  // 7) Extra safety: ensure username/email not already taken (race-safe with unique indexes too)
  const exists = await User.findOne({
    $or: [{ username }, { email }],
  })
    .select({ _id: 1 })
    .lean()

  if (exists) {
    return NextResponse.json(
      { ok: false, message: 'Already exists' },
      { status: 409 },
    )
  }

  await ensureUserIdentityIndexes()

  // 8) Create Dev
  const passwordHash = await hashPassword(password)
  let dev
  try {
    dev = await User.create({
      _id: FIRST_OWNER_ID,
      username,
      email,
      passwordHash,
      role: 'dev',
      isActive: true,
      lastLoginAt: null,
      loginAttempts: 0,
      lockUntil: null,
    })
  } catch (error) {
    if ((error as { code?: number })?.code === 11000) {
      return NextResponse.json(
        { ok: false, message: 'Bootstrap already completed' },
        { status: 409 },
      )
    }
    throw error
  }

  // 9) Return minimal info
  return NextResponse.json({
    ok: true,
    user: {
      id: String(dev._id),
      username: dev.username,
      email: dev.email,
      role: dev.role,
    },
  })
}
