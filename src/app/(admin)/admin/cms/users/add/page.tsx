// src/app/(admin)/admin/cms/users/add/page.tsx
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/session'
import styles from './page.module.css'
import AddUserForm from './AddUserForm'
import Notice from '@/app/(admin)/admin/Notice/Notice'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

type SearchParams = Record<string, string | string[] | undefined>

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
    case 'bad_password':
      return 'Password must be at least 8 characters.'
    case 'no_match':
      return 'Passwords do not match.'
    case 'dup_email':
      return 'This email is already used.'
    case 'dup_username':
      return 'This username is already used.'
    case 'forbidden':
      return 'You don’t have permission to manage users.'
    default:
      return 'Something went wrong. Please try again.'
  }
}

export default async function AddUserPage({
  searchParams,
}: {
  // ✅ Next.js 16: Promise
  searchParams: Promise<SearchParams>
}) {
  const me = await getCurrentUser()
  if (!me) redirect('/admin/login?next=/admin/cms/users/add')
  if (!canManageUsers(String(me.role))) redirect('/admin/cms')

  const sp = await searchParams

  const err = pickOne(sp.err)
  const ok = pickOne(sp.ok)

  const username = pickOne(sp.username)
  const email = pickOne(sp.email)
  const role = pickOne(sp.role) || 'viewer'
  const isActiveParam = pickOne(sp.isActive)
  const isActive = isActiveParam ? isActiveParam !== '0' : true

  return (
    <main className={styles.page} aria-label="Add user">
      <header className={styles.header}>
        <div className={styles.headerText}>
          <div className={styles.breadcrumb}>
            <Link className={styles.back} href="/admin/cms/users">
              {'<'} Users
            </Link>
            <span className={styles.sep} aria-hidden="true">
              /
            </span>
            <span className={styles.here}>Add</span>
          </div>

          <h1 className={styles.h1}>Create user</h1>
          <p className={styles.sub}>
            Login uses <span className={styles.kbd}>username</span> +{' '}
            <span className={styles.kbd}>password</span>. Email is for recovery
            and reference.
          </p>
        </div>
      </header>

      <section className={styles.panel} aria-label="Create user form">
        {/* ✅ show Notice only when err/ok exists */}
        {err ? (
          <Notice
            tone="danger"
            title="Create user failed"
            message={errText(err)}
            code={400}
            dismissible
            clearQueryKey="err"
          />
        ) : ok ? (
          <Notice
            tone="success"
            title="Looks good (test mode)"
            message={ok}
            code={200}
            dismissible
            clearQueryKey="ok"
          />
        ) : null}

        <AddUserForm
          defaultUsername={username}
          defaultEmail={email}
          defaultRole={role}
          defaultIsActive={isActive}
          testMode={false} // ✅ Option A enabled
        />
      </section>
    </main>
  )
}
