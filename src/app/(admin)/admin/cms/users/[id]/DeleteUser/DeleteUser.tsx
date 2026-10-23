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
  version: number
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
    case 'last_privileged':
      return 'Keep at least one active account with this privileged role.'
    case 'conflict':
      return 'This account changed. Refresh the page and try again.'
    case 'csrf':
      return 'Your session could not be verified. Refresh and try again.'
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
  version,
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
            Move this user to Trash for 30 days and revoke active sessions.
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
          Move to Trash
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
            Move <b>{username}</b> to Trash?
          </div>
          <div className={styles.confirmText}>
            Login stops immediately. You can restore this account from Trash for 30 days.
          </div>

          <form action={deleteUserAction} className={styles.confirmActions}>
            <input type="hidden" name="id" value={userId} />
            <input type="hidden" name="version" value={version} />

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
              Move to Trash
            </button>
          </form>
        </div>
      ) : null}
    </section>
  )
}
