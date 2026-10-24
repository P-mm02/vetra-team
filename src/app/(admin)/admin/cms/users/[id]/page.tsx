// src/app/(admin)/admin/cms/users/[id]/page.tsx
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import mongoose from 'mongoose'
import { connectMongo } from '@/lib/db/mongoose'
import { getCurrentUser } from '@/lib/auth/session'
import { User } from '@/models/User/User'
import styles from './page.module.css'

import Notice from '@/app/(admin)/admin/Notice/Notice'
import EditUserForm from './EditUserForm'
import ChangePassword from './ChangePassword/ChangePassword'
import DeleteUser from './DeleteUser/DeleteUser'
import { getCmsI18n } from '@/lib/cms/i18n-server'
import { userActionError, userRoleLabel } from '../i18n'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export async function generateMetadata() {
  const { t } = await getCmsI18n()
  return { title: t('Edit user', 'แก้ไขผู้ใช้') }
}

type UserView = {
  _id: unknown
  username?: string
  email?: string
  role?: string
  isActive?: boolean
  createdAt?: Date
  updatedAt?: Date
  lastLoginAt?: Date | null
  __v?: number
}

type SearchParams = Record<string, string | string[] | undefined>

function canManageUsers(role: string) {
  return role === 'dev' || role === 'admin'
}

function pickOne(v: string | string[] | undefined) {
  if (!v) return ''
  return Array.isArray(v) ? (v[0] ?? '') : v
}

export default async function UserEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<SearchParams>
}) {
  const { t, formatDate } = await getCmsI18n()
  const { id } = await params
  const sp = await searchParams

  const me = await getCurrentUser()
  if (!me)
    redirect(`/admin/login?next=/admin/cms/users/${encodeURIComponent(id)}`)
  if (!canManageUsers(String(me.role))) redirect('/admin/cms')

  if (!mongoose.Types.ObjectId.isValid(id)) notFound()

  await connectMongo()

  const user = await User.findOne({ _id: id, deletedAt: null })
    .select({
      username: 1,
      email: 1,
      role: 1,
      isActive: 1,
      createdAt: 1,
      updatedAt: 1,
      lastLoginAt: 1,
      __v: 1,
    })
    .lean<UserView | null>()

  if (!user) notFound()

  const userId = String(user._id)

  // ✅ DB truth (do NOT trust querystring for locks)
  const targetRoleNow = String(user.role || 'viewer')

  // ✅ edit form qs
  const err = pickOne(sp.err)
  const ok = pickOne(sp.ok)

  const qUsername = pickOne(sp.username)
  const qEmail = pickOne(sp.email)
  const qRole = pickOne(sp.role)
  const qIsActive = pickOne(sp.isActive)

  const username = qUsername || String(user.username || '')
  const email = qEmail || String(user.email || '')
  const role = qRole || targetRoleNow
  const isActive = qIsActive !== '' ? qIsActive !== '0' : Boolean(user.isActive)

  // ✅ change password qs (separate)
  const cpErr = pickOne(sp.cp_err)
  const cpOk = pickOne(sp.cp_ok)

  const isSelf = String(me.id) === userId

  return (
    <main className={styles.page} aria-label={t('Edit user', 'แก้ไขผู้ใช้')}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <Link className={styles.back} href="/admin/cms/users">
            {'<'} {t('Back to users', 'กลับไปยังผู้ใช้')}
          </Link>

          <h1 className={styles.h1}>{t('Edit', 'แก้ไข')}: {username || '—'}</h1>

          <p className={styles.sub}>
            {email || '—'} • <span className={styles.rolePill}>{userRoleLabel(role, t)}</span>{' '}
            <span
              className={`${styles.statusPill} ${
                isActive ? styles.statusOn : styles.statusOff
              }`}
            >
              {isActive ? t('Active', 'เปิดใช้งาน') : t('Disabled', 'ปิดใช้งาน')}
            </span>
          </p>
        </div>

      </header>

      <section className={styles.grid} aria-label={t('User details', 'รายละเอียดผู้ใช้')}>
        <article className={styles.card}>
          <div className={styles.k}>{t('User ID', 'รหัสผู้ใช้')}</div>
          <div className={styles.vMono}>{userId}</div>
        </article>

        <article className={styles.card}>
          <div className={styles.k}>{t('Created', 'วันที่สร้าง')}</div>
          <div className={styles.v}>{formatDate(user.createdAt, { dateStyle: 'medium', timeStyle: 'short' })}</div>
        </article>

        <article className={styles.card}>
          <div className={styles.k}>{t('Updated', 'แก้ไขล่าสุด')}</div>
          <div className={styles.v}>{formatDate(user.updatedAt, { dateStyle: 'medium', timeStyle: 'short' })}</div>
        </article>

        <article className={styles.card}>
          <div className={styles.k}>{t('Last login', 'เข้าสู่ระบบล่าสุด')}</div>
          <div className={styles.v}>{formatDate(user.lastLoginAt, { dateStyle: 'medium', timeStyle: 'short' })}</div>
        </article>
      </section>

      <section className={styles.panel} aria-label={t('Edit form', 'แบบฟอร์มแก้ไขผู้ใช้')}>
        {err ? (
          <Notice
            tone="danger"
            title={t('Save failed', 'บันทึกไม่สำเร็จ')}
            message={userActionError(err, t)}
            code={400}
            dismissible
            clearQueryKey="err"
          />
        ) : ok ? (
          <Notice
            tone="success"
            title={t('Saved', 'บันทึกแล้ว')}
            message={t('Saved changes.', 'บันทึกการเปลี่ยนแปลงแล้ว')}
            code={200}
            dismissible
            clearQueryKey="ok"
          />
        ) : null}

        <EditUserForm
          userId={userId}
          defaultUsername={username}
          defaultEmail={email}
          defaultRole={role}
          defaultIsActive={isActive}
          meRole={String(me.role)}
          isSelf={isSelf}
          targetRoleNow={targetRoleNow}
          version={Number(user.__v ?? 0)}
        />
      </section>

      <section className={styles.panel} aria-label={t('Change password', 'เปลี่ยนรหัสผ่าน')}>
        {cpErr ? (
          <Notice
            tone="danger"
            title={t('Change password failed', 'เปลี่ยนรหัสผ่านไม่สำเร็จ')}
            message={userActionError(cpErr, t, 'password')}
            code={400}
            dismissible
            clearQueryKey="cp_err"
          />
        ) : cpOk ? (
          <Notice
            tone="success"
            title={t('Password updated', 'เปลี่ยนรหัสผ่านแล้ว')}
            message={t('New password saved.', 'บันทึกรหัสผ่านใหม่แล้ว')}
            code={200}
            dismissible
            clearQueryKey="cp_ok"
          />
        ) : null}

        <ChangePassword userId={userId} />
      </section>

      <DeleteUser
        userId={userId}
        username={username || '—'}
        targetRole={role}
        meId={String(me.id)}
        meRole={String(me.role)}
        version={Number(user.__v ?? 0)}
        errCode={err ? err : undefined}
      />
    </main>
  )
}
