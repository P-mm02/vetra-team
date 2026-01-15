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

      // ✅ unique already creates an index (no need index: true)
      tokenHash: { type: String, required: true, unique: true },

      // ✅ TTL handled via schema.index() below
      expiresAt: { type: Date, required: true },

      lastUsedAt: { type: Date, required: true },
    },
    { timestamps: { createdAt: true, updatedAt: false } }
  )

// ✅ TTL index: add only once (avoid dev hot-reload duplicate warnings)
const hasExpiresTtl = SessionSchema.indexes().some(
  (entry: [Record<string, unknown>, Record<string, unknown>]) => {
    const [keys, opts] = entry
    return keys.expiresAt === 1 && opts.expireAfterSeconds === 0
  }
)

if (!hasExpiresTtl) {
  SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })
}


const Session =
  (mongoose.models.Session as mongoose.Model<SessionDoc>) ||
  mongoose.model<SessionDoc>('Session', SessionSchema)

const COOKIE_NAME = process.env.SESSION_COOKIE_NAME || '__Host-vetra_session'
const AUTH_SECRET = process.env.AUTH_SECRET || ''

const SESSION_DAYS = Number(process.env.SESSION_DAYS || 30)
const SESSION_TTL_MS = SESSION_DAYS * 24 * 60 * 60 * 1000

function sha256(input: string) {
  return crypto.createHash('sha256').update(input).digest('hex')
}

function makeToken() {
  return crypto.randomBytes(32).toString('base64url')
}

function tokenToHash(token: string) {
  return sha256(`${token}.${AUTH_SECRET}`)
}

export type CurrentUser = {
  id: string
  email: string
  role: string
}

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

  const user = await User.findById(session.userId).lean()
  if (!user || !user.isActive) {
    await Session.deleteOne({ tokenHash }).catch(() => null)
    return null
  }

  await Session.updateOne({ tokenHash }, { $set: { lastUsedAt: now } }).catch(
    () => null
  )

  return {
    id: String(user._id),
    email: String(user.email),
    role: String(user.role),
  }
}

export async function assertSameOrigin(req: Request) {
  const h = await headers()
  const origin = h.get('origin')
  const host = h.get('host')

  if (!origin || !host) return

  const originHost = new URL(origin).host
  if (originHost !== host) {
    throw new Error('Bad origin')
  }
}
