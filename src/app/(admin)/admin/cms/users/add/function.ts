// src/app/(admin)/admin/cms/users/add/function.ts
'use server'

import { redirect } from 'next/navigation'
import { connectMongo } from '@/lib/db/mongoose'
import { assertSameOriginStrict, getCurrentUser } from '@/lib/auth/session'
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

export async function createUserAction(formData: FormData) {
  // ✅ Strict CSRF guard for admin mutations
  try {
    await assertSameOriginStrict()
  } catch {
    redirect('/admin/cms/users/add?err=csrf')
  }

  const me = await getCurrentUser()
  if (!me) redirect('/admin/login?next=/admin/cms/users/add')
  if (!canManageUsers(String(me.role)))
    redirect('/admin/cms/users/add?err=forbidden')

  const usernameRaw = normLower(formData.get('username'))
  const emailRaw = normLower(formData.get('email'))

  const roleParsed = parseRole(formData.get('role'))
  const isActiveField = formData.get('isActive')

  // default: unchecked -> null (missing) -> false? (but your UI likely sets it)
  // We'll treat "missing" as false only if it truly isn't provided.
  // If provided but invalid -> reject.
  let isActiveRaw = false
  if (isActiveField == null) {
    isActiveRaw = false
  } else {
    const parsed = parseBoolLike(isActiveField)
    if (parsed === null) {
      const qs = new URLSearchParams()
      qs.set('err', 'bad_active')
      redirect(`/admin/cms/users/add?${qs.toString()}`)
    }
    isActiveRaw = parsed
  }

  const password = norm(formData.get('password'))
  const password2 = norm(formData.get('password2'))

  const backQs = new URLSearchParams()
  backQs.set('username', usernameRaw)
  backQs.set('email', emailRaw) // (optional privacy improvement: remove later)
  backQs.set('role', roleParsed ?? 'viewer')
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

  // ✅ Reject invalid role instead of silently falling back
  if (!roleParsed) {
    backQs.set('err', 'bad_role')
    redirect(`/admin/cms/users/add?${backQs.toString()}`)
  }

  // ✅ Only dev can create a dev user
  const meRole = String(me.role)
  if (roleParsed === 'dev' && meRole !== 'dev') {
    backQs.set('err', 'forbidden')
    redirect(`/admin/cms/users/add?${backQs.toString()}`)
  }

  await connectMongo()

  let createdId = ''

  try {
    const passwordHash = await hashPassword(password)

    const created = await User.create({
      username: usernameRaw,
      email: emailRaw,
      role: roleParsed,
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

  redirect(`/admin/cms/users/${createdId}`)
}
