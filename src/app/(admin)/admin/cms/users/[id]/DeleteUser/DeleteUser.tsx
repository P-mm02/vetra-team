// src/app/(admin)/admin/cms/users/[id]/DeleteUser/DeleteUser.tsx
'use client'

import { useMemo, useState } from 'react'
import styles from './DeleteUser.module.css'
import { deleteUserAction } from './function'
import { useCmsI18n } from '@/components/cms/CmsLanguageProvider'
import { userActionError } from '../../i18n'

type Props = {
  userId: string
  username: string
  targetRole: string
  meId: string
  meRole: string
  version: number
  // optional: pass from page.tsx if you want to show page-level errors
  errCode?: string
}

export default function DeleteUser({
  userId,
  username,
  targetRole,
  meId,
  meRole,
  version,
  errCode = '',
}: Props) {
  const { t } = useCmsI18n()
  const [confirming, setConfirming] = useState(false)

  const isSelf = meId === userId

  const canDeleteTarget = useMemo(() => {
    if (isSelf) return false
    if (String(targetRole) === 'dev' && String(meRole) !== 'dev') return false
    return true
  }, [isSelf, targetRole, meRole])

  return (
    <section className={styles.danger} aria-label={t('Remove account', 'ลบบัญชี')}>
      <div className={styles.head}>
        <div>
          <h2 className={styles.h2}>{t('Remove account', 'ลบบัญชี')}</h2>
          <p className={styles.sub}>
            {t('Move this user to Trash for 30 days and revoke active sessions.', 'ย้ายผู้ใช้นี้ไปถังขยะเป็นเวลา 30 วัน และยกเลิกเซสชันการเข้าสู่ระบบที่ใช้งานอยู่')}
          </p>
        </div>

        <button
          className={styles.deleteBtn}
          type="button"
          disabled={!canDeleteTarget}
          aria-disabled={!canDeleteTarget}
          onClick={() => setConfirming(true)}
          title={
            isSelf
              ? t('You cannot delete your own account.', 'คุณไม่สามารถลบบัญชีของตนเองได้')
              : targetRole === 'dev' && meRole !== 'dev'
                ? t('Only a developer can remove a developer account.', 'เฉพาะผู้พัฒนาเท่านั้นที่ลบบัญชีผู้พัฒนาได้')
                : ''
          }
        >
          {t('Move to Trash', 'ย้ายไปถังขยะ')}
        </button>
      </div>

      {!canDeleteTarget ? (
        <div className={styles.note} role="status" aria-live="polite">
          {isSelf ? (
            <>{t('You cannot delete your own account.', 'คุณไม่สามารถลบบัญชีของตนเองได้')}</>
          ) : (
            <>
              {t('Only a developer can remove a developer account.', 'เฉพาะผู้พัฒนาเท่านั้นที่ลบบัญชีผู้พัฒนาได้')}
            </>
          )}
        </div>
      ) : null}

      {errCode ? (
        <div className={styles.error} role="alert">
          <span className={styles.dot} aria-hidden="true" />
          {userActionError(errCode, t, 'delete')}
        </div>
      ) : null}

      {confirming ? (
        <div
          className={styles.confirmBox}
          role="dialog"
          aria-label={t('Confirm removal', 'ยืนยันการลบ')}
        >
          <div className={styles.confirmTitle}>
            {t(`Move ${username} to Trash?`, `ย้าย ${username} ไปถังขยะหรือไม่?`)}
          </div>
          <div className={styles.confirmText}>
            {t('Login stops immediately. You can restore this account from Trash for 30 days.', 'บัญชีจะเข้าสู่ระบบไม่ได้ทันที คุณสามารถกู้คืนบัญชีนี้จากถังขยะได้ภายใน 30 วัน')}
          </div>

          <form action={deleteUserAction} className={styles.confirmActions}>
            <input type="hidden" name="id" value={userId} />
            <input type="hidden" name="version" value={version} />

            <button
              type="button"
              className={styles.ghost}
              onClick={() => setConfirming(false)}
            >
              {t('Cancel', 'ยกเลิก')}
            </button>

            <button
              type="submit"
              className={styles.dangerBtn}
              disabled={!canDeleteTarget}
            >
              {t('Move to Trash', 'ย้ายไปถังขยะ')}
            </button>
          </form>
        </div>
      ) : null}
    </section>
  )
}
