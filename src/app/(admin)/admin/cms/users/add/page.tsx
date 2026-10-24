// src/app/(admin)/admin/cms/users/add/page.tsx
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/session'
import styles from './page.module.css'
import AddUserForm from './AddUserForm'
import Notice from '@/app/(admin)/admin/Notice/Notice'
import { getCmsI18n } from '@/lib/cms/i18n-server'
import { userActionError } from '../i18n'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export async function generateMetadata() {
  const { t } = await getCmsI18n()
  return { title: t('Create user', 'สร้างผู้ใช้') }
}

type SearchParams = Record<string, string | string[] | undefined>

function canManageUsers(role: string) {
  return role === 'dev' || role === 'admin'
}

function pickOne(v: string | string[] | undefined) {
  if (!v) return ''
  return Array.isArray(v) ? (v[0] ?? '') : v
}

export default async function AddUserPage({
  searchParams,
}: {
  // ✅ Next.js 16: Promise
  searchParams: Promise<SearchParams>
}) {
  const { t } = await getCmsI18n()
  const me = await getCurrentUser()
  if (!me) redirect('/admin/login?next=/admin/cms/users/add')
  if (!canManageUsers(String(me.role))) redirect('/admin/cms')

  const sp = await searchParams

  const err = pickOne(sp.err)

  const username = pickOne(sp.username)
  const email = pickOne(sp.email)
  const requestedRole = pickOne(sp.role)
  const role =
    (requestedRole === 'dev' && me.role === 'dev') ||
    requestedRole === 'admin' ||
    requestedRole === 'editor' ||
    requestedRole === 'viewer'
      ? requestedRole
      : 'viewer'
  const isActiveParam = pickOne(sp.isActive)
  const isActive = isActiveParam ? isActiveParam !== '0' : true

  return (
    <main className={styles.page} aria-label={t('Add user', 'เพิ่มผู้ใช้')}>
      <header className={styles.header}>
        <div className={styles.headerText}>
          <div className={styles.breadcrumb}>
            <Link className={styles.back} href="/admin/cms/users">
              {'<'} {t('Users', 'ผู้ใช้')}
            </Link>
            <span className={styles.sep} aria-hidden="true">
              /
            </span>
            <span className={styles.here}>{t('Add', 'เพิ่ม')}</span>
          </div>

          <h1 className={styles.h1}>{t('Create user', 'สร้างผู้ใช้')}</h1>
          <p className={styles.sub}>
            {t('Users can sign in with their username or email and password.', 'ผู้ใช้เข้าสู่ระบบได้ด้วยชื่อผู้ใช้หรืออีเมลและรหัสผ่าน')}
          </p>
        </div>
      </header>

      <section className={styles.panel} aria-label={t('Create user form', 'แบบฟอร์มสร้างผู้ใช้')}>
        {err ? (
          <Notice
            tone="danger"
            title={t('Create user failed', 'สร้างผู้ใช้ไม่สำเร็จ')}
            message={userActionError(err, t, 'create')}
            code={400}
            dismissible
            clearQueryKey="err"
          />
        ) : null}

        <AddUserForm
          defaultUsername={username}
          defaultEmail={email}
          defaultRole={role}
          defaultIsActive={isActive}
          currentRole={String(me.role)}
        />
      </section>
    </main>
  )
}
