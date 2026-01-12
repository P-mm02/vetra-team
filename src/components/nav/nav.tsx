'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import styles from './nav.module.css'
import SmoothScrollLink from '@/components/ui/SmoothScrollLink/SmoothScrollLink'
import Image from 'next/image'

type NavItem = {
  label: string
  href: string
  kind: 'page' | 'section'
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Home', href: '/', kind: 'page' },
  { label: 'About', href: '/about', kind: 'page' },
  { label: 'Services', href: '/services', kind: 'page' },
  { label: 'Work', href: '/work', kind: 'page' },
  { label: 'Process', href: '/process', kind: 'page' },
  { label: 'Pricing', href: '/pricing', kind: 'page' },
  { label: 'Contact', href: '/contact', kind: 'page' },
]

function isActivePath(pathname: string, href: string) {
  if (href === '/') return pathname === '/'
  // highlight nested routes too: /about/team should keep About active
  return href.startsWith('/')
    ? pathname === href || pathname.startsWith(`${href}/`)
    : false
}

export default function Nav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const items = useMemo(() => NAV_ITEMS, [])

  // Close drawer on route change
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  // ESC to close, and lock scroll while open
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }

    document.addEventListener('keydown', onKeyDown)
    document.body.classList.toggle(styles.lockScroll, open)

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.classList.remove(styles.lockScroll)
    }
  }, [open])

  function getResolvedHref(item: NavItem) {
    if (item.kind === 'section') {
      // If you're not on home, navigate to home and jump to the section.
      return pathname === '/' ? item.href : `/${item.href}`
    }
    return item.href
  }

  function renderItem(item: NavItem, variant: 'desktop' | 'mobile') {
    const resolvedHref = getResolvedHref(item)
    const isActive =
      item.kind === 'page'
        ? isActivePath(pathname, item.href)
        : pathname === '/'

    const cls = [
      styles.link,
      isActive && item.kind === 'page' ? styles.active : '',
      variant === 'mobile' ? styles.mobileLink : '',
    ]
      .filter(Boolean)
      .join(' ')

    // Smooth scroll only works for same-page hashes (Home).
    if (item.kind === 'section' && pathname === '/') {
      return (
        <SmoothScrollLink
          key={`${item.label}-${item.href}`}
          className={cls}
          href={item.href}
          onClick={() => setOpen(false)}
        >
          {item.label}
        </SmoothScrollLink>
      )
    }

    return (
      <Link
        key={`${item.label}-${item.href}`}
        className={cls}
        href={resolvedHref}
        onClick={() => setOpen(false)}
      >
        {item.label}
      </Link>
    )
  }

  return (
    <header className={styles.navWrap}>
      <div className={styles.navFx} aria-hidden="true" />

      <nav className={styles.nav} aria-label="Primary">
        <div className={styles.inner}>
          <Link
            className={styles.brand}
            href="/"
            aria-label="VETRA — Go to homepage"
          >
            <span className={styles.brandMark}>
              <Image
                src="/logo/vetra-logo-nobg"
                alt=""
                width={64}
                height={64}
                priority
              />
            </span>

            <span className={styles.brandMeta}>
              <span className={styles.brandText}>VETRA &nbsp; TEAM</span>
              <span className={styles.brandDim}>
                WEBSITE DESIGN & DEVELOPMENT
              </span>
            </span>
          </Link>

          <div className={styles.desktop} aria-label="Primary links">
            {items.map((item) => renderItem(item, 'desktop'))}
          </div>

          <button
            type="button"
            className={styles.toggle}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((v) => !v)}
          >
            <span className={styles.bars} aria-hidden="true">
              <span className={styles.bar} />
              <span className={styles.bar} />
              <span className={styles.bar} />
            </span>
          </button>
        </div>

        {/* Mobile */}
        <div
          className={[styles.backdrop, open ? styles.backdropOpen : ''].join(
            ' '
          )}
          aria-hidden="true"
          onClick={() => setOpen(false)}
        />

        <div
          id="mobile-nav"
          className={[styles.drawer, open ? styles.drawerOpen : ''].join(' ')}
          role="dialog"
          aria-modal="true"
          aria-label="Mobile navigation"
        >
          <div className={styles.drawerTop}>
            <div className={styles.drawerTitle}>Menu</div>
            <button
              type="button"
              className={styles.close}
              aria-label="Close menu"
              onClick={() => setOpen(false)}
            >
              <span aria-hidden="true">×</span>
            </button>
          </div>

          <div className={styles.mobileLinks}>
            {items.map((item) => renderItem(item, 'mobile'))}
          </div>

          <div className={styles.drawerFoot}>
            <div className={styles.hint}>
              Built with Next.js • Dark UI • SEO-focused
            </div>
          </div>
        </div>
      </nav>
    </header>
  )
}
