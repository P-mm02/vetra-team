// src/app/(admin)/admin/cms/CmsShell/Topbar/CmsTopbar.tsx
import styles from './CmsTopbar.module.css'
import type { CurrentUser } from '@/lib/auth/session'
import { useState } from 'react'

type Props = {
  onOpenNav: () => void
  user: CurrentUser
}

type ActionState = 'idle' | 'loading'

export default function CmsTopbar({ onOpenNav, user }: Props) {
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
    <header className={styles.topbar}>
      <button
        type="button"
        className={styles.menuBtn}
        onClick={onOpenNav}
        aria-label="Open menu"
      >
        ☰
      </button>

      <div className={styles.userBox}>
        <div className={styles.userTop}>
          <div className={styles.userName} title={user.username}>
            {user.username}
          </div>
          <div className={styles.userRole}>{user.role}</div>
          
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
    </header>
  )
}
