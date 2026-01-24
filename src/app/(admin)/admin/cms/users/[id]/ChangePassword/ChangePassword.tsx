// src/app/(admin)/admin/cms/users/[id]/ChangePassword/ChangePassword.tsx
'use client'

import { useMemo, useState } from 'react'
import styles from './ChangePassword.module.css'
import { changePasswordAction } from './function'
import { hasErrors } from '../../add/validator'

type FieldErrors = Partial<Record<'password' | 'password2', string>>

function validate(v: { password: string; password2: string }): FieldErrors {
  const e: FieldErrors = {}
  const p1 = v.password.trim()
  const p2 = v.password2.trim()

  if (!p1) e.password = 'Password is required.'
  else if (p1.length < 8 || p1.length > 200)
    e.password = 'Password must be 8–200 characters.'

  if (!p2) e.password2 = 'Please confirm password.'
  else if (p1 !== p2) e.password2 = 'Passwords do not match.'

  return e
}

type Props = {
  userId: string
  disabled?: boolean
}

export default function ChangePassword({ userId, disabled = false }: Props) {
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [values, setValues] = useState({ password: '', password2: '' })

  const errors: FieldErrors = useMemo(
    () => validate(values),
    [values.password, values.password2],
  )

  const canSubmit = !hasErrors(errors as any)

  function mark(name: string) {
    setTouched((p) => ({ ...p, [name]: true }))
  }

  function set<K extends keyof typeof values>(key: K, val: (typeof values)[K]) {
    setValues((p) => ({ ...p, [key]: val }))
  }

  function touchAll() {
    setTouched({ password: true, password2: true })
  }

  return (
    <form
      className={styles.form}
      action={changePasswordAction.bind(null, userId)}
      onSubmit={(e) => {
        if (disabled) {
          e.preventDefault()
          return
        }
        if (!canSubmit) {
          e.preventDefault()
          touchAll()
          return
        }
      }}
    >
      <div className={styles.head}>
        <h2 className={styles.h2}>Change password</h2>
        <p className={styles.sub}>
          Set a new password for this user. Min 8 characters.
        </p>
      </div>

      <div className={styles.grid}>
        <label className={styles.field}>
          <span className={styles.label}>New password *</span>
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
            disabled={disabled}
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
            disabled={disabled}
          />
          {touched.password2 && errors.password2 ? (
            <div className={styles.fieldError}>{errors.password2}</div>
          ) : null}
        </label>
      </div>

      <footer className={styles.actions}>
        <button
          className={styles.ghostBtn}
          type="button"
          onClick={() => {
            setValues({ password: '', password2: '' })
            setTouched({})
          }}
          disabled={disabled}
        >
          Clear
        </button>

        <button className={styles.btn} type="submit" disabled={disabled}>
          Update password
        </button>
      </footer>
    </form>
  )
}
