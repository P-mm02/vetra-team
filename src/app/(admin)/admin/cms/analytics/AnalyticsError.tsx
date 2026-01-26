// src/app/(admin)/admin/cms/analytics/AnalyticsError.tsx

import styles from './page.module.css'

export default function AnalyticsError({ msg }: { msg: string }) {
  return (
    <main className={styles.page} aria-label="Analytics">
      <header className={styles.header}>
        <div className={styles.headerText}>
          <h1 className={styles.h1}>Analytics</h1>
          <p className={styles.sub}>
            GA4 Data API error (check permissions / API enabled).
          </p>
        </div>

        <div className={styles.headerRight}>
          <div className={styles.pill}>GA4</div>
        </div>
      </header>

      <section className={styles.panel}>
        <div className={styles.notice}>
          <div className={styles.noticeTitle}>GA4 request failed</div>
          <div className={styles.noticeText}>
            <span className={styles.mono}>{msg}</span>
          </div>
        </div>

        <div className={styles.small}>
          Quick checklist:
          <ul className={styles.list}>
            <li>Enable “Google Analytics Data API” in Google Cloud</li>
            <li>Service account added to GA4 Property Access (Viewer)</li>
            <li>Env keys are correct (no quotes, private key has \n)</li>
            <li>Redeploy after changing env vars</li>
          </ul>
        </div>
      </section>
    </main>
  )
}
