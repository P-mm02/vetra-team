// src/app/(admin)/admin/cms/users/add/page.tsx
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/session'
import styles from './page.module.css'
import { createUserAction } from './function'

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
    case 'unknown':
    default:
      return 'Something went wrong. Please try again.'
  }
}

export default async function AddUserPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const me = await getCurrentUser()
  if (!me) redirect('/admin/login?next=/admin/cms/users/add')
  if (!canManageUsers(String(me.role))) redirect('/admin/cms')

  const err = pickOne(searchParams.err)
  const username = pickOne(searchParams.username)
  const email = pickOne(searchParams.email)
  const role = pickOne(searchParams.role) || 'viewer'
  const isActiveParam = pickOne(searchParams.isActive)
  const isActive = isActiveParam ? isActiveParam !== '0' : true

  return (
    <main className={styles.page} aria-label="Add user">
      <header className={styles.header}>
        <div className={styles.headerText}>
          <div className={styles.breadcrumb}>
            <Link className={styles.back} href="/admin/cms/users">
              ← Users
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
        {err ? (
          <div className={styles.error} role="status" aria-live="polite">
            <span className={styles.errorDot} aria-hidden="true" />
            {errText(err)}
          </div>
        ) : null}

        <form className={styles.form} action={createUserAction}>
          <div className={styles.grid}>
            <label className={styles.field}>
              <span className={styles.label}>Username *</span>
              <input
                className={styles.input}
                name="username"
                placeholder="e.g. vetra_admin"
                defaultValue={username}
                autoComplete="username"
                required
                minLength={3}
                maxLength={30}
              />
              <span className={styles.hint}>
                Allowed: letters/numbers, underscore, dot. Lowercase preferred.
              </span>
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Email *</span>
              <input
                className={styles.input}
                name="email"
                type="email"
                placeholder="e.g. admin@yourdomain.com"
                defaultValue={email}
                autoComplete="email"
                required
              />
              <span className={styles.hint}>
                Used for recovery/reference (not for login).
              </span>
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Role *</span>
              <select className={styles.select} name="role" defaultValue={role}>
                <option value="dev">dev</option>
                <option value="admin">admin</option>
                <option value="editor">editor</option>
                <option value="viewer">viewer</option>
              </select>
              <span className={styles.hint}>
                Only <b>dev/admin</b> can manage users.
              </span>
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Status</span>
              <div className={styles.switchRow}>
                <input
                  className={styles.check}
                  id="isActive"
                  name="isActive"
                  type="checkbox"
                  defaultChecked={isActive}
                />
                <span className={styles.switchText}>
                  Active (can login and access CMS)
                </span>
              </div>
              <span className={styles.hint}>
                Disable if you want to revoke access without deleting.
              </span>
            </label>
          </div>

          <div className={styles.divider} />

          <div className={styles.grid2}>
            <label className={styles.field}>
              <span className={styles.label}>Password *</span>
              <input
                className={styles.input}
                name="password"
                type="password"
                placeholder="Min 8 characters"
                autoComplete="new-password"
                required
                minLength={8}
              />
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Confirm password *</span>
              <input
                className={styles.input}
                name="password2"
                type="password"
                placeholder="Re-type password"
                autoComplete="new-password"
                required
                minLength={8}
              />
            </label>
          </div>

          <footer className={styles.actions}>
            <Link className={styles.ghostBtn} href="/admin/cms/users">
              Cancel
            </Link>
            <button className={styles.btn} type="submit">
              + Create user
            </button>
          </footer>
        </form>
      </section>

      <aside className={styles.note} aria-label="Notes">
        <div className={styles.noteCard}>
          <div className={styles.noteTitle}>Tip</div>
          <div className={styles.noteText}>
            Use a unique <b>email</b> even if the username is the main login
            identifier.
          </div>
        </div>
      </aside>
    </main>
  )
}
