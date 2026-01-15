// src/app/maintenance/page.tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import styles from './page.module.css'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://vetra.asia/'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'Maintenance',
  description:
    'We are currently improving this page. กรุณากลับมาใหม่อีกครั้ง — อยู่ระหว่างปรับปรุงและพัฒนา',
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
  alternates: {
    canonical: '/maintenance',
  },
}

export default function MaintenancePage() {
  return (
    <main className={styles.main} aria-label="Maintenance page">
      <div className={styles.wrap}>
        <div className={styles.card}>
          <div className={styles.badge} aria-hidden="true">
            <span className={styles.dot} />
            <span className={styles.badgeText}>STATUS</span>
          </div>

          <h1 className={styles.h1}>
            อยู่ระหว่าง <span className={styles.accent}>ปรับปรุง</span> /{' '}
            <span className={styles.accent2}>พัฒนา</span>
          </h1>

          <p className={styles.sub}>
            Under maintenance — we’re upgrading this page for a smoother,
            faster, more premium experience.
          </p>

          <div className={styles.hr} />

          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <div className={styles.k}>What’s happening</div>
              <div className={styles.v}>System improvements & UI polish</div>
            </div>
            <div className={styles.infoItem}>
              <div className={styles.k}>When</div>
              <div className={styles.v}>
                Please check back soon <span className={styles.muted}>•</span>{' '}
                ขอบคุณที่รอครับ
              </div>
            </div>
          </div>

          <div className={styles.actions}>
            <Link href="/" className={styles.btnPrimary}>
              Back to Home
            </Link>
            <Link href="/contact" className={styles.btnGhost}>
              Contact
            </Link>
          </div>

          <p className={styles.foot}>
            If you need anything urgent, reach us via the Contact page.
          </p>
        </div>

        <div className={styles.glow} aria-hidden="true" />
      </div>
    </main>
  )
}
