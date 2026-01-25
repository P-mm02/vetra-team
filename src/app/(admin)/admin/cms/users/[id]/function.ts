// src/app/(admin)/admin/cms/users/[id]/function.ts
'use server'

import { redirect } from 'next/navigation'
import mongoose from 'mongoose'
import { connectMongo } from '@/lib/db/mongoose'
import { assertSameOriginStrict, getCurrentUser } from '@/lib/auth/session'
import { User } from '@/models/User/User'
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

  const target = await User.findById(userId)
    .select({ role: 1, isActive: 1 })
    .lean<{ _id: unknown; role?: string; isActive?: boolean } | null>()

  if (!target) {
    backQs.set('err', 'bad_id')
    redirect(
      `/admin/cms/users/${encodeURIComponent(userId)}?${backQs.toString()}`,
    )
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

  try {
    await User.updateOne(
      { _id: userId },
      {
        $set: {
          username: normalizeLower(usernameRaw),
          email: normalizeLower(emailRaw),
          role: roleRaw,
          isActive: Boolean(isActiveRaw),
        },
      },
    )
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : ''

    const code =
      msg.includes('E11000') &&
      (msg.includes('uniq_email') || msg.includes('email'))
        ? 'dup_email'
        : msg.includes('E11000') &&
            (msg.includes('uniq_username') || msg.includes('username'))
          ? 'dup_username'
          : 'unknown'

    backQs.set('err', code)
    redirect(
      `/admin/cms/users/${encodeURIComponent(userId)}?${backQs.toString()}`,
    )
  }

  const okQs = new URLSearchParams()
  okQs.set('ok', normalizeInput('Saved changes.'))
  redirect(`/admin/cms/users/${encodeURIComponent(userId)}?${okQs.toString()}`)
}
