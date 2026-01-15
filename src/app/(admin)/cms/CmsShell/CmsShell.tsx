'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import styles from './CmsShell.module.css'

type CmsUser = {
  id: string
  email: string
  role: string
}

function isActive(pathname: string, href: string) {
  if (href === '/cms') return pathname === '/cms'
  return pathname === href || pathname.startsWith(`${href}/`)
}

export default function CmsShell({
  user,
  children,
}: {
  user: CmsUser
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [navOpen, setNavOpen] = useState(false)
  const [logoutState, setLogoutState] = useState<'idle' | 'loading'>('idle')

  const isLoggingOut = logoutState === 'loading'

  const nowLabel = useMemo(() => {
    try {
      return new Intl.DateTimeFormat('en-GB', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date())
    } catch {
      return ''
    }
  }, [])

  async function onLogout() {
    if (isLoggingOut) return
    setLogoutState('loading')
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } finally {
      window.location.href = '/login'
    }
  }

  return (
    <div className={styles.shell}>
      {/* Sidebar */}
      <aside
        className={`${styles.sidebar} ${navOpen ? styles.sidebarOpen : ''}`}
      >
        <div className={styles.sideTop}>
          <Link
            className={styles.brand}
            href="/cms"
            onClick={() => setNavOpen(false)}
          >
            <span className={styles.brandLogo}>
              <Image
                src="/admin/logo/vetra-logo-nobg.svg"
                alt="VETRA"
                width={28}
                height={28}
                priority
              />
            </span>
            <span className={styles.brandText}>
              <span className={styles.brandName}>VETRA</span>
              <span className={styles.brandTag}>CMS</span>
            </span>
          </Link>

          <button
            type="button"
            className={styles.closeBtn}
            onClick={() => setNavOpen(false)}
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>

        <nav className={styles.nav} aria-label="CMS navigation">
          <Link
            className={`${styles.navItem} ${
              isActive(pathname, '/cms') ? styles.active : ''
            }`}
            href="/cms"
            onClick={() => setNavOpen(false)}
          >
            <span className={styles.dot} aria-hidden="true" />
            Dashboard
          </Link>

          <Link
            className={`${styles.navItem} ${
              isActive(pathname, '/cms/content') ? styles.active : ''
            }`}
            href="/cms/content"
            onClick={() => setNavOpen(false)}
          >
            <span className={styles.dot} aria-hidden="true" />
            Content
          </Link>

          <Link
            className={`${styles.navItem} ${
              isActive(pathname, '/cms/projects') ? styles.active : ''
            }`}
            href="/cms/projects"
            onClick={() => setNavOpen(false)}
          >
            <span className={styles.dot} aria-hidden="true" />
            Projects
          </Link>

          <Link
            className={`${styles.navItem} ${
              isActive(pathname, '/cms/media') ? styles.active : ''
            }`}
            href="/cms/media"
            onClick={() => setNavOpen(false)}
          >
            <span className={styles.dot} aria-hidden="true" />
            Media
          </Link>

          <Link
            className={`${styles.navItem} ${
              isActive(pathname, '/cms/users') ? styles.active : ''
            }`}
            href="/cms/users"
            onClick={() => setNavOpen(false)}
          >
            <span className={styles.dot} aria-hidden="true" />
            Users
          </Link>

          <Link
            className={`${styles.navItem} ${
              isActive(pathname, '/cms/settings') ? styles.active : ''
            }`}
            href="/cms/settings"
            onClick={() => setNavOpen(false)}
          >
            <span className={styles.dot} aria-hidden="true" />
            Settings
          </Link>
        </nav>

        <div className={styles.sideFoot}>
          <div className={styles.userBox}>
            <div className={styles.userTop}>
              <div className={styles.userEmail} title={user.email}>
                {user.email}
              </div>
              <div className={styles.userRole}>{user.role}</div>
            </div>

            <div className={styles.userHint}>Signed in</div>
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
              disabled={isLoggingOut}
            >
              {isLoggingOut ? 'Logging out…' : 'Logout'}
            </button>
          </div>
        </div>
      </aside>

      {/* Backdrop for mobile */}
      <button
        type="button"
        className={`${styles.backdrop} ${navOpen ? styles.backdropShow : ''}`}
        onClick={() => setNavOpen(false)}
        aria-label="Close menu"
      />

      {/* Main */}
      <div className={styles.main}>
        <header className={styles.topbar}>
          <button
            type="button"
            className={styles.menuBtn}
            onClick={() => setNavOpen(true)}
            aria-label="Open menu"
          >
            ☰
          </button>

          <div className={styles.topbarTitle}>
            <span className={styles.topbarKicker}>Admin</span>
            <span className={styles.topbarPath}>{pathname}</span>
          </div>

          <div className={styles.topbarRight}>
            <span className={styles.timePill}>{nowLabel}</span>
          </div>
        </header>

        <div className={styles.content}>{children}</div>
      </div>
    </div>
  )
}
