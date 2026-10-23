import type { RefObject } from 'react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut, Menu } from 'lucide-react'
import type { CurrentUser } from '@/lib/auth/session'
import styles from './CmsTopbar.module.css'

export default function CmsTopbar({ onOpenNav, navOpen, menuButtonRef, user }: {
  onOpenNav: () => void
  navOpen: boolean
  menuButtonRef: RefObject<HTMLButtonElement | null>
  user: CurrentUser
}) {
  const [loggingOut, setLoggingOut] = useState(false)
  const router = useRouter()

  async function onLogout() {
    if (loggingOut) return
    setLoggingOut(true)
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } finally {
      router.replace('/admin/login')
      router.refresh()
    }
  }

  return (
    <header className={styles.topbar}>
      <div className={styles.left}>
        <button
          ref={menuButtonRef}
          type="button"
          className={styles.menuBtn}
          onClick={onOpenNav}
          aria-label="Open menu"
          aria-controls="cms-navigation-drawer"
          aria-expanded={navOpen}
        >
          <Menu size={22} strokeWidth={2} aria-hidden="true" />
        </button>
        <span className={styles.divider} aria-hidden="true" />
        <div className={styles.workspace}>
          <span className={styles.eyebrow}>VETRA CMS</span>
          <span className={styles.workspaceName}>Workspace</span>
        </div>
      </div>

      <div className={styles.userBox}>
        <span className={styles.avatar} aria-hidden="true">{user.username.charAt(0).toUpperCase()}</span>
        <span className={styles.userMeta}>
          <span className={styles.userName} title={user.username}>{user.username}</span>
          <span className={styles.userRole}>{user.role}</span>
        </span>
        <button type="button" className={styles.logoutBtn} onClick={onLogout} disabled={loggingOut} aria-label={loggingOut ? 'Logging out' : 'Log out'} title="Log out">
          <LogOut size={18} aria-hidden="true" />
        </button>
      </div>
    </header>
  )
}
