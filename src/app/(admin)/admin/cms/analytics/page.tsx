// src/app/(admin)/admin/cms/analytics/page.tsx
import { redirect } from 'next/navigation'
import styles from './page.module.css'
import { getCurrentUser } from '@/lib/auth/session'

// GA4 Data API (server-side)
import { BetaAnalyticsDataClient } from '@google-analytics/data'

function canManageUsers(role: string) {
  return role === 'dev' || role === 'admin'
}

function daysAgoISO(days: number) {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().slice(0, 10)
}

function safeNumber(v: any) {
  const n = Number(v ?? 0)
  return Number.isFinite(n) ? n : 0
}

function safePercent(v: any) {
  const n = safeNumber(v)
  return `${(n * 100).toFixed(1)}%`
}

function gaClientFromEnv() {
  const propertyId = process.env.GA4_PROPERTY_ID
  const clientEmail = process.env.GA4_CLIENT_EMAIL
  const privateKeyRaw = process.env.GA4_PRIVATE_KEY

  if (!propertyId || !clientEmail || !privateKeyRaw) return null

  const privateKey = privateKeyRaw.replace(/\\n/g, '\n')

  const client = new BetaAnalyticsDataClient({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey,
    },
  })

  return { client, propertyId }
}

export default async function AnalyticsPage() {
  const me = await getCurrentUser()
  if (!me) redirect(`/admin/login?next=/admin/cms/analytics`)
  if (!canManageUsers(String(me.role))) redirect('/admin/cms')

  const ga = gaClientFromEnv()
  if (!ga) {
    return (
      <main className={styles.page} aria-label="Analytics">
        <header className={styles.header}>
          <div>
            <h1 className={styles.h1}>Analytics</h1>
            <p className={styles.sub}>
              Connect GA4 Data API to view analytics inside CMS.
            </p>
          </div>
        </header>

        <section className={styles.panel}>
          <div className={styles.notice}>
            <div className={styles.noticeTitle}>GA4 not configured</div>
            <div className={styles.noticeText}>
              Missing env vars: <code>GA4_PROPERTY_ID</code>,{' '}
              <code>GA4_CLIENT_EMAIL</code>, <code>GA4_PRIVATE_KEY</code>.
              <br />
              Add a service account to your GA4 Property Access (Viewer).
            </div>
          </div>

          <div className={styles.helperGrid}>
            <div className={styles.helpCard}>
              <div className={styles.k}>Tracking tag</div>
              <div className={styles.v}>
                Your Measurement ID: <b>G-E91549VDNV</b>
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

  const { client, propertyId } = ga

  // Summary metrics (last 28 days)
  const startDate = daysAgoISO(28)
  const endDate = 'today'

  const [summaryRes] = await client.runReport({
    property: `properties/${propertyId}`,
    dateRanges: [{ startDate, endDate }],
    metrics: [
      { name: 'totalUsers' },
      { name: 'sessions' },
      { name: 'screenPageViews' },
      { name: 'engagementRate' },
    ],
  })

  const m = summaryRes.rows?.[0]?.metricValues ?? []
  const totalUsers = safeNumber(m[0]?.value)
  const sessions = safeNumber(m[1]?.value)
  const pageViews = safeNumber(m[2]?.value)
  const engagementRate = safePercent(m[3]?.value)

  // Top pages (last 28 days)
  const [pagesRes] = await client.runReport({
    property: `properties/${propertyId}`,
    dateRanges: [{ startDate, endDate }],
    dimensions: [{ name: 'pagePath' }],
    metrics: [
      { name: 'screenPageViews' },
      { name: 'sessions' },
      { name: 'totalUsers' },
    ],
    orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
    limit: 25,
  })

  const rows =
    pagesRes.rows?.map((r) => ({
      path: r.dimensionValues?.[0]?.value || '—',
      views: safeNumber(r.metricValues?.[0]?.value),
      sessions: safeNumber(r.metricValues?.[1]?.value),
      users: safeNumber(r.metricValues?.[2]?.value),
    })) ?? []

  return (
    <main className={styles.page} aria-label="Analytics">
      <header className={styles.header}>
        <div>
          <h1 className={styles.h1}>Analytics</h1>
          <p className={styles.sub}>
            GA4 (last 28 days) •{' '}
            <span className={styles.mono}>{startDate}</span> →{' '}
            <span className={styles.mono}>today</span>
          </p>
        </div>

        <div className={styles.headerRight}>
          <div className={styles.pill}>GA4</div>
        </div>
      </header>

      <section className={styles.kpiGrid} aria-label="Key metrics">
        <article className={styles.card}>
          <div className={styles.k}>Total users</div>
          <div className={styles.big}>{totalUsers.toLocaleString()}</div>
        </article>

        <article className={styles.card}>
          <div className={styles.k}>Sessions</div>
          <div className={styles.big}>{sessions.toLocaleString()}</div>
        </article>

        <article className={styles.card}>
          <div className={styles.k}>Page views</div>
          <div className={styles.big}>{pageViews.toLocaleString()}</div>
        </article>

        <article className={styles.card}>
          <div className={styles.k}>Engagement rate</div>
          <div className={styles.big}>{engagementRate}</div>
        </article>
      </section>

      <section className={styles.panel} aria-label="Top pages">
        <div className={styles.panelHead}>
          <h2 className={styles.h2}>Top pages</h2>
          <p className={styles.sub2}>Sorted by views</p>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Page</th>
                <th className={styles.num}>Views</th>
                <th className={styles.num}>Sessions</th>
                <th className={styles.num}>Users</th>
              </tr>
            </thead>
            <tbody>
              {rows.length ? (
                rows.map((r) => (
                  <tr key={`${r.path}-${r.views}-${r.sessions}`}>
                    <td className={styles.path}>
                      <span className={styles.mono}>{r.path}</span>
                    </td>
                    <td className={`${styles.num} ${styles.mono}`}>
                      {r.views.toLocaleString()}
                    </td>
                    <td className={`${styles.num} ${styles.mono}`}>
                      {r.sessions.toLocaleString()}
                    </td>
                    <td className={`${styles.num} ${styles.mono}`}>
                      {r.users.toLocaleString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className={styles.empty}>
                    No data yet (or property has no traffic).
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className={styles.footNote}>
          Tip: GA4 can take a bit before new traffic appears. Use “Test
          installation” in GA.
        </div>
      </section>
    </main>
  )
}
