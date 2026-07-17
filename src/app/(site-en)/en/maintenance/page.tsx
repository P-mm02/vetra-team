import type { Metadata } from 'next'
import Link from 'next/link'
import styles from '@/app/(site)/maintenance/page.module.css'
import { pageAlternates } from '@/lib/i18n'

export const metadata: Metadata = {
  title: 'Maintenance',
  description:
    'This page is currently under maintenance while VETRA improves the experience.',
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
  alternates: pageAlternates('/maintenance', 'en'),
}

export default function EnglishMaintenancePage() {
  return (
    <main className={styles.main} aria-label="Maintenance page">
      <div className={styles.wrap}>
        <div className={styles.card}>
          <div className={styles.badge} aria-hidden="true">
            <span className={styles.dot} />
            <span className={styles.badgeText}>STATUS</span>
          </div>

          <h1 className={styles.h1}>
            Page under <span className={styles.accent}>maintenance</span>
          </h1>

          <p className={styles.sub}>
            We are upgrading this page for a smoother, faster, more premium
            experience.
          </p>

          <div className={styles.hr} />

          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <div className={styles.k}>What's happening</div>
              <div className={styles.v}>System improvements and UI polish</div>
            </div>
            <div className={styles.infoItem}>
              <div className={styles.k}>When</div>
              <div className={styles.v}>Please check back soon</div>
            </div>
          </div>

          <div className={styles.actions}>
            <Link href="/en" className={styles.btnPrimary}>
              Back to Home
            </Link>
            <Link href="/en/contact" className={styles.btnGhost}>
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
