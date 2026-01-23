// src/app/(admin)/admin/cms/users/add/AddUserForm.tsx
'use client'

import { useMemo, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import styles from './page.module.css'
import { createUserAction } from './function'
import {
  validateAddUser,
  hasErrors,
  normalizeLower,
  type FieldErrors,
} from './validator'

type Props = {
  defaultUsername: string
  defaultEmail: string
  defaultRole: string
  defaultIsActive: boolean
  testMode?: boolean
}

export default function AddUserForm({
  defaultUsername,
  defaultEmail,
  defaultRole,
  defaultIsActive,
  testMode = false,
}: Props) {
  const router = useRouter()
  const pathname = usePathname()

  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [values, setValues] = useState({
    username: defaultUsername,
    email: defaultEmail,
    role: defaultRole,
    isActive: defaultIsActive,
    password: '',
    password2: '',
  })

  const errors: FieldErrors = useMemo(
    () =>
      validateAddUser({
        username: values.username,
        email: values.email,
        password: values.password,
        password2: values.password2,
      }),
    [values.username, values.email, values.password, values.password2],
  )

  const canSubmit = !hasErrors(errors)

  function mark(name: string) {
    setTouched((p) => ({ ...p, [name]: true }))
  }

  function set<K extends keyof typeof values>(key: K, val: (typeof values)[K]) {
    setValues((p) => ({ ...p, [key]: val }))
  }

  function touchAll() {
    setTouched({
      username: true,
      email: true,
      password: true,
      password2: true,
    })
  }

  return (
    <form
      className={styles.form}
      action={testMode ? undefined : createUserAction}
      onSubmit={(e) => {
        // ✅ Invalid: block submit + show field errors (and you can also navigate to ?err=missing if you want)
        if (!canSubmit) {
          e.preventDefault()
          touchAll()

          // Optional: simulate error via URL
          // const qs = new URLSearchParams()
          // qs.set('err', 'missing')
          // router.replace(`${pathname}?${qs.toString()}`)
          // router.refresh()

          return
        }

        const normalizedUsername = normalizeLower(values.username)
        const normalizedEmail = normalizeLower(values.email)

        // keep UI normalized either way
        setValues((p) => ({
          ...p,
          username: normalizedUsername,
          email: normalizedEmail,
        }))

        // ✅ Test mode: do NOT submit — instead navigate to show Notice via ?ok=
        if (testMode) {
          e.preventDefault()

          const qs = new URLSearchParams()
          qs.set(
            'ok',
            `Passed validation. Would create user "${normalizedUsername}" (${normalizedEmail}).`,
          )

          router.replace(`${pathname}?${qs.toString()}`)
          router.refresh()
          return
        }

        // ✅ Real mode: allow submit (server action runs)
      }}
    >
      <div className={styles.grid}>
        <label className={styles.field}>
          <span className={styles.label}>Username *</span>
          <input
            className={styles.input}
            name="username"
            placeholder="e.g. vetra_admin"
            value={values.username}
            autoComplete="username"
            required
            minLength={3}
            maxLength={30}
            onChange={(e) => set('username', e.target.value)}
            onBlur={() => mark('username')}
          />
          <span className={styles.hint}>
            Allowed: letters/numbers, underscore, dot. Lowercase preferred.
          </span>
          {touched.username && errors.username ? (
            <div className={styles.fieldError}>{errors.username}</div>
          ) : null}
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Email *</span>
          <input
            className={styles.input}
            name="email"
            type="email"
            placeholder="e.g. admin@yourdomain.com"
            value={values.email}
            autoComplete="email"
            required
            onChange={(e) => set('email', e.target.value)}
            onBlur={() => mark('email')}
          />
          <span className={styles.hint}>
            Used for recovery/reference (not for login).
          </span>
          {touched.email && errors.email ? (
            <div className={styles.fieldError}>{errors.email}</div>
          ) : null}
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Role *</span>
          <select
            className={styles.select}
            name="role"
            value={values.role}
            onChange={(e) => set('role', e.target.value)}
          >
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
              checked={values.isActive}
              onChange={(e) => set('isActive', e.target.checked)}
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
            maxLength={200}
            value={values.password}
            onChange={(e) => set('password', e.target.value)}
            onBlur={() => mark('password')}
          />
          {touched.password && errors.password ? (
            <div className={styles.fieldError}>{errors.password}</div>
          ) : null}
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
            maxLength={200}
            value={values.password2}
            onChange={(e) => set('password2', e.target.value)}
            onBlur={() => mark('password2')}
          />
          {touched.password2 && errors.password2 ? (
            <div className={styles.fieldError}>{errors.password2}</div>
          ) : null}
        </label>
      </div>

      <footer className={styles.actions}>
        <a className={styles.ghostBtn} href="/admin/cms/users">
          Cancel
        </a>

        {/* ✅ DO NOT disable. Let user click to see the UX */}
        <button className={styles.btn} type="submit">
          Create user
        </button>
      </footer>
    </form>
  )
}
