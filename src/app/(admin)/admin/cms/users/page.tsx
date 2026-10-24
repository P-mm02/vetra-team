// src/app/(admin)/admin/cms/users/page.tsx
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { connectMongo } from '@/lib/db/mongoose'
import { getCurrentUser } from '@/lib/auth/session'
import { User } from '@/models/User/User'
import styles from './page.module.css'
import UsersTableClient from './UsersTableClient'
import Notice from '@/app/(admin)/admin/Notice/Notice'
import { getCmsI18n } from '@/lib/cms/i18n-server'

const PAGE_SIZE = 50

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export async function generateMetadata() {
  const { t } = await getCmsI18n()
  return { title: t('Users', 'ผู้ใช้') }
}

type RowUser = {
  _id: unknown
  username?: string
  email?: string
  role?: string
  isActive?: boolean
  createdAt?: Date
  lastLoginAt?: Date | null
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
  const { t, formatDate, formatNumber } = await getCmsI18n()
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
      created: formatDate(u.createdAt, { dateStyle: 'medium' }),
      lastLogin: formatDate(u.lastLoginAt, { dateStyle: 'medium' }),
    }
  })

  return (
    <main className={styles.page} aria-label={t('Users', 'ผู้ใช้')}>
      <header className={styles.header}>
        <div className={styles.headerText}>
          <h1 className={styles.h1}>{t('Users', 'ผู้ใช้')}</h1>
          <p className={styles.sub}>
            {t('Manage accounts, roles, and access status. Removed accounts stay in Trash for 30 days.', 'จัดการบัญชี สิทธิ์ และสถานะการเข้าถึง บัญชีที่ถูกลบจะอยู่ในถังขยะเป็นเวลา 30 วัน')}
          </p>
        </div>

        <div className={styles.headerActions}>
          <Link className={styles.btn} href="/admin/cms/trash">{t('Trash', 'ถังขยะ')}</Link>
          <Link className={styles.btn} href="/admin/cms/users/add">{t('Create user', 'สร้างผู้ใช้')}</Link>
        </div>
      </header>

      {pickOne(sp.deleted) === '1' ? (
        <Notice
          tone="success"
          title={t('Moved to Trash', 'ย้ายไปถังขยะแล้ว')}
          message={t('This user can be restored for 30 days. Their sessions have been revoked.', 'สามารถกู้คืนผู้ใช้นี้ได้ภายใน 30 วัน ระบบได้ยกเลิกเซสชันการเข้าสู่ระบบของบัญชีนี้แล้ว')}
          clearQueryKey="deleted"
        />
      ) : null}

      <form className={styles.searchForm} action="/admin/cms/users" method="get" role="search">
        <label htmlFor="user-search">{t('Search users', 'ค้นหาผู้ใช้')}</label>
        <div className={styles.searchControls}>
          <input id="user-search" name="q" type="search" defaultValue={query} maxLength={100} placeholder={t('Username or email', 'ชื่อผู้ใช้หรืออีเมล')} autoComplete="off" />
          <button type="submit" className={styles.searchButton}>{t('Search', 'ค้นหา')}</button>
          {query && <Link className={styles.clearSearch} href="/admin/cms/users">{t('Clear', 'ล้างการค้นหา')}</Link>}
        </div>
      </form>

      <section className={styles.panel} aria-label={t('User list', 'รายการผู้ใช้')}>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>{t('User', 'ผู้ใช้')}</th>
                <th>{t('Email', 'อีเมล')}</th>
                <th>{t('Role', 'สิทธิ์')}</th>
                <th>{t('Status', 'สถานะ')}</th>
                <th>{t('Created', 'วันที่สร้าง')}</th>
                <th>{t('Last login', 'เข้าสู่ระบบล่าสุด')}</th>
              </tr>
            </thead>

            {/* clickable rows (client) */}
            <UsersTableClient rows={rows} emptyMessage={query ? t('No users match this search.', 'ไม่พบผู้ใช้ที่ตรงกับคำค้นหา') : t('No users found.', 'ยังไม่มีผู้ใช้')} />
          </table>
        </div>

        <footer className={styles.foot}>
          <span className={styles.resultCount}>
            <span className={styles.footDot} aria-hidden="true" />
            {total === 0 ? t('No users to show', 'ไม่มีผู้ใช้ที่จะแสดง') : t(`Showing ${formatNumber((page - 1) * PAGE_SIZE + 1)}–${formatNumber((page - 1) * PAGE_SIZE + rows.length)} of ${formatNumber(total)} users`, `แสดงผู้ใช้ ${formatNumber((page - 1) * PAGE_SIZE + 1)}–${formatNumber((page - 1) * PAGE_SIZE + rows.length)} จาก ${formatNumber(total)} คน`)}
          </span>
          <nav className={styles.pagination} aria-label={t('Users pages', 'หน้ารายการผู้ใช้')}>
            {page > 1 ? <Link href={pageHref(query, page - 1)} className={styles.pageButton}>{t('Previous', 'ก่อนหน้า')}</Link> : <span className={`${styles.pageButton} ${styles.pageDisabled}`}>{t('Previous', 'ก่อนหน้า')}</span>}
            <span className={styles.pageInfo}>{t(`Page ${formatNumber(page)} of ${formatNumber(totalPages)}`, `หน้า ${formatNumber(page)} จาก ${formatNumber(totalPages)}`)}</span>
            {page < totalPages ? <Link href={pageHref(query, page + 1)} className={styles.pageButton}>{t('Next', 'ถัดไป')}</Link> : <span className={`${styles.pageButton} ${styles.pageDisabled}`}>{t('Next', 'ถัดไป')}</span>}
          </nav>
        </footer>
      </section>
    </main>
  )
}
