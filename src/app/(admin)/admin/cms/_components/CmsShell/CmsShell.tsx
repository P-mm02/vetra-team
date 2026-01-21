// src/app/(admin)/admin/cms/CmsShell/CmsShell.tsx
'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import styles from './CmsShell.module.css'
import type { CurrentUser } from '@/lib/auth/session'

function isActive(pathname: string, href: string) {
  if (href === '/admin/cms') return pathname === '/admin/cms'
  return pathname === href || pathname.startsWith(`${href}/`)
}

export default function CmsShell({
  user,
  children,
}: {
  user: CurrentUser
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
      window.location.href = '/admin/login'
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
            href="/admin/cms"
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
            className={`${styles.navItem} ${isActive(pathname, '/admin/cms') ? styles.active : ''}`}
            href="/admin/cms"
            onClick={() => setNavOpen(false)}
          >
            <span className={styles.dot} aria-hidden="true" />
            Dashboard
          </Link>

          <Link
            className={`${styles.navItem} ${
              isActive(pathname, '/admin/cms/content') ? styles.active : ''
            }`}
            href="/admin/cms/content"
            onClick={() => setNavOpen(false)}
          >
            <span className={styles.dot} aria-hidden="true" />
            Content
          </Link>

          <Link
            className={`${styles.navItem} ${
              isActive(pathname, '/admin/cms/projects') ? styles.active : ''
            }`}
            href="/admin/cms/projects"
            onClick={() => setNavOpen(false)}
          >
            <span className={styles.dot} aria-hidden="true" />
            Projects
          </Link>

          <Link
            className={`${styles.navItem} ${isActive(pathname, '/admin/cms/media') ? styles.active : ''}`}
            href="/admin/cms/media"
            onClick={() => setNavOpen(false)}
          >
            <span className={styles.dot} aria-hidden="true" />
            Media
          </Link>

          <Link
            className={`${styles.navItem} ${isActive(pathname, '/admin/cms/users') ? styles.active : ''}`}
            href="/admin/cms/users"
            onClick={() => setNavOpen(false)}
          >
            <span className={styles.dot} aria-hidden="true" />
            Users
          </Link>

          <Link
            className={`${styles.navItem} ${
              isActive(pathname, '/admin/cms/settings') ? styles.active : ''
            }`}
            href="/admin/cms/settings"
            onClick={() => setNavOpen(false)}
          >
            <span className={styles.dot} aria-hidden="true" />
            Settings
          </Link>
        </nav>

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
