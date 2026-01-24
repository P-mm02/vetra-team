// src/app/(admin)/admin/cms/users/[id]/EditUserForm.tsx
'use client'

import { useMemo, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { updateUserAction } from './function'
import styles from './EditUserForm.module.css'

import VetraSelect, {
  type SelectOption,
} from '@/app/(admin)/admin/cms/_components/ui/VetraSelect/VetraSelect'

import {
  EMAIL_REGEX,
  USERNAME_REGEX,
  hasErrors,
  normalizeLower,
} from '../add/validator'

type FieldErrors = Partial<Record<'username' | 'email', string>>

function validateEditUser(v: { username: string; email: string }): FieldErrors {
  const e: FieldErrors = {}

  const username = normalizeLower(v.username)
  const email = normalizeLower(v.email)

  if (!username) e.username = 'Username is required.'
  else if (username.length < 3 || username.length > 30)
    e.username = 'Username must be 3–30 characters.'
  else if (!USERNAME_REGEX.test(username))
    e.username =
      'Only letters/numbers, underscore (_) or dot (.), no leading/trailing symbol.'

  if (!email) e.email = 'Email is required.'
  else if (email.length < 3 || email.length > 254)
    e.email = 'Email must be 3–254 characters.'
  else if (!EMAIL_REGEX.test(email)) e.email = 'Email format looks invalid.'

  return e
}

type Role = 'dev' | 'admin' | 'editor' | 'viewer'

const ROLE_OPTIONS: SelectOption<Role>[] = [
  { value: 'dev', label: 'dev' },
  { value: 'admin', label: 'admin' },
  { value: 'editor', label: 'editor' },
  { value: 'viewer', label: 'viewer' },
]

type Props = {
  userId: string
  defaultUsername: string
  defaultEmail: string
  defaultRole: string
  defaultIsActive: boolean
  meRole: string
  isSelf: boolean
  targetRoleNow: string // ✅ DB truth for locks
}

function asRole(v: string): Role {
  return v === 'dev' || v === 'admin' || v === 'editor' || v === 'viewer'
    ? v
    : 'viewer'
}

export default function EditUserForm({
  userId,
  defaultUsername,
  defaultEmail,
  defaultRole,
  defaultIsActive,
  meRole,
  isSelf,
  targetRoleNow,
}: Props) {
  const router = useRouter()
  const pathname = usePathname()

  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [values, setValues] = useState({
    username: defaultUsername,
    email: defaultEmail,
    role: asRole(defaultRole),
    isActive: defaultIsActive,
  })

  const errors = useMemo(
    () => validateEditUser({ username: values.username, email: values.email }),
    [values.username, values.email],
  )

  const canSubmit = !hasErrors(errors as any)

  function mark(name: string) {
    setTouched((p) => ({ ...p, [name]: true }))
  }

  function set<K extends keyof typeof values>(key: K, val: (typeof values)[K]) {
    setValues((p) => ({ ...p, [key]: val }))
  }

  function touchAll() {
    setTouched({ username: true, email: true })
  }

  const isDevMe = meRole === 'dev'
  const isDevTarget = targetRoleNow === 'dev'
  const lockDevTarget = isDevTarget && !isDevMe

  // Self safety: allow username/email, but lock role/status so you can't lock yourself out
  const lockRoleAndStatus = isSelf

  // ✅ final locks
  const lockIdentity = lockDevTarget // username/email
  const roleDisabled = lockDevTarget || lockRoleAndStatus
  const statusDisabled = lockDevTarget || lockRoleAndStatus

  const saveDisabled = lockDevTarget // no changes allowed for admin on dev target

  return (
    <form
      className={styles.form}
      action={updateUserAction.bind(null, userId)}
      onSubmit={(e) => {
        if (saveDisabled) {
          e.preventDefault()
          return
        }

        if (!canSubmit) {
          e.preventDefault()
          touchAll()
          return
        }

        const normalizedUsername = normalizeLower(values.username)
        const normalizedEmail = normalizeLower(values.email)

        setValues((p) => ({
          ...p,
          username: normalizedUsername,
          email: normalizedEmail,
        }))
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
            disabled={lockIdentity}
          />
          <span className={styles.hint}>
            {lockIdentity
              ? 'Only a dev can edit a dev user.'
              : 'Allowed: letters/numbers, underscore, dot. Lowercase preferred.'}
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
            disabled={lockIdentity}
          />
          <span className={styles.hint}>
            {lockIdentity
              ? 'Only a dev can edit a dev user.'
              : 'Used for recovery/reference.'}
          </span>
          {touched.email && errors.email ? (
            <div className={styles.fieldError}>{errors.email}</div>
          ) : null}
        </label>

        {/* ✅ Role uses VetraSelect (still submits `role` via hidden input inside component) */}
        <div className={styles.field}>
          <VetraSelect<Role>
            name="role"
            label="Role *"
            value={values.role}
            onChange={(v) => set('role', v)}
            options={ROLE_OPTIONS}
            disabled={roleDisabled}
          />
          <span className={styles.hint}>
            {lockDevTarget
              ? 'Only a dev can change a dev user.'
              : lockRoleAndStatus
                ? 'You cannot change your own role here.'
                : 'Only dev/admin can manage users.'}
          </span>
        </div>

        <label className={styles.field}>
          <span className={styles.label}>Status</span>
          <div className={styles.switchRow}>
            <input
              className={styles.check}
              id="isActive"
              name="isActive"
              type="checkbox"
              checked={values.isActive}
              disabled={statusDisabled}
              onChange={(e) => set('isActive', e.target.checked)}
            />
            <span className={styles.switchText}>
              Active (can login and access CMS)
            </span>
          </div>
          <span className={styles.hint}>
            {lockDevTarget
              ? 'Only a dev can change a dev user.'
              : lockRoleAndStatus
                ? 'You cannot disable your own account here.'
                : 'Disable if you want to revoke access without deleting.'}
          </span>
        </label>
      </div>

      <footer className={styles.actions}>
        <a className={styles.ghostBtn} href="/admin/cms/users">
          Cancel
        </a>

        <button
          className={styles.btn}
          type="submit"
          disabled={saveDisabled}
          onClick={() => {
            if (saveDisabled) return
            if (!canSubmit) {
              touchAll()
              router.replace(pathname)
              router.refresh()
            }
          }}
        >
          Save changes
        </button>
      </footer>
    </form>
  )
}
