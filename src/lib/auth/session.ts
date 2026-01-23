// src/lib/auth/session.ts
import crypto from 'crypto'
import { cookies, headers } from 'next/headers'
import mongoose from 'mongoose'
import { connectMongo } from '@/lib/db/mongoose'
import { User } from '@/models/User/User'

type SessionDoc = {
  _id: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  tokenHash: string
  expiresAt: Date
  createdAt: Date
  lastUsedAt: Date
}

// 1) Session schema (safe + TTL)
const SessionSchema =
  mongoose.models.Session?.schema ||
  new mongoose.Schema(
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
      },

      // unique already creates an index
      tokenHash: { type: String, required: true, unique: true },

      // TTL via schema.index() below
      expiresAt: { type: Date, required: true },

      lastUsedAt: { type: Date, required: true },
    },
    { timestamps: { createdAt: true, updatedAt: false } },
  )

// 2) TTL index added once (avoid hot-reload duplicates)
const hasExpiresTtl = SessionSchema.indexes().some(
  (entry: [Record<string, unknown>, Record<string, unknown>]) => {
    const [keys, opts] = entry
    return (
      (keys as any).expiresAt === 1 && (opts as any).expireAfterSeconds === 0
    )
  },
)
if (!hasExpiresTtl) {
  SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })
}

// 3) Model (avoid overwrite in dev)
const Session =
  (mongoose.models.Session as mongoose.Model<SessionDoc>) ||
  mongoose.model<SessionDoc>('Session', SessionSchema)

// 4) Cookie + secret config
// ✅ Use __Host- only in production (dev on http would reject it)
const COOKIE_NAME =
  process.env.SESSION_COOKIE_NAME ||
  (process.env.NODE_ENV === 'production'
    ? '__Host-vetra_session'
    : 'vetra_session')

// Safety: require a strong secret
const envSecret = process.env.AUTH_SECRET
if (!envSecret || envSecret.length < 16) {
  throw new Error('Missing/weak env: AUTH_SECRET (min 16 chars recommended)')
}
const AUTH_SECRET: string = envSecret

const rawDays = Number(process.env.SESSION_DAYS || 30)
const SESSION_DAYS = Number.isFinite(rawDays) && rawDays > 0 ? rawDays : 30
const SESSION_TTL_MS = SESSION_DAYS * 24 * 60 * 60 * 1000

// 5) Token helpers
function makeToken() {
  return crypto.randomBytes(32).toString('base64url')
}

// Use HMAC for token hashing
function tokenToHash(token: string) {
  return crypto.createHmac('sha256', AUTH_SECRET).update(token).digest('hex')
}

// 6) Public type returned to app (username for login, email for recovery)
export type CurrentUser = {
  id: string
  username: string
  email: string
  role: string
}

// 7) Create session + set cookie
export async function createSession(userId: string) {
  await connectMongo()

  const token = makeToken()
  const tokenHash = tokenToHash(token)
  const now = new Date()
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS)

  await Session.create({
    userId: new mongoose.Types.ObjectId(userId),
    tokenHash,
    expiresAt,
    lastUsedAt: now,
  })

  const cookieStore = await cookies()
  cookieStore.set({
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  })

  return { ok: true }
}

// 8) Destroy session + clear cookie
export async function destroySession() {
  await connectMongo()

  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value

  if (token) {
    const tokenHash = tokenToHash(token)
    await Session.deleteOne({ tokenHash }).catch(() => null)
  }

  cookieStore.set({
    name: COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })

  return { ok: true }
}

// ✅ helper for admin actions (delete user, force logout, etc.)
export async function revokeAllSessionsForUser(userId: string) {
  await connectMongo()
  if (!mongoose.isValidObjectId(userId)) return { ok: false }
  await Session.deleteMany({
    userId: new mongoose.Types.ObjectId(userId),
  }).catch(() => null)
  return { ok: true }
}

type LeanUser = {
  _id: mongoose.Types.ObjectId
  username?: string | null
  email: string
  role: string
  isActive: boolean
}

// 9) Resolve current user from session cookie
export async function getCurrentUser(): Promise<CurrentUser | null> {
  await connectMongo()

  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return null

  const tokenHash = tokenToHash(token)
  const now = new Date()

  const session = await Session.findOne({
    tokenHash,
    expiresAt: { $gt: now },
  }).lean<SessionDoc | null>()

  if (!session) return null

  const user = await User.findById(session.userId)
    .select({ username: 1, email: 1, role: 1, isActive: 1 })
    .lean<LeanUser | null>()

  if (!user || !user.isActive) {
    await Session.deleteOne({ tokenHash }).catch(() => null)
    return null
  }

  // Fallback: use email prefix
  const fallbackUsername = String(user.email).split('@')[0] || 'user'

  await Session.updateOne({ tokenHash }, { $set: { lastUsedAt: now } }).catch(
    () => null,
  )

  return {
    id: String(user._id),
    username: String(user.username || fallbackUsername),
    email: String(user.email),
    role: String(user.role),
  }
}

/**
 * 10) CSRF basic guard for mutation routes:
 * - If Origin/Host missing -> allow (relaxed)
 * - Origin host must match Host / x-forwarded-host
 */
export async function assertSameOrigin() {
  const h = await headers()
  const origin = h.get('origin')
  const host = h.get('x-forwarded-host') || h.get('host') || undefined

  if (!origin || !host) return

  const originHost = new URL(origin).host
  if (originHost !== host) throw new Error('Bad origin')
}

/**
 * ✅ Strict CSRF guard for ADMIN mutation routes:
 * - If Origin/Host missing -> reject (fail closed)
 * - Origin host must match Host / x-forwarded-host
 */
export async function assertSameOriginStrict() {
  const h = await headers()
  const origin = h.get('origin')
  const host = h.get('x-forwarded-host') || h.get('host') || undefined

  if (!origin || !host) throw new Error('Missing origin/host')

  const originHost = new URL(origin).host
  if (originHost !== host) throw new Error('Bad origin')
}
