// src/app/(admin)/admin/cms/users/[id]/function.ts
'use server'

import { redirect } from 'next/navigation'
import mongoose from 'mongoose'
import { connectMongo } from '@/lib/db/mongoose'
import { assertSameOriginStrict, getCurrentUser, revokeAllSessionsForUser } from '@/lib/auth/session'
import { User } from '@/models/User/User'
import { ensureUserIdentityIndexes } from '@/models/User/ensureIdentityIndexes'
import { UserSafetyBusyError, withUserSafetyLock } from '@/lib/cms/user-safety'
import {
  EMAIL_REGEX,
  USERNAME_REGEX,
  normalizeLower,
  normalizeInput,
} from '../add/validator'

function canManageUsers(role: string) {
  return role === 'dev' || role === 'admin'
}

type Role = 'dev' | 'admin' | 'editor' | 'viewer'

function parseRole(v: unknown): Role | null {
  const r = typeof v === 'string' ? v : ''
  if (r === 'dev' || r === 'admin' || r === 'editor' || r === 'viewer') return r
  return null
}

function parseBoolLike(v: unknown) {
  if (typeof v !== 'string') return null
  const s = v.trim().toLowerCase()
  if (s === 'on' || s === '1' || s === 'true') return true
  if (s === '0' || s === 'false') return false
  return null
}

export async function updateUserAction(userId: string, formData: FormData) {
  // ✅ Strict CSRF guard for admin mutations
  try {
    await assertSameOriginStrict()
  } catch {
    redirect(`/admin/cms/users/${encodeURIComponent(userId)}?err=csrf`)
  }

  const me = await getCurrentUser()
  if (!me)
    redirect(`/admin/login?next=/admin/cms/users/${encodeURIComponent(userId)}`)
  if (!canManageUsers(String(me.role)))
    redirect(`/admin/cms/users/${encodeURIComponent(userId)}?err=forbidden`)

  if (!mongoose.Types.ObjectId.isValid(userId))
    redirect(`/admin/cms/users/${encodeURIComponent(userId)}?err=bad_id`)

  const rawVersion = formData.get('version')
  const expectedVersion = rawVersion === null ? NaN : Number(rawVersion)
  if (!Number.isSafeInteger(expectedVersion) || expectedVersion < 0)
    redirect(`/admin/cms/users/${encodeURIComponent(userId)}?err=conflict`)

  const usernameRaw = normalizeLower(String(formData.get('username') ?? ''))
  const emailRaw = normalizeLower(String(formData.get('email') ?? ''))

  const backQs = new URLSearchParams()
  backQs.set('username', usernameRaw)
  backQs.set('email', emailRaw) // (optional privacy improvement: remove later)

  if (!usernameRaw || !emailRaw) {
    backQs.set('err', 'missing')
    redirect(
      `/admin/cms/users/${encodeURIComponent(userId)}?${backQs.toString()}`,
    )
  }

  if (!EMAIL_REGEX.test(emailRaw)) {
    backQs.set('err', 'bad_email')
    redirect(
      `/admin/cms/users/${encodeURIComponent(userId)}?${backQs.toString()}`,
    )
  }

  if (
    usernameRaw.length < 3 ||
    usernameRaw.length > 30 ||
    !USERNAME_REGEX.test(usernameRaw)
  ) {
    backQs.set('err', 'bad_username')
    redirect(
      `/admin/cms/users/${encodeURIComponent(userId)}?${backQs.toString()}`,
    )
  }

  await connectMongo()
  await ensureUserIdentityIndexes()

  const target = await User.findOne({ _id: userId, deletedAt: null })
    .select({ role: 1, isActive: 1, __v: 1 })
    .lean<{ _id: unknown; role?: string; isActive?: boolean; __v?: number } | null>()

  if (!target) {
    backQs.set('err', 'bad_id')
    redirect(
      `/admin/cms/users/${encodeURIComponent(userId)}?${backQs.toString()}`,
    )
  }
  if (Number(target.__v ?? 0) !== expectedVersion) {
    backQs.set('err', 'conflict')
    redirect(`/admin/cms/users/${encodeURIComponent(userId)}?${backQs.toString()}`)
  }

  const meRole = String(me.role)
  const targetRoleNow = String(target.role || 'viewer') as Role
  const targetIsActiveNow = Boolean(target.isActive)
  const isSelf = String(me.id) === String(userId)

  // If role/status inputs are missing (disabled), treat as unchanged
  const roleField = formData.get('role')
  const isActiveField = formData.get('isActive')

  // ✅ ROLE: if present, must be valid; if missing, unchanged
  let roleRaw: Role = targetRoleNow
  if (roleField != null) {
    const parsed = parseRole(roleField)
    if (!parsed) {
      backQs.set('err', 'bad_role')
      redirect(
        `/admin/cms/users/${encodeURIComponent(userId)}?${backQs.toString()}`,
      )
    }
    roleRaw = parsed
  }

  // ✅ isActive: if present, must be valid; if missing, unchanged
  let isActiveRaw = targetIsActiveNow
  if (isActiveField != null) {
    const parsed = parseBoolLike(isActiveField)
    if (parsed === null) {
      backQs.set('err', 'bad_active')
      redirect(
        `/admin/cms/users/${encodeURIComponent(userId)}?${backQs.toString()}`,
      )
    }
    isActiveRaw = parsed
  }

  backQs.set('role', roleRaw)
  backQs.set('isActive', isActiveRaw ? '1' : '0')

  // Only dev can manage a dev target (includes username/email edits)
  if (targetRoleNow === 'dev' && meRole !== 'dev') {
    backQs.set('err', 'forbidden')
    redirect(
      `/admin/cms/users/${encodeURIComponent(userId)}?${backQs.toString()}`,
    )
  }

  // Only dev can set someone to dev
  if (roleRaw === 'dev' && meRole !== 'dev') {
    backQs.set('err', 'forbidden')
    redirect(
      `/admin/cms/users/${encodeURIComponent(userId)}?${backQs.toString()}`,
    )
  }

  // Prevent locking yourself out
  if (isSelf) {
    const roleChanged = roleRaw !== targetRoleNow
    const disablingSelf = isActiveRaw === false && targetIsActiveNow === true
    if (roleChanged || disablingSelf) {
      backQs.set('err', 'self_edit')
      redirect(
        `/admin/cms/users/${encodeURIComponent(userId)}?${backQs.toString()}`,
      )
    }
  }

  let matched = 0
  try {
    await withUserSafetyLock(async () => {
      const acting = await User.findOne({ _id: me.id, isActive: true, deletedAt: null })
        .select({ role: 1 })
        .lean<{ role?: string } | null>()
      if (!acting || !canManageUsers(String(acting.role))) throw new Error('actor_forbidden')
      if ((targetRoleNow === 'dev' || roleRaw === 'dev') && acting.role !== 'dev') {
        throw new Error('actor_forbidden')
      }
      if (
        targetIsActiveNow &&
        (targetRoleNow === 'dev' || targetRoleNow === 'admin') &&
        (roleRaw !== targetRoleNow || !isActiveRaw)
      ) {
        const sameRoleActive = await User.countDocuments({
          role: targetRoleNow,
          isActive: true,
          deletedAt: null,
        })
        if (sameRoleActive <= 1) throw new Error('last_privileged')
      }

      const result = await User.updateOne(
        { _id: userId, deletedAt: null, __v: expectedVersion },
        {
          $set: {
            username: normalizeLower(usernameRaw),
            email: normalizeLower(emailRaw),
            role: roleRaw,
            isActive: Boolean(isActiveRaw),
          },
          $inc: { __v: 1 },
        },
      )
      matched = result.matchedCount
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : ''

    let code = 'unknown'
    if (e instanceof UserSafetyBusyError) code = 'conflict'
    else if (msg === 'actor_forbidden') code = 'forbidden'
    else if (msg === 'last_privileged') code = 'last_privileged'
    else if (msg.includes('E11000') && (msg.includes('uniq_email') || msg.includes('email'))) code = 'dup_email'
    else if (msg.includes('E11000') && (msg.includes('uniq_username') || msg.includes('username'))) code = 'dup_username'

    backQs.set('err', code)
    redirect(
      `/admin/cms/users/${encodeURIComponent(userId)}?${backQs.toString()}`,
    )
  }

  if (matched !== 1) {
    backQs.set('err', 'conflict')
    redirect(`/admin/cms/users/${encodeURIComponent(userId)}?${backQs.toString()}`)
  }
  if (targetIsActiveNow && !isActiveRaw) {
    await revokeAllSessionsForUser(userId)
  }

  const okQs = new URLSearchParams()
  okQs.set('ok', normalizeInput('Saved changes.'))
  redirect(`/admin/cms/users/${encodeURIComponent(userId)}?${okQs.toString()}`)
}
