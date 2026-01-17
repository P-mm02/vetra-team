// src/components/footer/footer.tsx
import Image from 'next/image'
import Link from 'next/link'
import styles from './footer.module.css'
import ContactsBox from '@/app/(site)/contact/ContactsBox/ContactsBox'

export default function Footer() {
  return (
    <footer className={styles.footer} aria-label="Site footer">
      <div className={styles.fx} aria-hidden="true" />

      <div className={styles.inner}>
        {/* Brand */}
        <Link className={styles.brand} href="/" aria-label="VETRA — Home">
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
          <ContactsBox />
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
            . All rights reserved.
          </p>

          <div className={styles.metaLinks} aria-label="Footer links">
            <Link className={styles.metaLink} href="/contact">
              Contact
            </Link>
            {/* <span className={styles.sep} aria-hidden="true">
              •
            </span>
            <Link className={styles.metaLink} href="/privacy">
              Privacy
            </Link> */}
          </div>
        </div>
      </div>
    </footer>
  )
}
