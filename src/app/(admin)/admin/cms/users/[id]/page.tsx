// src/app/(admin)/admin/cms/users/[id]/page.tsx
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import mongoose from 'mongoose'
import { connectMongo } from '@/lib/db/mongoose'
import { getCurrentUser } from '@/lib/auth/session'
import { User } from '@/models/User/User'
import styles from './page.module.css'

import Notice from '@/app/(admin)/admin/Notice/Notice'
import EditUserForm from './EditUserForm'
import ChangePassword from './ChangePassword/ChangePassword'
import DeleteUser from './DeleteUser/DeleteUser'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

type UserView = {
  _id: unknown
  username?: string
  email?: string
  role?: string
  isActive?: boolean
  createdAt?: Date
  updatedAt?: Date
  lastLoginAt?: Date | null
}

type SearchParams = Record<string, string | string[] | undefined>

function fmtDateTime(d?: Date | null) {
  if (!d) return '—'
  try {
    return new Intl.DateTimeFormat('en-GB', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(d)
  } catch {
    return '—'
  }
}

function canManageUsers(role: string) {
  return role === 'dev' || role === 'admin'
}

function pickOne(v: string | string[] | undefined) {
  if (!v) return ''
  return Array.isArray(v) ? (v[0] ?? '') : v
}

function errText(code: string) {
  switch (code) {
    case 'missing':
      return 'Please fill in all required fields.'
    case 'bad_email':
      return 'Email format looks invalid.'
    case 'bad_username':
      return 'Username must be 3–30 chars and only contain letters, numbers, underscore (_) or dot (.)'
    case 'dup_email':
      return 'This email is already used.'
    case 'dup_username':
      return 'This username is already used.'
    case 'forbidden':
      return 'You don’t have permission to edit this user (dev-only restriction).'
    case 'self_edit':
      return 'You cannot change your own role or disable your own account here.'
    case 'bad_id':
      return 'Invalid user id.'
    default:
      return 'Something went wrong. Please try again.'
  }
}

function cpErrText(code: string) {
  switch (code) {
    case 'missing':
      return 'Please fill in all required fields.'
    case 'bad_password':
      return 'Password must be 8–200 characters.'
    case 'no_match':
      return 'Passwords do not match.'
    case 'forbidden':
      return 'You don’t have permission to change this password.'
    case 'bad_id':
      return 'Invalid user id.'
    default:
      return 'Something went wrong. Please try again.'
  }
}

export default async function UserEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<SearchParams>
}) {
  const { id } = await params
  const sp = await searchParams

  const me = await getCurrentUser()
  if (!me)
    redirect(`/admin/login?next=/admin/cms/users/${encodeURIComponent(id)}`)
  if (!canManageUsers(String(me.role))) redirect('/admin/cms')

  if (!mongoose.Types.ObjectId.isValid(id)) notFound()

  await connectMongo()

  const user = await User.findById(id)
    .select({
      username: 1,
      email: 1,
      role: 1,
      isActive: 1,
      createdAt: 1,
      updatedAt: 1,
      lastLoginAt: 1,
    })
    .lean<UserView | null>()

  if (!user) notFound()

  const userId = String(user._id)

  // ✅ DB truth (do NOT trust querystring for locks)
  const targetRoleNow = String(user.role || 'viewer')

  // ✅ edit form qs
  const err = pickOne(sp.err)
  const ok = pickOne(sp.ok)

  const qUsername = pickOne(sp.username)
  const qEmail = pickOne(sp.email)
  const qRole = pickOne(sp.role)
  const qIsActive = pickOne(sp.isActive)

  const username = qUsername || String(user.username || '')
  const email = qEmail || String(user.email || '')
  const role = qRole || targetRoleNow
  const isActive = qIsActive !== '' ? qIsActive !== '0' : Boolean(user.isActive)

  // ✅ change password qs (separate)
  const cpErr = pickOne(sp.cp_err)
  const cpOk = pickOne(sp.cp_ok)

  const isSelf = String(me.id) === userId

  return (
    <main className={styles.page} aria-label="Edit user">
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <Link className={styles.back} href="/admin/cms/users">
            {'<'} Back to Users
          </Link>

          <h1 className={styles.h1}>Edit: {username || '—'}</h1>

          <p className={styles.sub}>
            {email || '—'} • <span className={styles.rolePill}>{role}</span>{' '}
            <span
              className={`${styles.statusPill} ${
                isActive ? styles.statusOn : styles.statusOff
              }`}
            >
              {isActive ? 'Active' : 'Disabled'}
            </span>
          </p>
        </div>

        <div className={styles.headerRight}>
          <button className={styles.ghostBtn} type="button" disabled>
            Reset password (soon)
          </button>
        </div>
      </header>

      <section className={styles.grid} aria-label="User meta">
        <article className={styles.card}>
          <div className={styles.k}>User ID</div>
          <div className={styles.vMono}>{userId}</div>
        </article>

        <article className={styles.card}>
          <div className={styles.k}>Created</div>
          <div className={styles.v}>{fmtDateTime(user.createdAt)}</div>
        </article>

        <article className={styles.card}>
          <div className={styles.k}>Updated</div>
          <div className={styles.v}>{fmtDateTime(user.updatedAt)}</div>
        </article>

        <article className={styles.card}>
          <div className={styles.k}>Last login</div>
          <div className={styles.v}>{fmtDateTime(user.lastLoginAt)}</div>
        </article>
      </section>

      <section className={styles.panel} aria-label="Edit form">
        {err ? (
          <Notice
            tone="danger"
            title="Save failed"
            message={errText(err)}
            code={400}
            dismissible
            clearQueryKey="err"
          />
        ) : ok ? (
          <Notice
            tone="success"
            title="Saved"
            message={ok}
            code={200}
            dismissible
            clearQueryKey="ok"
          />
        ) : null}

        <EditUserForm
          userId={userId}
          defaultUsername={username}
          defaultEmail={email}
          defaultRole={role}
          defaultIsActive={isActive}
          meRole={String(me.role)}
          isSelf={isSelf}
          targetRoleNow={targetRoleNow}
        />
      </section>

      <section className={styles.panel} aria-label="Change password">
        {cpErr ? (
          <Notice
            tone="danger"
            title="Change password failed"
            message={cpErrText(cpErr)}
            code={400}
            dismissible
            clearQueryKey="cp_err"
          />
        ) : cpOk ? (
          <Notice
            tone="success"
            title="Password updated"
            message="New password saved."
            code={200}
            dismissible
            clearQueryKey="cp_ok"
          />
        ) : null}

        <ChangePassword userId={userId} />
      </section>

      <DeleteUser
        userId={userId}
        username={username || '—'}
        targetRole={role}
        meId={String(me.id)}
        meRole={String(me.role)}
        errCode={err ? err : undefined}
      />
    </main>
  )
}
