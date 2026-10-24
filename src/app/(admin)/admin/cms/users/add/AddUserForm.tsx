// src/app/(admin)/admin/cms/users/add/AddUserForm.tsx
'use client'

import { useMemo, useState } from 'react'
import { useFormStatus } from 'react-dom'
import Link from 'next/link'
import styles from './page.module.css'
import { createUserAction } from './function'
import { useCmsI18n } from '@/components/cms/CmsLanguageProvider'
import { userRoleLabel, userValidationMessage } from '../i18n'
import {
  validateAddUser,
  hasErrors,
  type FieldErrors,
} from './validator'

type Props = {
  defaultUsername: string
  defaultEmail: string
  defaultRole: string
  defaultIsActive: boolean
  currentRole: string
}

function SubmitButton() {
  const { pending } = useFormStatus()
  const { t } = useCmsI18n()

  return (
    <button className={styles.btn} type="submit" disabled={pending} aria-busy={pending}>
      <span aria-live="polite">{pending ? t('Creating user…', 'กำลังสร้างผู้ใช้…') : t('Create user', 'สร้างผู้ใช้')}</span>
    </button>
  )
}

export default function AddUserForm({
  defaultUsername,
  defaultEmail,
  defaultRole,
  defaultIsActive,
  currentRole,
}: Props) {
  const { t } = useCmsI18n()
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
      action={createUserAction}
      onSubmit={(e) => {
        if (!canSubmit) {
          e.preventDefault()
          touchAll()
          return
        }
      }}
    >
      <div className={styles.grid}>
        <label className={styles.field}>
          <span className={styles.label}>{t('Username *', 'ชื่อผู้ใช้ *')}</span>
          <input
            className={styles.input}
            name="username"
            placeholder={t('e.g. vetra_admin', 'เช่น vetra_admin')}
            value={values.username}
            autoComplete="username"
            required
            minLength={3}
            maxLength={30}
            onChange={(e) => set('username', e.target.value)}
            onBlur={() => mark('username')}
          />
          <span className={styles.hint}>
            {t('Use English letters, numbers, underscores or dots. Lowercase preferred.', 'ใช้อักษรภาษาอังกฤษ ตัวเลข ขีดล่าง หรือจุด แนะนำให้ใช้ตัวพิมพ์เล็ก')}
          </span>
          {touched.username && errors.username ? (
            <div className={styles.fieldError}>{userValidationMessage(errors.username, t)}</div>
          ) : null}
        </label>

        <label className={styles.field}>
          <span className={styles.label}>{t('Email *', 'อีเมล *')}</span>
          <input
            className={styles.input}
            name="email"
            type="email"
            placeholder={t('e.g. admin@yourdomain.com', 'เช่น admin@yourdomain.com')}
            value={values.email}
            autoComplete="email"
            required
            onChange={(e) => set('email', e.target.value)}
            onBlur={() => mark('email')}
          />
          <span className={styles.hint}>
            {t('Used for sign-in, contact and account reference.', 'ใช้เข้าสู่ระบบ ติดต่อ และอ้างอิงบัญชี')}
          </span>
          {touched.email && errors.email ? (
            <div className={styles.fieldError}>{userValidationMessage(errors.email, t)}</div>
          ) : null}
        </label>

        <label className={styles.field}>
          <span className={styles.label}>{t('Role *', 'สิทธิ์ *')}</span>
          <select
            className={styles.select}
            name="role"
            value={values.role}
            onChange={(e) => set('role', e.target.value)}
          >
            {currentRole === 'dev' ? <option value="dev">{userRoleLabel('dev', t)}</option> : null}
            <option value="admin">{userRoleLabel('admin', t)}</option>
            <option value="editor">{userRoleLabel('editor', t)}</option>
            <option value="viewer">{userRoleLabel('viewer', t)}</option>
          </select>
          <span className={styles.hint}>
            {t('Only developers and admins can manage users.', 'เฉพาะผู้พัฒนาและผู้ดูแลระบบเท่านั้นที่จัดการผู้ใช้ได้')}
          </span>
        </label>

        <label className={styles.field}>
          <span className={styles.label}>{t('Status', 'สถานะ')}</span>
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
              {t('Active (can sign in and access CMS)', 'เปิดใช้งาน (เข้าสู่ระบบ CMS ได้)')}
            </span>
          </div>
          <span className={styles.hint}>
            {t('Disable to revoke access while keeping the account.', 'ปิดใช้งานเพื่อระงับการเข้าถึงโดยเก็บบัญชีไว้')}
          </span>
        </label>
      </div>

      <div className={styles.divider} />

      <div className={styles.grid2}>
        <label className={styles.field}>
          <span className={styles.label}>{t('Password *', 'รหัสผ่าน *')}</span>
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
          />
          {touched.password2 && errors.password2 ? (
            <div className={styles.fieldError}>{userValidationMessage(errors.password2, t)}</div>
          ) : null}
        </label>
      </div>

      <footer className={styles.actions}>
        <Link className={styles.ghostBtn} href="/admin/cms/users">
          {t('Cancel', 'ยกเลิก')}
        </Link>

        <SubmitButton />
      </footer>
    </form>
  )
}
