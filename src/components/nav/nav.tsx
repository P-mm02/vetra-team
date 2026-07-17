// src/components/nav/nav.tsx
'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import styles from './nav.module.css'
import ContactsBox from '@/app/(site)/contact/ContactsBox/ContactsBox'
import {
  localizedPath,
  navItems,
  switchLocalePath,
  type Locale,
} from '@/lib/i18n'

function isActive(pathname: string, href: string) {
  if (href === '/' || href === '/en') return pathname === href
  return pathname === href || pathname.startsWith(`${href}/`)
}

export default function Nav({ locale = 'th' }: { locale?: Locale }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const items = useMemo(() => navItems(locale), [locale])
  const targetLocale: Locale = locale === 'en' ? 'th' : 'en'
  const languageHref = switchLocalePath(pathname, targetLocale)
  const languageLabel = targetLocale.toUpperCase()
  const homeLabel = locale === 'en' ? 'Home' : 'หน้าแรก'
  const closeMenuLabel = locale === 'en' ? 'Close menu' : 'ปิดเมนู'
  const openMenuLabel = locale === 'en' ? 'Open menu' : 'เปิดเมนู'
  const primaryLabel = locale === 'en' ? 'Primary' : 'เมนูหลัก'
  const mobileLabel = locale === 'en' ? 'Mobile' : 'เมนูมือถือ'
  const switchLabel =
    targetLocale === 'en' ? 'Switch language to English' : 'เปลี่ยนภาษาเป็นไทย'

  useEffect(() => {
    setOpen(false)
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [pathname])

  return (
    <>
      <header className={styles.wrap}>
        <div className={styles.inner}>
          <Link
            className={styles.brand}
            href={localizedPath(locale, '/')}
            aria-label={`VETRA — ${homeLabel}`}
          >
            <span className={styles.brandMark}>
              <Image
                src="/logo/vetra-logo-nobg.svg"
                alt=""
                width={128}
                height={128}
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

          <nav className={styles.desktop} aria-label={primaryLabel}>
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

            <Link
              className={`${styles.link} ${styles.langLink}`}
              href={languageHref}
              aria-label={switchLabel}
            >
              {languageLabel}
            </Link>
          </nav>

          <button
            type="button"
            className={styles.burger}
            aria-label={open ? closeMenuLabel : openMenuLabel}
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
        aria-label={closeMenuLabel}
        onClick={() => setOpen(false)}
      />

      {/* Right drawer */}
      <aside
        id="mobile-drawer"
        className={`${styles.drawer} ${open ? styles.drawerOpen : ''}`}
        aria-hidden={!open}
      >
        <nav className={styles.mobileNav} aria-label={mobileLabel}>
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

          <Link
            href={languageHref}
            className={styles.mobileLink}
            onClick={() => setOpen(false)}
            aria-label={switchLabel}
          >
            <span className={styles.mobileBullet} aria-hidden="true" />
            <span className={styles.mobileText}>{languageLabel}</span>
          </Link>
        </nav>

        {/* Contact box at bottom of drawer */}
        <div className={styles.drawerContact}>
          <ContactsBox
            title={locale === 'en' ? 'Contact' : 'ติดต่อ'}
            locale={locale}
          />
        </div>
      </aside>
    </>
  )
}
