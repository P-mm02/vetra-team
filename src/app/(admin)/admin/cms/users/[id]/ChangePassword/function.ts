// src/app/(admin)/admin/cms/users/[id]/ChangePassword/function.ts
'use server'

import { redirect } from 'next/navigation'
import mongoose from 'mongoose'
import { connectMongo } from '@/lib/db/mongoose'
import {
  assertSameOriginStrict,
  createSession,
  getCurrentUser,
  revokeAllSessionsForUser,
} from '@/lib/auth/session'
import { User } from '@/models/User/User'
import { hashPassword, isSafePasswordLength } from '@/lib/auth/password'

function canManageUsers(role: string) {
  return role === 'dev' || role === 'admin'
}

function norm(v: unknown) {
  return typeof v === 'string' ? v.trim() : ''
}

export async function changePasswordAction(userId: string, formData: FormData) {
  // ✅ Strict CSRF guard for admin mutations
  try {
    await assertSameOriginStrict()
  } catch {
    redirect(`/admin/cms/users/${encodeURIComponent(userId)}?cp_err=csrf`)
  }

  const me = await getCurrentUser()
  if (!me)
    redirect(`/admin/login?next=/admin/cms/users/${encodeURIComponent(userId)}`)

  if (!mongoose.Types.ObjectId.isValid(userId))
    redirect(`/admin/cms/users/${encodeURIComponent(userId)}?cp_err=bad_id`)

  const password = norm(formData.get('password'))
  const password2 = norm(formData.get('password2'))

  if (!password || !password2)
    redirect(`/admin/cms/users/${encodeURIComponent(userId)}?cp_err=missing`)

  if (!isSafePasswordLength(password))
    redirect(
      `/admin/cms/users/${encodeURIComponent(userId)}?cp_err=bad_password`,
    )

  if (password !== password2)
    redirect(`/admin/cms/users/${encodeURIComponent(userId)}?cp_err=no_match`)

  await connectMongo()

  const target = await User.findById(userId)
    .select({ role: 1 })
    .lean<{ _id: unknown; role?: string } | null>()

  if (!target)
    redirect(`/admin/cms/users/${encodeURIComponent(userId)}?cp_err=bad_id`)

  const meRole = String(me.role)
  const targetRole = String(target.role || 'viewer')
  const isSelf = String(me.id) === String(userId)

  // allow self password change, otherwise must have manage permission
  if (!isSelf && !canManageUsers(meRole))
    redirect(`/admin/cms/users/${encodeURIComponent(userId)}?cp_err=forbidden`)

  // only dev can change a dev user's password
  if (targetRole === 'dev' && meRole !== 'dev')
    redirect(`/admin/cms/users/${encodeURIComponent(userId)}?cp_err=forbidden`)

  try {
    const passwordHash = await hashPassword(password)

    await User.updateOne(
      { _id: userId },
      {
        $set: {
          passwordHash,
          passwordChangedAt: new Date(),
        },
      },
    )

    // ✅ revoke all sessions for that user after password change
    await revokeAllSessionsForUser(userId)

    // ✅ keep the user logged in if they changed their own password
    if (isSelf) {
      await createSession(userId)
    }
  } catch {
    redirect(`/admin/cms/users/${encodeURIComponent(userId)}?cp_err=unknown`)
  }

  redirect(`/admin/cms/users/${encodeURIComponent(userId)}?cp_ok=1`)
}
