// src/app/(admin)/admin/cms/users/page.tsx
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { connectMongo } from '@/lib/db/mongoose'
import { getCurrentUser } from '@/lib/auth/session'
import { User } from '@/models/User/User'
import styles from './page.module.css'
import UsersTableClient from './UsersTableClient'
import Notice from '@/app/(admin)/admin/Notice/Notice'

const PAGE_SIZE = 50

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

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

function pickOne(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] || '' : value || ''
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function pageHref(query: string, page: number) {
  const params = new URLSearchParams()
  if (query) params.set('q', query)
  if (page > 1) params.set('page', String(page))
  const search = params.toString()
  return search ? `/admin/cms/users?${search}` : '/admin/cms/users'
}

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const sp = await searchParams
  const me = await getCurrentUser()
  if (!me) redirect('/admin/login?next=/admin/cms/users')
  if (!canManageUsers(String(me.role))) redirect('/admin/cms')

  const query = pickOne(sp.q).trim().slice(0, 100)
  const rawPage = pickOne(sp.page)
  const parsedPage = /^\d{1,12}$/.test(rawPage) ? Number(rawPage) : 1
  const requestedPage = Number.isSafeInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1
  const search = query ? new RegExp(escapeRegex(query), 'i') : null
  const filter = search
    ? { deletedAt: null, $or: [{ username: search }, { email: search }] }
    : { deletedAt: null }

  await connectMongo()
  const total = await User.countDocuments(filter)
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const page = Math.min(requestedPage, totalPages)

  const users = await User.find(filter)
    .select({
      username: 1,
      email: 1,
      role: 1,
      isActive: 1,
      createdAt: 1,
      lastLoginAt: 1,
    })
    .sort({ createdAt: -1, _id: -1 })
    .skip((page - 1) * PAGE_SIZE)
    .limit(PAGE_SIZE)
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
            Manage admin accounts, roles, and access status. Removed accounts stay in Trash for 30 days.
          </p>
        </div>

        <div className={styles.headerActions}>
          <Link className={styles.btn} href="/admin/cms/trash">Trash</Link>
          <Link className={styles.btn} href="/admin/cms/users/add">Create user</Link>
        </div>
      </header>

      {pickOne(sp.deleted) === '1' ? (
        <Notice
          tone="success"
          title="Moved to Trash"
          message="This user can be restored for 30 days. Their sessions have been revoked."
          clearQueryKey="deleted"
        />
      ) : null}

      <form className={styles.searchForm} action="/admin/cms/users" method="get" role="search">
        <label htmlFor="user-search">Search users</label>
        <div className={styles.searchControls}>
          <input id="user-search" name="q" type="search" defaultValue={query} maxLength={100} placeholder="Username or email" autoComplete="off" />
          <button type="submit" className={styles.searchButton}>Search</button>
          {query && <Link className={styles.clearSearch} href="/admin/cms/users">Clear</Link>}
        </div>
      </form>

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
            <UsersTableClient rows={rows} emptyMessage={query ? 'No users match this search.' : 'No users found.'} />
          </table>
        </div>

        <footer className={styles.foot}>
          <span className={styles.resultCount}>
            <span className={styles.footDot} aria-hidden="true" />
            {total === 0 ? 'No users to show' : `Showing ${(page - 1) * PAGE_SIZE + 1}–${(page - 1) * PAGE_SIZE + rows.length} of ${total} users`}
          </span>
          <nav className={styles.pagination} aria-label="Users pages">
            {page > 1 ? <Link href={pageHref(query, page - 1)} className={styles.pageButton}>Previous</Link> : <span className={`${styles.pageButton} ${styles.pageDisabled}`}>Previous</span>}
            <span className={styles.pageInfo}>Page {page} of {totalPages}</span>
            {page < totalPages ? <Link href={pageHref(query, page + 1)} className={styles.pageButton}>Next</Link> : <span className={`${styles.pageButton} ${styles.pageDisabled}`}>Next</span>}
          </nav>
        </footer>
      </section>
    </main>
  )
}
