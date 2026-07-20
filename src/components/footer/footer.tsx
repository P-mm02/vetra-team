// src/components/footer/footer.tsx
import Image from 'next/image'
import Link from 'next/link'
import styles from './footer.module.css'
import ContactsBox from '@/app/(site)/contact/ContactsBox/ContactsBox'
import { localizedPath, type Locale } from '@/lib/i18n'

const copy = {
  th: {
    footerLabel: 'ส่วนท้ายเว็บไซต์',
    homeLabel: 'VETRA — หน้าแรก',
    linksLabel: 'ลิงก์ส่วนท้ายเว็บไซต์',
    contact: 'ติดต่อ',
    privacy: 'นโยบายความเป็นส่วนตัว',
    terms: 'ข้อกำหนดและเงื่อนไข',
    rights: 'สงวนลิขสิทธิ์',
  },
  en: {
    footerLabel: 'Site footer',
    homeLabel: 'VETRA — Home',
    linksLabel: 'Footer links',
    contact: 'Contact',
    privacy: 'Privacy',
    terms: 'Terms',
    rights: 'All rights reserved',
  },
} satisfies Record<Locale, Record<string, string>>

export default function Footer({ locale = 'th' }: { locale?: Locale }) {
  const t = copy[locale]

  return (
    <footer className={styles.footer} aria-label={t.footerLabel}>
      <div className={styles.fx} aria-hidden="true" />

      <div className={styles.inner}>
        {/* Brand */}
        <Link
          className={styles.brand}
          href={localizedPath(locale, '/')}
          aria-label={t.homeLabel}
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

        {/* Contact */}
        <div className={styles.ContactsBoxWrapper}>
          <ContactsBox locale={locale} />
        </div>

        {/* Copyright */}
        <div className={styles.bottom}>
          <p className={styles.copy}>
            © 2026{' '}
            <a
              href="https://vetra.asia"
              style={{
                background:
                  'linear-gradient(90deg, rgb(0, 141, 212), rgb(105, 49, 209))',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
                fontWeight: 900,
                textDecoration: 'none',
                WebkitTextStroke: '0.6px rgba(10, 8, 25, 0.6)',
                textShadow:
                  '0 1px 0 rgba(255,255,255,0.3), 0 6px 16px rgba(70, 20, 255, 0.3)',
              }}
            >
              <b>VETRA</b>
            </a>
            . {t.rights}.
          </p>

          <div className={styles.metaLinks} aria-label={t.linksLabel}>
            <Link
              className={styles.metaLink}
              href={localizedPath(locale, '/contact')}
            >
              {t.contact}
            </Link>
            <span className={styles.sep} aria-hidden="true">
              •
            </span>
            <Link
              className={styles.metaLink}
              href={localizedPath(locale, '/privacy')}
            >
              {t.privacy}
            </Link>
            <span className={styles.sep} aria-hidden="true">
              •
            </span>
            <Link
              className={styles.metaLink}
              href={localizedPath(locale, '/terms')}
            >
              {t.terms}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
