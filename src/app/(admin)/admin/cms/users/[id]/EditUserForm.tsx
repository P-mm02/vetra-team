// src/app/(admin)/admin/cms/users/[id]/EditUserForm.tsx
'use client'

import { useMemo, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { updateUserAction } from './function'
import styles from './EditUserForm.module.css'
import { useCmsI18n } from '@/components/cms/CmsLanguageProvider'
import { userRoleLabel, userValidationMessage } from '../i18n'

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

const ROLES: Role[] = ['dev', 'admin', 'editor', 'viewer']

type Props = {
  userId: string
  defaultUsername: string
  defaultEmail: string
  defaultRole: string
  defaultIsActive: boolean
  meRole: string
  isSelf: boolean
  targetRoleNow: string // ✅ DB truth for locks
  version: number
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
  version,
}: Props) {
  const { t } = useCmsI18n()
  const router = useRouter()
  const pathname = usePathname()

  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [values, setValues] = useState({
    username: defaultUsername,
    email: defaultEmail,
    role: asRole(
      meRole !== 'dev' && targetRoleNow !== 'dev' && defaultRole === 'dev'
        ? targetRoleNow
        : defaultRole,
    ),
    isActive: defaultIsActive,
  })

  const errors = useMemo(
    () => validateEditUser({ username: values.username, email: values.email }),
    [values.username, values.email],
  )

  const canSubmit = !hasErrors(errors)

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
  const roleOptions: SelectOption<Role>[] = ROLES
    .filter((role) => isDevMe || isDevTarget || role !== 'dev')
    .map((role) => ({ value: role, label: userRoleLabel(role, t) }))

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
      <input type="hidden" name="version" value={version} />
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
            disabled={lockIdentity}
          />
          <span className={styles.hint}>
            {lockIdentity
              ? t('Only a developer can edit a developer account.', 'เฉพาะผู้พัฒนาเท่านั้นที่แก้ไขบัญชีผู้พัฒนาได้')
              : t('Use English letters, numbers, underscores or dots. Lowercase preferred.', 'ใช้อักษรภาษาอังกฤษ ตัวเลข ขีดล่าง หรือจุด แนะนำให้ใช้ตัวพิมพ์เล็ก')}
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
            disabled={lockIdentity}
          />
          <span className={styles.hint}>
            {lockIdentity
              ? t('Only a developer can edit a developer account.', 'เฉพาะผู้พัฒนาเท่านั้นที่แก้ไขบัญชีผู้พัฒนาได้')
              : t('Used for sign-in, contact and account reference.', 'ใช้เข้าสู่ระบบ ติดต่อ และอ้างอิงบัญชี')}
          </span>
          {touched.email && errors.email ? (
            <div className={styles.fieldError}>{userValidationMessage(errors.email, t)}</div>
          ) : null}
        </label>

        {/* ✅ Role uses VetraSelect (still submits `role` via hidden input inside component) */}
        <div className={styles.field}>
          <VetraSelect<Role>
            name="role"
            label={t('Role *', 'สิทธิ์ *')}
            value={values.role}
            onChange={(v) => set('role', v)}
            options={roleOptions}
            disabled={roleDisabled}
          />
          <span className={styles.hint}>
            {lockDevTarget
              ? t('Only a developer can change a developer account.', 'เฉพาะผู้พัฒนาเท่านั้นที่เปลี่ยนแปลงบัญชีผู้พัฒนาได้')
              : lockRoleAndStatus
                ? t('You cannot change your own role here.', 'คุณไม่สามารถเปลี่ยนสิทธิ์ของตนเองได้')
                : t('Only developers and admins can manage users.', 'เฉพาะผู้พัฒนาและผู้ดูแลระบบเท่านั้นที่จัดการผู้ใช้ได้')}
          </span>
        </div>

        <label className={styles.field}>
          <span className={styles.label}>{t('Status', 'สถานะ')}</span>
          <div className={styles.switchRow}>
            <input
              className={styles.check}
              id="isActive"
              type="checkbox"
              checked={values.isActive}
              disabled={statusDisabled}
              onChange={(e) => set('isActive', e.target.checked)}
            />
            {!statusDisabled ? (
              <input type="hidden" name="isActive" value={values.isActive ? '1' : '0'} />
            ) : null}
            <span className={styles.switchText}>
              {t('Active (can sign in and access CMS)', 'เปิดใช้งาน (เข้าสู่ระบบ CMS ได้)')}
            </span>
          </div>
          <span className={styles.hint}>
            {lockDevTarget
              ? t('Only a developer can change a developer account.', 'เฉพาะผู้พัฒนาเท่านั้นที่เปลี่ยนแปลงบัญชีผู้พัฒนาได้')
              : lockRoleAndStatus
                ? t('You cannot disable your own account here.', 'คุณไม่สามารถปิดใช้งานบัญชีของตนเองได้')
                : t('Disable to revoke access while keeping the account.', 'ปิดใช้งานเพื่อระงับการเข้าถึงโดยเก็บบัญชีไว้')}
          </span>
        </label>
      </div>

      <footer className={styles.actions}>
        <Link className={styles.ghostBtn} href="/admin/cms/users">
          {t('Cancel', 'ยกเลิก')}
        </Link>

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
          {t('Save changes', 'บันทึกการเปลี่ยนแปลง')}
        </button>
      </footer>
    </form>
  )
}
