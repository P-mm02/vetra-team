// src/app/(admin)/admin/cms/analytics/Loading.tsx
import styles from './AnalyticsView.module.css'

import Skeleton from '@/app/(admin)/admin/cms/_components/loading/Skeleton/Skeleton'
import CircleSpining from '@/app/(admin)/admin/cms/_components/loading/CircleSpining/CircleSpining'

export default function Loading() {
  return (
    <main className={styles.page} aria-label="Loading analytics">
      <header className={styles.header}>
        <h1 className={styles.h1}>Analytics GA4</h1>

        <p className={styles.sub}>
          <Skeleton lines={1} style={{ width: '20rem', maxWidth: '90vw' }} />
        </p>

        <div className={styles.controls} aria-label="Range controls">
          <div className={styles.seg} aria-label="Range">
            <button type="button" className={styles.segLink} disabled>
              7D
            </button>
            <button type="button" className={styles.segLink} disabled>
              28D
            </button>
            <button type="button" className={styles.segLink} disabled>
              90D
            </button>
            <button type="button" className={styles.segLink} disabled>
              365D
            </button>
          </div>

          <button type="button" className={styles.toggle} disabled>
            Compare
          </button>
        </div>
      </header>

      <div className={styles.loadingCenter} aria-label="Loading">
        <CircleSpining />
      </div>

      <section className={styles.kpiGrid} aria-label="Key metrics loading">
        <article className={styles.card}>
          <div className={styles.k}>Active users</div>
          <Skeleton lines={3} />
        </article>

        <article className={styles.card}>
          <div className={styles.k}>Total users</div>
          <Skeleton lines={3} />
        </article>

        <article className={styles.card}>
          <div className={styles.k}>Sessions</div>
          <Skeleton lines={3} />
        </article>

        <article className={styles.card}>
          <div className={styles.k}>Page views</div>
          <Skeleton lines={3} />
        </article>

        <article className={styles.card}>
          <div className={styles.k}>Engagement rate</div>
          <Skeleton lines={3} />
        </article>
      </section>

      <section className={styles.panel} aria-label="Top pages loading">
        <div className={styles.panelHead}>
          <h2 className={styles.h2}>Top pages</h2>
          <p className={styles.sub2}>Sorted by views</p>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table} style={{position: 'relative', height: '15rem'}} aria-label="Loading top pages table">
            <thead>
              <tr>
                <th>Page</th>
                <th className={styles.num}>Views</th>
                <th className={styles.num}>Sessions</th>
                <th className={styles.num}>Users</th>
                <th className={styles.num}>Δ Views</th>
              </tr>
            </thead>
            <thead>
                <Skeleton lines={6} style={{ position: 'absolute', padding: '0.5rem ', height: '80%' }} />
            </thead>
          </table>
        </div>

        <div className={styles.footNote}>
          Tip: Standard GA4 reports can lag. Realtime above should match GA UI
          instantly.
        </div>
      </section>
    </main>
  )
}
