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

  const password = typeof formData.get('password') === 'string' ? String(formData.get('password')) : ''
  const password2 = typeof formData.get('password2') === 'string' ? String(formData.get('password2')) : ''

  if (!password || !password2)
    redirect(`/admin/cms/users/${encodeURIComponent(userId)}?cp_err=missing`)

  if (!isSafePasswordLength(password))
    redirect(
      `/admin/cms/users/${encodeURIComponent(userId)}?cp_err=bad_password`,
    )

  if (password !== password2)
    redirect(`/admin/cms/users/${encodeURIComponent(userId)}?cp_err=no_match`)

  await connectMongo()

  const target = await User.findOne({ _id: userId, deletedAt: null })
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

  let changed = false
  try {
    const passwordHash = await hashPassword(password)

    const result = await User.updateOne(
      { _id: userId, deletedAt: null },
      {
        $set: {
          passwordHash,
          passwordChangedAt: new Date(),
        },
        $inc: { __v: 1 },
      },
    )
    changed = result.matchedCount === 1
    if (changed) {
      // Revoke old sessions. Self changes receive a fresh session.
      await revokeAllSessionsForUser(userId)
      if (isSelf) await createSession(userId)
    }
  } catch {
    redirect(`/admin/cms/users/${encodeURIComponent(userId)}?cp_err=unknown`)
  }

  if (!changed)
    redirect(`/admin/cms/users/${encodeURIComponent(userId)}?cp_err=bad_id`)

  redirect(`/admin/cms/users/${encodeURIComponent(userId)}?cp_ok=1`)
}
