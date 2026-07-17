import type { Metadata } from 'next'
import Link from 'next/link'
import PageClient from '@/app/(site)/services/pageClient/pageClient'
import styles from '@/app/(site)/services/page.module.css'
import { localizedPath, pageAlternates } from '@/lib/i18n'

const DESC =
  'Estimate website and web app pricing by choosing a base website type and optional features. Prices are approximate and adjusted by project complexity.'

export const metadata: Metadata = {
  title: 'Services',
  description: DESC,
  alternates: pageAlternates('/services', 'en'),
  openGraph: {
    title: 'Services | VETRA',
    description: DESC,
    images: [
      {
        url: '/images/preview/services-og.png',
        width: 1200,
        height: 630,
        alt: 'Website price estimator | VETRA',
      },
    ],
    locale: 'en_US',
    alternateLocale: ['th_TH'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Services | VETRA',
    description: DESC,
    images: ['/images/preview/services-og.png'],
  },
}

export default function EnglishServicesPage() {
  return (
    <main className={styles.page}>
      <section className={`section ${styles.hero}`} aria-label="Services Hero">
        <div className="container">
          <div className={styles.heroflex}>
            <Link href={localizedPath('en', '/services')} className={styles.badge}>
              Services
            </Link>
            <h1 className={styles.h1}>Website Price Estimator</h1>
            <p className={styles.sub}>
              Choose the type of website and the features you need. The system
              will calculate an estimated price range automatically.
            </p>
            <div className={styles.notice} role="note">
              <div className={styles.noticeDot} aria-hidden="true" />
              <p className={styles.noticeText}>
                This is an approximate estimate. Final pricing may include
                discounts or extra included features depending on project
                complexity.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section
        className={`section ${styles.calSection}`}
        aria-label="Services Calculator"
      >
        <div className="container">
          <PageClient locale="en" />
        </div>
      </section>
    </main>
  )
}
