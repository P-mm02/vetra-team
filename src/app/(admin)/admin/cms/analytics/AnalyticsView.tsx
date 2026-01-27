// src/app/(admin)/admin/cms/analytics/AnalyticsView.tsx
'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import styles from './AnalyticsView.module.css'
import type { AnalyticsData } from './function'

import CircleSpining from '@/app/(admin)/admin/cms/_components/loading/CircleSpining/CircleSpining'

const RANGES = [7, 28, 90, 365] as const

function buildHref(rangeDays: number, compare: boolean) {
  const sp = new URLSearchParams()
  sp.set('range', String(rangeDays))
  if (compare) sp.set('compare', '1')
  return `/admin/cms/analytics?${sp.toString()}`
}

function fmtDMY(iso: string) {
  // iso: YYYY-MM-DD -> DD/MM/YYYY
  const [y, m, d] = iso.split('-')
  if (!y || !m || !d) return iso
  return `${d}/${m}/${y}`
}

export default function AnalyticsView({
  data,
  rangeDays,
  compare,
}: {
  data: AnalyticsData
  rangeDays: number
  compare: boolean
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const {
    startDate,
    endDate,
    activeUsers,
    totalUsers,
    sessions,
    pageViews,
    engagementRate,
    compareStartDate,
    compareEndDate,
    deltaTotalUsersPct,
    deltaSessionsPct,
    deltaPageViewsPct,
    deltaEngagementPts,
    rows,
  } = data

  function handleNavigate(nextRangeDays: number, nextCompare: boolean) {
    const href = buildHref(nextRangeDays, nextCompare)
    startTransition(() => router.push(href))
  }

  return (    
    <main className={styles.page} aria-label="Analytics">
      <header className={styles.header}>
        <h1 className={styles.h1}>Analytics GA4</h1>

        <p className={styles.sub}>
          <span className={styles.mono}>{fmtDMY(startDate)}</span> -{' '}
          <span className={styles.mono}>{fmtDMY(endDate)}</span>
          {compare && compareStartDate && compareEndDate ? (
            <>
              {' '}
              VS <span className={styles.mono}>
                {fmtDMY(compareStartDate)}
              </span>{' '}
              - <span className={styles.mono}>{fmtDMY(compareEndDate)}</span>
            </>
          ) : null}
        </p>

        <div className={styles.controls} aria-label="Range controls">
          <div className={styles.seg} role="tablist" aria-label="Range">
            {RANGES.map((d) => {
              const isActive = Number(rangeDays) === d
              return (
                <button
                  key={d}
                  type="button"
                  className={`${styles.segLink} ${
                    isActive ? styles.segLinkActive : ''
                  }`}
                  role="tab"
                  aria-selected={isActive}
                  disabled={isPending}
                  onClick={() => handleNavigate(d, compare)}
                >
                  {d}D
                </button>
              )
            })}
          </div>

          <button
            type="button"
            className={`${styles.toggle} ${compare ? styles.toggleOn : ''}`}
            aria-pressed={compare}
            title="Compare to previous period"
            disabled={isPending}
            onClick={() => handleNavigate(rangeDays, !compare)}
          >
            Compare
          </button>
        </div>
      </header>
      {isPending ? (
        <div className={styles.loadingCenter} aria-label="Loading analytics">
          <CircleSpining />
        </div>
      ) : (
        <>
          <section className={styles.kpiGrid} aria-label="Key metrics">
            <article className={styles.card}>
              <div className={styles.k}>Active users</div>
              <div className={styles.big}>{activeUsers.toLocaleString()}</div>
              <div className={styles.small}>Realtime</div>
            </article>

            <article className={styles.card}>
              <div className={styles.k}>Total users</div>
              <div className={styles.big}>{totalUsers.toLocaleString()}</div>
              {compare ? (
                <div className={styles.delta}>
                  vs prev: {deltaTotalUsersPct ?? '—'}
                </div>
              ) : null}
            </article>

            <article className={styles.card}>
              <div className={styles.k}>Sessions</div>
              <div className={styles.big}>{sessions.toLocaleString()}</div>
              {compare ? (
                <div className={styles.delta}>
                  vs prev: {deltaSessionsPct ?? '—'}
                </div>
              ) : null}
            </article>

            <article className={styles.card}>
              <div className={styles.k}>Page views</div>
              <div className={styles.big}>{pageViews.toLocaleString()}</div>
              {compare ? (
                <div className={styles.delta}>
                  vs prev: {deltaPageViewsPct ?? '—'}
                </div>
              ) : null}
            </article>

            <article className={styles.card}>
              <div className={styles.k}>Engagement rate</div>
              <div className={styles.big}>{engagementRate}</div>
              {compare ? (
                <div className={styles.delta}>
                  vs prev: {deltaEngagementPts ?? '—'}
                </div>
              ) : null}
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
                    {compare ? <th className={styles.num}>Δ Views</th> : null}
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
                        {compare ? (
                          <td className={`${styles.num} ${styles.mono}`}>
                            {r.viewsDeltaPct ?? '—'}
                          </td>
                        ) : null}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={compare ? 5 : 4} className={styles.empty}>
                        No data yet (or property has no traffic).
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className={styles.footNote}>
              Tip: Standard GA4 reports can lag. Realtime above should match GA
              UI instantly.
            </div>
          </section>
        </>
      )}
    </main>

  )
}
