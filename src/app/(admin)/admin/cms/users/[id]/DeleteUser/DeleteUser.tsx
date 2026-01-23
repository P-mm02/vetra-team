// src/app/(admin)/admin/cms/users/[id]/DeleteUser/DeleteUser.tsx
'use client'

import { useMemo, useState } from 'react'
import styles from './DeleteUser.module.css'
import { deleteUserAction } from './function'

type Props = {
  userId: string
  username: string
  targetRole: string
  meId: string
  meRole: string
  // optional: pass from page.tsx if you want to show page-level errors
  errCode?: string
}

function errText(code: string) {
  switch (code) {
    case 'self_delete':
      return 'You cannot delete your own account.'
    case 'forbidden':
      return 'Only a dev can delete a dev user.'
    case 'bad_id':
      return 'Invalid user id.'
    default:
      return 'Delete failed. Please try again.'
  }
}

export default function DeleteUser({
  userId,
  username,
  targetRole,
  meId,
  meRole,
  errCode = '',
}: Props) {
  const [confirming, setConfirming] = useState(false)

  const isSelf = meId === userId

  const canDeleteTarget = useMemo(() => {
    if (isSelf) return false
    if (String(targetRole) === 'dev' && String(meRole) !== 'dev') return false
    return true
  }, [isSelf, targetRole, meRole])

  return (
    <section className={styles.danger} aria-label="Danger zone">
      <div className={styles.head}>
        <div>
          <h2 className={styles.h2}>Danger zone</h2>
          <p className={styles.sub}>
            Permanently delete this user and revoke all active sessions.
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
              ? 'You cannot delete your own account.'
              : targetRole === 'dev' && meRole !== 'dev'
                ? 'Only dev can delete dev.'
                : ''
          }
        >
          Delete user
        </button>
      </div>

      {!canDeleteTarget ? (
        <div className={styles.note} role="status" aria-live="polite">
          {isSelf ? (
            <>You can’t delete your own account.</>
          ) : (
            <>
              Only a <b>dev</b> can delete a <b>dev</b> user.
            </>
          )}
        </div>
      ) : null}

      {errCode ? (
        <div className={styles.error} role="alert">
          <span className={styles.dot} aria-hidden="true" />
          {errText(errCode)}
        </div>
      ) : null}

      {confirming ? (
        <div
          className={styles.confirmBox}
          role="dialog"
          aria-label="Confirm delete"
        >
          <div className={styles.confirmTitle}>
            Delete <b>{username}</b>?
          </div>
          <div className={styles.confirmText}>This action can’t be undone.</div>

          <form action={deleteUserAction} className={styles.confirmActions}>
            <input type="hidden" name="id" value={userId} />

            <button
              type="button"
              className={styles.ghost}
              onClick={() => setConfirming(false)}
            >
              Cancel
            </button>

            <button
              type="submit"
              className={styles.dangerBtn}
              disabled={!canDeleteTarget}
            >
              Yes, delete
            </button>
          </form>
        </div>
      ) : null}
    </section>
  )
}
