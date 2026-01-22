'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import styles from './CmsShell.module.css'
import type { CurrentUser } from '@/lib/auth/session'

import CmsNav from './Nav/CmsNav'
import CmsTopbar from './Topbar/CmsTopbar'
import CmsFooter from './Footer/CmsFooter'

export default function CmsShell({
  user,
  children,
}: {
  user: CurrentUser
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [navOpen, setNavOpen] = useState(false)

  return (
    <div className={styles.shell}>
      {/* Sidebar */}
      <aside
        className={`${styles.sidebar} ${navOpen ? styles.sidebarOpen : ''}`}
      >
        <CmsNav pathname={pathname} onClose={() => setNavOpen(false)} />
        <CmsFooter user={user} />
      </aside>

      {/* Backdrop (mobile) */}
      <button
        type="button"
        className={`${styles.backdrop} ${navOpen ? styles.backdropShow : ''}`}
        onClick={() => setNavOpen(false)}
        aria-label="Close menu"
      />

      {/* Main */}
      <div className={styles.main}>
        <CmsTopbar pathname={pathname} onOpenNav={() => setNavOpen(true)} />
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  )
}
