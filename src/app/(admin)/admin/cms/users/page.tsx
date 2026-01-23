// src/app/(admin)/admin/cms/users/page.tsx
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { connectMongo } from '@/lib/db/mongoose'
import { getCurrentUser } from '@/lib/auth/session'
import { User } from '@/models/User/User'
import styles from './page.module.css'
import UsersTableClient from './UsersTableClient'

type RowUser = {
  _id: unknown
  username?: string
  email?: string
  role?: string
  isActive?: boolean
  createdAt?: Date
  lastLoginAt?: Date | null
}

function fmtDate(d?: Date | null) {
  if (!d) return '—'
  try {
    return new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium' }).format(d)
  } catch {
    return '—'
  }
}

function canManageUsers(role: string) {
  return role === 'dev' || role === 'admin'
}

export default async function UsersPage() {
  const me = await getCurrentUser()
  if (!me) redirect('/admin/login?next=/admin/cms/users')
  if (!canManageUsers(String(me.role))) redirect('/admin/cms')

  await connectMongo()

  const users = await User.find({})
    .select({
      username: 1,
      email: 1,
      role: 1,
      isActive: 1,
      createdAt: 1,
      lastLoginAt: 1,
    })
    .sort({ createdAt: -1 })
    .limit(200)
    .lean<RowUser[]>()

  const rows = users.map((u) => {
    const id = String(u._id)
    return {
      id,
      username: String(u.username || '—'),
      email: String(u.email || '—'),
      role: String(u.role || 'viewer'),
      active: Boolean(u.isActive),
      created: fmtDate(u.createdAt),
      lastLogin: fmtDate(u.lastLoginAt),
    }
  })

  return (
    <main className={styles.page} aria-label="Users">
      <header className={styles.header}>
        <div className={styles.headerText}>
          <h1 className={styles.h1}>Users</h1>
          <p className={styles.sub}>
            Manage admin accounts, roles, and access status.
          </p>
        </div>

        <div className={styles.headerActions}>
          <Link href="/admin/cms/users/add">
            <button className={styles.btn} type="button">
              + Create user
            </button>
          </Link>
        </div>
      </header>

      <section className={styles.panel} aria-label="User list">
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Created</th>
                <th>Last login</th>
              </tr>
            </thead>

            {/* clickable rows (client) */}
            <UsersTableClient rows={rows} />
          </table>
        </div>

        <footer className={styles.foot}>
          <span className={styles.footDot} aria-hidden="true" />
          Showing up to {Math.min(rows.length, 200)} users.
        </footer>
      </section>
    </main>
  )
}
