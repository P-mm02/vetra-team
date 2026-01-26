// src/app/(admin)/admin/cms/analytics/AnalyticsEmpty.tsx

import styles from './page.module.css'

export default function AnalyticsEmpty({
  measurementId,
}: {
  measurementId: string
}) {
  return (
    <main className={styles.page} aria-label="Analytics">
      <header className={styles.header}>
        <div className={styles.headerText}>
          <h1 className={styles.h1}>Analytics</h1>
          <p className={styles.sub}>
            Connect GA4 Data API to view analytics inside CMS.
          </p>
        </div>

        <div className={styles.headerRight}>
          <div className={styles.pill}>GA4</div>
        </div>
      </header>

      <section className={styles.panel}>
        <div className={styles.notice}>
          <div className={styles.noticeTitle}>GA4 not configured</div>
          <div className={styles.noticeText}>
            Missing env vars: <code>GA4_PROPERTY_ID</code>,{' '}
            <code>GA4_CLIENT_EMAIL</code>, <code>GA4_PRIVATE_KEY</code>.
            <br />
            Add a Google Cloud service account to your GA4 Property Access
            (Viewer).
          </div>
        </div>

        <div className={styles.helperGrid}>
          <div className={styles.helpCard}>
            <div className={styles.k}>Tracking tag</div>
            <div className={styles.v}>
              Measurement ID:{' '}
              <b>{measurementId ? measurementId : '— (NEXT_PUBLIC_GA_ID)'}</b>
            </div>
            <div className={styles.small}>
              (This is for tracking. Data API is for reading analytics here.)
            </div>
          </div>

          <div className={styles.helpCard}>
            <div className={styles.k}>Pages you care about</div>
            <ul className={styles.list}>
              <li>/</li>
              <li>/about</li>
              <li>/projects</li>
              <li>/services</li>
              <li>/contact</li>
            </ul>
          </div>
        </div>
      </section>
    </main>
  )
}
