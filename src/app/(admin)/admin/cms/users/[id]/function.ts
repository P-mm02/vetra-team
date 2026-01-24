// src/app/(admin)/admin/cms/users/[id]/function.ts
'use server'

import { redirect } from 'next/navigation'
import mongoose from 'mongoose'
import { connectMongo } from '@/lib/db/mongoose'
import { getCurrentUser } from '@/lib/auth/session'
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

function asRole(v: unknown) {
  const r = typeof v === 'string' ? v : ''
  const ok = r === 'dev' || r === 'admin' || r === 'editor' || r === 'viewer'
  return ok ? r : 'viewer'
}

function parseBoolLike(v: unknown) {
  if (typeof v !== 'string') return null
  const s = v.trim().toLowerCase()
  if (s === 'on' || s === '1' || s === 'true') return true
  if (s === '0' || s === 'false') return false
  return null
}

export async function updateUserAction(userId: string, formData: FormData) {
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
  backQs.set('email', emailRaw)

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
  const targetRoleNow = String(target.role || 'viewer')
  const targetIsActiveNow = Boolean(target.isActive)
  const isSelf = String(me.id) === String(userId)

  // ✅ if role/status inputs are missing (disabled), treat as unchanged
  const roleField = formData.get('role')
  const isActiveField = formData.get('isActive')

  const roleRaw = roleField == null ? targetRoleNow : asRole(roleField)
  const isActiveParsed = parseBoolLike(isActiveField)
  const isActiveRaw =
    isActiveField == null ? targetIsActiveNow : Boolean(isActiveParsed)

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
