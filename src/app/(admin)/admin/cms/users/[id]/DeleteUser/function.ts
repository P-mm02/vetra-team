// src/app/(admin)/admin/cms/users/[id]/DeleteUser/function.ts
'use server'

import mongoose from 'mongoose'
import { redirect } from 'next/navigation'
import { connectMongo } from '@/lib/db/mongoose'
import { getCurrentUser, revokeAllSessionsForUser } from '@/lib/auth/session'
import { User } from '@/models/User/User'

function canManageUsers(role: string) {
  return role === 'dev' || role === 'admin'
}

function backToDetail(id: string, err?: string) {
  const url = new URLSearchParams()
  if (err) url.set('err', err)
  return `/admin/cms/users/${encodeURIComponent(id)}${
    url.toString() ? `?${url.toString()}` : ''
  }`
}

export async function deleteUserAction(formData: FormData) {
  const me = await getCurrentUser()
  if (!me) redirect('/admin/login?next=/admin/cms/users')

  const myRole = String(me.role)
  if (!canManageUsers(myRole)) redirect('/admin/cms')

  const id = String(formData.get('id') || '')
  if (!mongoose.isValidObjectId(id)) redirect('/admin/cms/users?err=bad_id')

  // prevent deleting yourself
  if (String(me.id) === id) redirect(backToDetail(id, 'self_delete'))

  await connectMongo()

  const target = await User.findById(id)
    .select({ role: 1 })
    .lean<{ _id: mongoose.Types.ObjectId; role?: string } | null>()

  if (!target) {
    // already deleted -> go back to list
    redirect('/admin/cms/users')
  }

  const targetRole = String(target.role || 'viewer')

  // only dev can delete dev
  if (targetRole === 'dev' && myRole !== 'dev') {
    redirect(backToDetail(id, 'forbidden'))
  }

  await User.deleteOne({ _id: new mongoose.Types.ObjectId(id) })
  await revokeAllSessionsForUser(id).catch(() => null)

  redirect('/admin/cms/users?deleted=1')
}
