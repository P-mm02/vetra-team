// src/app/(admin)/admin/cms/users/page.tsx
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { connectMongo } from '@/lib/db/mongoose'
import { getCurrentUser } from '@/lib/auth/session'
import { User } from '@/models/User/User'
import styles from './page.module.css'

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
          {/* placeholder for future "Create user" */}
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

            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td className={styles.empty} colSpan={6}>
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const id = String(u._id)
                  const username = String(u.username || '—')
                  const email = String(u.email || '—')
                  const role = String(u.role || 'viewer')
                  const active = Boolean(u.isActive)

                  return (
                    <tr key={id}>
                      <td>
                        <Link
                          className={styles.userLink}
                          href={`/admin/cms/users/${id}`}
                        >
                          <span className={styles.userName}>{username}</span>
                          <span className={styles.userId}>{id}</span>
                        </Link>
                      </td>

                      <td className={styles.mono}>{email}</td>

                      <td>
                        <span className={styles.rolePill}>{role}</span>
                      </td>

                      <td>
                        <span
                          className={`${styles.statusPill} ${
                            active ? styles.statusOn : styles.statusOff
                          }`}
                        >
                          {active ? 'Active' : 'Disabled'}
                        </span>
                      </td>

                      <td className={styles.mono}>{fmtDate(u.createdAt)}</td>
                      <td className={styles.mono}>{fmtDate(u.lastLoginAt)}</td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        <footer className={styles.foot}>
          <span className={styles.footDot} aria-hidden="true" />
          Showing up to {Math.min(users.length, 200)} users.
        </footer>
      </section>
    </main>
  )
}
