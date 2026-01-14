// src/components/nav/nav.tsx
'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import styles from './nav.module.css'

type NavItem = { label: string; href: string }

const NAV_ITEMS: NavItem[] = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about' },
  { label: 'Services', href: '/maintenance' },
  { label: 'Work', href: '/maintenance' },
  { label: 'Process', href: '/maintenance' },
  { label: 'Pricing', href: '/maintenance' },
  { label: 'Contact', href: '/contact' },
]

function isActive(pathname: string, href: string) {
  if (href === '/') return pathname === '/'
  return pathname === href || pathname.startsWith(`${href}/`)
}

export default function Nav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const items = useMemo(() => NAV_ITEMS, [])

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  return (
    <>
      <header className={styles.wrap}>
        <div className={styles.inner}>
          <Link className={styles.brand} href="/" aria-label="VETRA — Home">
            <span className={styles.brandMark}>
              <Image
                src="/logo/vetra-logo-nobg.svg"
                alt=""
                width={52}
                height={52}
                priority
              />
            </span>

            <span className={styles.brandMeta}>
              <span className={styles.brandText}>VETRA TEAM</span>
              <span className={styles.brandDim}>
                WEBSITE DESIGN & DEVELOPMENT
              </span>
            </span>
          </Link>

          <nav className={styles.desktop} aria-label="Primary">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.link} ${
                  isActive(pathname, item.href) ? styles.active : ''
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <button
            type="button"
            className={styles.burger}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            aria-controls="mobile-drawer"
            onClick={() => setOpen((v) => !v)}
          >
            <span className={styles.bars} aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
          </button>
        </div>
      </header>

      {/* Backdrop (click outside to close) */}
      <button
        type="button"
        className={`${styles.backdrop} ${open ? styles.backdropOpen : ''}`}
        aria-label="Close menu"
        onClick={() => setOpen(false)}
      />

      {/* Right drawer */}
      <aside
        id="mobile-drawer"
        className={`${styles.drawer} ${open ? styles.drawerOpen : ''}`}
        aria-hidden={!open}
      >
        <nav className={styles.mobileNav} aria-label="Mobile">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.mobileLink} ${
                isActive(pathname, item.href) ? styles.mobileActive : ''
              }`}
              onClick={() => setOpen(false)}
            >
              <span className={styles.mobileBullet} aria-hidden="true" />
              <span className={styles.mobileText}>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Contact icons grid */}
        <div className={styles.contactBar} aria-label="Quick contact">
          <a
            className={styles.contactIcon}
            href="https://lin.ee/hgKZAHm"
            target="_blank"
            rel="noreferrer"
            aria-label="LINE"
          >
            <Image src="/icons/LINE.png" alt="LINE" width={96} height={96} />
          </a>

          <a
            className={styles.contactIcon}
            href="https://www.facebook.com/profile.php?id=61580630981781"
            target="_blank"
            rel="noreferrer"
            aria-label="Facebook"
          >
            <Image
              src="/icons/Facebook.png"
              alt="Facebook"
              width={96}
              height={96}
            />
          </a>

          <a
            className={styles.contactIcon}
            href="https://fastwork.co/user/poomtawee"
            target="_blank"
            rel="noreferrer"
            aria-label="Fastwork"
          >
            <Image
              src="/icons/Fastwork.svg"
              alt="Fastwork"
              width={96}
              height={96}
            />
          </a>

          <a
            className={styles.contactIcon}
            href="tel:0936661370"
            aria-label="Phone"
          >
            <Image
              src="/icons/Phone.png"
              alt="Phone"
              width={96}
              height={96}
              className={styles.iconPhone}
            />
          </a>
        </div>
      </aside>
    </>
  )
}
