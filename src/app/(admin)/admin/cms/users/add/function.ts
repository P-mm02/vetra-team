// src/app/(admin)/admin/cms/users/add/function.ts
'use server'

import { redirect } from 'next/navigation'
import { connectMongo } from '@/lib/db/mongoose'
import { getCurrentUser } from '@/lib/auth/session'
import { User } from '@/models/User/User'
import { hashPassword, isSafePasswordLength } from '@/lib/auth/password'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const USERNAME_REGEX = /^[a-z0-9](?:[a-z0-9_\.]*[a-z0-9])?$/i

function canManageUsers(role: string) {
  return role === 'dev' || role === 'admin'
}

function norm(v: unknown) {
  return typeof v === 'string' ? v.trim() : ''
}

function normLower(v: unknown) {
  return typeof v === 'string' ? v.trim().toLowerCase() : ''
}

function asRole(v: unknown) {
  const r = typeof v === 'string' ? v : ''
  const ok = r === 'dev' || r === 'admin' || r === 'editor' || r === 'viewer'
  return ok ? r : 'viewer'
}

export async function createUserAction(formData: FormData) {
  const me = await getCurrentUser()
  if (!me) redirect('/admin/login?next=/admin/cms/users/add')
  if (!canManageUsers(String(me.role)))
    redirect('/admin/cms/users/add?err=forbidden')

  const usernameRaw = normLower(formData.get('username'))
  const emailRaw = normLower(formData.get('email'))
  const roleRaw = asRole(formData.get('role'))
  const isActiveRaw = formData.get('isActive') === 'on'
  const password = norm(formData.get('password'))
  const password2 = norm(formData.get('password2'))

  const backQs = new URLSearchParams()
  backQs.set('username', usernameRaw)
  backQs.set('email', emailRaw)
  backQs.set('role', roleRaw)
  backQs.set('isActive', isActiveRaw ? '1' : '0')

  if (!usernameRaw || !emailRaw || !password || !password2) {
    backQs.set('err', 'missing')
    redirect(`/admin/cms/users/add?${backQs.toString()}`)
  }

  if (!EMAIL_REGEX.test(emailRaw)) {
    backQs.set('err', 'bad_email')
    redirect(`/admin/cms/users/add?${backQs.toString()}`)
  }

  if (
    usernameRaw.length < 3 ||
    usernameRaw.length > 30 ||
    !USERNAME_REGEX.test(usernameRaw)
  ) {
    backQs.set('err', 'bad_username')
    redirect(`/admin/cms/users/add?${backQs.toString()}`)
  }

  if (!isSafePasswordLength(password)) {
    backQs.set('err', 'bad_password')
    redirect(`/admin/cms/users/add?${backQs.toString()}`)
  }

  if (password !== password2) {
    backQs.set('err', 'no_match')
    redirect(`/admin/cms/users/add?${backQs.toString()}`)
  }

  await connectMongo()

  let createdId = ''

  try {
    const passwordHash = await hashPassword(password)

    const created = await User.create({
      username: usernameRaw,
      email: emailRaw,
      role: roleRaw,
      isActive: isActiveRaw,
      passwordHash,
      passwordChangedAt: new Date(),
    })

    createdId = String(created._id)
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
    redirect(`/admin/cms/users/add?${backQs.toString()}`)
  }

  // ✅ redirect outside try/catch so it won't be caught
  redirect(`/admin/cms/users/${createdId}`)
}
