// src/app/(admin)/admin/cms/users/[id]/ChangePassword/ChangePassword.tsx
'use client'

import { useMemo, useState } from 'react'
import styles from './ChangePassword.module.css'
import { changePasswordAction } from './function'
import { hasErrors } from '../../add/validator'
import { useCmsI18n } from '@/components/cms/CmsLanguageProvider'
import { userValidationMessage } from '../../i18n'

type FieldErrors = Partial<Record<'password' | 'password2', string>>

function validate(v: { password: string; password2: string }): FieldErrors {
  const e: FieldErrors = {}
  const p1 = v.password
  const p2 = v.password2

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
  const { t } = useCmsI18n()
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [values, setValues] = useState({ password: '', password2: '' })

  const errors: FieldErrors = useMemo(() => validate(values), [values])

  const canSubmit = !hasErrors(errors)

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
        <h2 className={styles.h2}>{t('Change password', 'เปลี่ยนรหัสผ่าน')}</h2>
        <p className={styles.sub}>
          {t('Set a new password for this user using 8–200 characters.', 'กำหนดรหัสผ่านใหม่ให้ผู้ใช้นี้ ความยาว 8–200 ตัวอักษร')}
        </p>
      </div>

      <div className={styles.grid}>
        <label className={styles.field}>
          <span className={styles.label}>{t('New password *', 'รหัสผ่านใหม่ *')}</span>
          <input
            className={styles.input}
            name="password"
            type="password"
            placeholder={t('At least 8 characters', 'อย่างน้อย 8 ตัวอักษร')}
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
            <div className={styles.fieldError}>{userValidationMessage(errors.password, t)}</div>
          ) : null}
        </label>

        <label className={styles.field}>
          <span className={styles.label}>{t('Confirm password *', 'ยืนยันรหัสผ่าน *')}</span>
          <input
            className={styles.input}
            name="password2"
            type="password"
            placeholder={t('Re-type password', 'กรอกรหัสผ่านอีกครั้ง')}
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
            <div className={styles.fieldError}>{userValidationMessage(errors.password2, t)}</div>
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
          {t('Clear', 'ล้างข้อมูล')}
        </button>

        <button className={styles.btn} type="submit" disabled={disabled}>
          {t('Update password', 'เปลี่ยนรหัสผ่าน')}
        </button>
      </footer>
    </form>
  )
}
