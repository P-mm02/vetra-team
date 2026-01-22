// src/app/(admin)/admin/cms/users/[id]/page.tsx
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import mongoose from 'mongoose'
import { connectMongo } from '@/lib/db/mongoose'
import { getCurrentUser } from '@/lib/auth/session'
import { User } from '@/models/User/User'
import styles from './page.module.css'

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

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

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

  const username = String(user.username || '—')
  const email = String(user.email || '—')
  const role = String(user.role || 'viewer')
  const active = Boolean(user.isActive)

  return (
    <main className={styles.page} aria-label="User detail">
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <Link className={styles.back} href="/admin/cms/users">
            ← Back to Users
          </Link>
          <h1 className={styles.h1}>{username}</h1>
          <p className={styles.sub}>
            {email} • <span className={styles.rolePill}>{role}</span>{' '}
            <span
              className={`${styles.statusPill} ${
                active ? styles.statusOn : styles.statusOff
              }`}
            >
              {active ? 'Active' : 'Disabled'}
            </span>
          </p>
        </div>

        <div className={styles.headerRight}>
          {/* placeholders for future actions */}
          <button className={styles.ghostBtn} type="button" disabled>
            Reset password (soon)
          </button>
          <button className={styles.primaryBtn} type="button" disabled>
            Save changes (soon)
          </button>
        </div>
      </header>

      <section className={styles.grid} aria-label="User info">
        <article className={styles.card}>
          <div className={styles.k}>User ID</div>
          <div className={styles.vMono}>{String(user._id)}</div>
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

      <section className={styles.panel} aria-label="Notes">
        <h2 className={styles.h2}>Next steps</h2>
        <ul className={styles.list}>
          <li>
            Add “Change role” + “Disable account” actions (server actions or
            API).
          </li>
          <li>Prevent editing your own dev role accidentally.</li>
          <li>Audit log for role/status changes.</li>
        </ul>
      </section>
    </main>
  )
}
