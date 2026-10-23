import mongoose from 'mongoose'
import { connectMongo } from '@/lib/db/mongoose'
import { revokeAllSessionsForUser } from '@/lib/auth/session'
import { User } from '@/models/User/User'
import { UserSafetyBusyError, withUserSafetyLock } from './user-safety'

export type TrashActor = { id: string; role: string }
export type TrashedUserSummary = {
  id: string
  kind: 'user'
  title: string
  deletedAt: string
  purgeAt: string
  version: number
}
export type TrashResult = {
  ok: boolean
  code?: 'bad_id' | 'bad_version' | 'forbidden' | 'self_delete' | 'last_privileged' | 'not_found' | 'conflict' | 'expired' | 'not_expired'
}

const RETENTION_MS = 30 * 24 * 60 * 60 * 1000

function canManageUsers(actor: TrashActor) {
  return actor.role === 'dev' || actor.role === 'admin'
}

function validVersion(version: number) {
  return Number.isSafeInteger(version) && version >= 0
}

type UserState = {
  _id: mongoose.Types.ObjectId
  username?: string
  email?: string
  role?: string
  isActive?: boolean
  deletedAt?: Date | null
  purgeAt?: Date | null
  __v?: number
}

export async function listTrashedUsers(actor: TrashActor): Promise<TrashedUserSummary[]> {
  if (!canManageUsers(actor)) throw new Error('Forbidden')
  await connectMongo()

  const users = await User.find({
    deletedAt: { $type: 'date' },
    purgeAt: { $gt: new Date() },
    ...(actor.role === 'dev' ? {} : { role: { $ne: 'dev' } }),
  })
    .select({ username: 1, email: 1, role: 1, deletedAt: 1, purgeAt: 1, __v: 1 })
    .sort({ deletedAt: -1 })
    .lean<UserState[]>()

  return users
    .filter((user) => user.deletedAt instanceof Date && user.purgeAt instanceof Date)
    .map((user) => ({
      id: String(user._id),
      kind: 'user' as const,
      title: String(user.username || user.email || 'User'),
      deletedAt: user.deletedAt!.toISOString(),
      purgeAt: user.purgeAt!.toISOString(),
      version: Number(user.__v ?? 0),
    }))
}

/** Move an account to Trash while retaining its previous active state for restore. */
export async function softDeleteUser(
  id: string,
  actor: TrashActor,
  version: number,
): Promise<TrashResult> {
  if (!canManageUsers(actor)) return { ok: false, code: 'forbidden' }
  if (!mongoose.isValidObjectId(id)) return { ok: false, code: 'bad_id' }
  if (!validVersion(version)) return { ok: false, code: 'bad_version' }
  if (actor.id === id) return { ok: false, code: 'self_delete' }
  await connectMongo()
  try {
    const result = await withUserSafetyLock(async (): Promise<TrashResult> => {
      const acting = await User.findOne({ _id: actor.id, isActive: true, deletedAt: null })
        .select({ role: 1 })
        .lean<UserState | null>()
      if (!acting || (acting.role !== 'dev' && acting.role !== 'admin')) return { ok: false, code: 'forbidden' }
      const target = await User.findOne({ _id: id, deletedAt: null })
        .select({ role: 1, isActive: 1, __v: 1 })
        .lean<UserState | null>()
      if (!target) return { ok: false, code: 'not_found' }
      if (Number(target.__v ?? 0) !== version) return { ok: false, code: 'conflict' }
      if (target.role === 'dev' && acting.role !== 'dev') return { ok: false, code: 'forbidden' }

      if (target.isActive && (target.role === 'dev' || target.role === 'admin')) {
        const count = await User.countDocuments({
          role: target.role,
          isActive: true,
          deletedAt: null,
        })
        if (count <= 1) return { ok: false, code: 'last_privileged' }
      }

      const deletedAt = new Date()
      const purgeAt = new Date(deletedAt.getTime() + RETENTION_MS)
      const changed = await User.updateOne(
        { _id: id, deletedAt: null, __v: version },
        { $set: { deletedAt, purgeAt }, $inc: { __v: 1 } },
      )
      return changed.matchedCount === 1 ? { ok: true } : { ok: false, code: 'conflict' }
    })
    if (result.ok) {
      // getCurrentUser also rejects trashed accounts if session cleanup fails.
      await revokeAllSessionsForUser(id)
    }
    return result
  } catch (error) {
    if (error instanceof UserSafetyBusyError) return { ok: false, code: 'conflict' }
    throw error
  }
}

export async function restoreTrashedUser(
  id: string,
  actor: TrashActor,
  version: number,
): Promise<TrashResult> {
  if (!canManageUsers(actor)) return { ok: false, code: 'forbidden' }
  if (!mongoose.isValidObjectId(id)) return { ok: false, code: 'bad_id' }
  if (!validVersion(version)) return { ok: false, code: 'bad_version' }
  await connectMongo()
  try {
    return await withUserSafetyLock(async (): Promise<TrashResult> => {
      const acting = await User.findOne({ _id: actor.id, isActive: true, deletedAt: null })
        .select({ role: 1 })
        .lean<UserState | null>()
      if (!acting || (acting.role !== 'dev' && acting.role !== 'admin')) return { ok: false, code: 'forbidden' }
      const target = await User.findOne({ _id: id, deletedAt: { $type: 'date' } })
        .select({ role: 1, purgeAt: 1, __v: 1 })
        .lean<UserState | null>()
      if (!target) return { ok: false, code: 'not_found' }
      if (target.role === 'dev' && acting.role !== 'dev') return { ok: false, code: 'forbidden' }
      if (!target.purgeAt || target.purgeAt.getTime() <= Date.now()) return { ok: false, code: 'expired' }
      if (Number(target.__v ?? 0) !== version) return { ok: false, code: 'conflict' }

      const changed = await User.updateOne(
        { _id: id, deletedAt: { $type: 'date' }, purgeAt: { $gt: new Date() }, __v: version },
        { $set: { deletedAt: null, purgeAt: null }, $inc: { __v: 1 } },
      )
      return changed.matchedCount === 1 ? { ok: true } : { ok: false, code: 'conflict' }
    })
  } catch (error) {
    if (error instanceof UserSafetyBusyError) return { ok: false, code: 'conflict' }
    throw error
  }
}

/** Optional one-record purge; a user cannot be permanently removed early. */
export async function permanentlyDeleteExpiredUser(
  id: string,
  actor: TrashActor,
  version: number,
): Promise<TrashResult> {
  if (!canManageUsers(actor)) return { ok: false, code: 'forbidden' }
  if (!mongoose.isValidObjectId(id)) return { ok: false, code: 'bad_id' }
  if (!validVersion(version)) return { ok: false, code: 'bad_version' }
  await connectMongo()
  try {
    return await withUserSafetyLock(async (): Promise<TrashResult> => {
      const acting = await User.findOne({ _id: actor.id, isActive: true, deletedAt: null })
        .select({ role: 1 })
        .lean<UserState | null>()
      if (!acting || (acting.role !== 'dev' && acting.role !== 'admin')) return { ok: false, code: 'forbidden' }
      const target = await User.findOne({ _id: id, deletedAt: { $type: 'date' } })
        .select({ role: 1, purgeAt: 1, __v: 1 })
        .lean<UserState | null>()
      if (!target) return { ok: false, code: 'not_found' }
      if (target.role === 'dev' && acting.role !== 'dev') return { ok: false, code: 'forbidden' }
      if (!target.purgeAt || target.purgeAt.getTime() > Date.now()) return { ok: false, code: 'not_expired' }
      if (Number(target.__v ?? 0) !== version) return { ok: false, code: 'conflict' }

      const deleted = await User.deleteOne({
        _id: id,
        deletedAt: { $type: 'date' },
        purgeAt: { $lte: new Date() },
        __v: version,
      })
      return deleted.deletedCount === 1 ? { ok: true } : { ok: false, code: 'conflict' }
    })
  } catch (error) {
    if (error instanceof UserSafetyBusyError) return { ok: false, code: 'conflict' }
    throw error
  }
}

/** Run from the Trash endpoint and a scheduler to complete retention cleanup. */
export async function purgeExpiredUsers(): Promise<number> {
  await connectMongo()
  const result = await User.deleteMany({
    deletedAt: { $type: 'date' },
    purgeAt: { $lte: new Date() },
  })
  return result.deletedCount
}
