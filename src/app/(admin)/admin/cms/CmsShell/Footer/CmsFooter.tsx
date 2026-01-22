import { useState } from 'react'
import styles from '../CmsShell.module.css'
import type { CurrentUser } from '@/lib/auth/session'

type ActionState = 'idle' | 'loading'

export default function CmsFooter({ user }: { user: CurrentUser }) {
  const [state, setState] = useState<ActionState>('idle')
  const isLoading = state === 'loading'

  async function onLogout() {
    if (isLoading) return
    setState('loading')
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } finally {
      window.location.href = '/admin/login'
    }
  }

  return (
    <div className={styles.sideFoot}>
      <div className={styles.userBox}>
        <div className={styles.userTop}>
          <div className={styles.userName} title={user.username}>
            {user.username}
          </div>
          <div className={styles.userRole}>{user.role}</div>
        </div>

        <div className={styles.userEmail} title={user.email}>
          {user.email}
        </div>
      </div>

      <div className={styles.sideActions}>
        <a
          className={styles.ghostBtn}
          href="/"
          target="_blank"
          rel="noreferrer"
        >
          Open site ↗
        </a>

        <button
          type="button"
          className={styles.primaryBtn}
          onClick={onLogout}
          disabled={isLoading}
        >
          {isLoading ? 'Logging out…' : 'Logout'}
        </button>
      </div>
    </div>
  )
}
