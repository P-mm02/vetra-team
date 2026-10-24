// src/app/(admin)/admin/cms/analytics/AnalyticsView.tsx
'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useCmsI18n } from '@/components/cms/CmsLanguageProvider'
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

export default function AnalyticsView({
  data,
  rangeDays,
  compare,
}: {
  data: AnalyticsData
  rangeDays: number
  compare: boolean
}) {
  const { t, formatNumber, formatDate } = useCmsI18n()
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

  function rangeDate(iso: string) {
    return formatDate(`${iso}T00:00:00.000Z`, { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' })
  }

  function percentage(value: string | undefined, signed = false) {
    if (!value || !/^[+-]?\d+(?:\.\d+)?%$/.test(value)) return '—'
    return formatNumber(Number.parseFloat(value) / 100, {
      style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1,
      signDisplay: signed ? 'exceptZero' : 'auto',
    })
  }

  function points(value: string | undefined) {
    if (!value || !/^[+-]?\d+(?:\.\d+)? pts$/.test(value)) return '—'
    const number = formatNumber(Number.parseFloat(value), { minimumFractionDigits: 1, maximumFractionDigits: 1, signDisplay: 'exceptZero' })
    return t(`${number} pts`, `${number} จุดเปอร์เซ็นต์`)
  }

  return (    
    <main className={styles.page} aria-label={t("Analytics", "สถิติผู้เข้าชม")}>
      <header className={styles.header}>
        <h1 className={styles.h1}>{t("Analytics GA4", "สถิติผู้เข้าชม GA4")}</h1>

        <p className={styles.sub}>
          <span>{rangeDate(startDate)}</span> –{' '}
          <span>{rangeDate(endDate)}</span>
          {compare && compareStartDate && compareEndDate ? (
            <>
              {' '}
              {t('versus', 'เทียบกับ')} <span>
                {rangeDate(compareStartDate)}
              </span>{' '}
              – <span>{rangeDate(compareEndDate)}</span>
            </>
          ) : null}
        </p>

        <div className={styles.controls} aria-label={t("Range controls", "ตัวเลือกช่วงเวลา")}>
          <div className={styles.seg} role="group" aria-label={t("Range", "ช่วงเวลา")}>
            {RANGES.map((d) => {
              const isActive = Number(rangeDays) === d
              return (
                <button
                  key={d}
                  type="button"
                  className={`${styles.segLink} ${
                    isActive ? styles.segLinkActive : ''
                  }`}
                  aria-pressed={isActive}
                  disabled={isPending}
                  onClick={() => handleNavigate(d, compare)}
                >
                  {t(`${formatNumber(d)} days`, `${formatNumber(d)} วัน`)}
                </button>
              )
            })}
          </div>

          <button
            type="button"
            className={`${styles.toggle} ${compare ? styles.toggleOn : ''}`}
            aria-pressed={compare}
            title={t("Compare to previous period", "เปรียบเทียบกับช่วงเวลาก่อนหน้า")}
            disabled={isPending}
            onClick={() => handleNavigate(rangeDays, !compare)}
          >{t("Compare", "เปรียบเทียบ")}</button>
        </div>
      </header>
      {isPending ? (
        <div className={styles.loadingCenter} aria-label={t("Loading analytics", "กำลังโหลดสถิติผู้เข้าชม")}>
          <CircleSpining />
        </div>
      ) : (
        <>
          <section className={styles.kpiGrid} aria-label={t("Key metrics", "สถิติสำคัญ")}>
            <article className={styles.card}>
              <div className={styles.k}>{t("Active users", "ผู้ใช้ที่กำลังใช้งาน")}</div>
              <div className={styles.big}>{formatNumber(activeUsers)}</div>
              <div className={styles.small}>{t("Realtime", "ขณะนี้")}</div>
            </article>

            <article className={styles.card}>
              <div className={styles.k}>{t("Total users", "ผู้ใช้ทั้งหมด")}</div>
              <div className={styles.big}>{formatNumber(totalUsers)}</div>
              {compare ? (
                <div className={styles.delta}>
                  {t('vs previous:', 'เทียบช่วงก่อน:')} {percentage(deltaTotalUsersPct, true)}
                </div>
              ) : null}
            </article>

            <article className={styles.card}>
              <div className={styles.k}>{t("Sessions", "เซสชัน")}</div>
              <div className={styles.big}>{formatNumber(sessions)}</div>
              {compare ? (
                <div className={styles.delta}>
                  {t('vs previous:', 'เทียบช่วงก่อน:')} {percentage(deltaSessionsPct, true)}
                </div>
              ) : null}
            </article>

            <article className={styles.card}>
              <div className={styles.k}>{t("Page views", "การดูหน้าเว็บ")}</div>
              <div className={styles.big}>{formatNumber(pageViews)}</div>
              {compare ? (
                <div className={styles.delta}>
                  {t('vs previous:', 'เทียบช่วงก่อน:')} {percentage(deltaPageViewsPct, true)}
                </div>
              ) : null}
            </article>

            <article className={styles.card}>
              <div className={styles.k}>{t("Engagement rate", "อัตราการมีส่วนร่วม")}</div>
              <div className={styles.big}>{percentage(engagementRate)}</div>
              {compare ? (
                <div className={styles.delta}>
                  {t('vs previous:', 'เทียบช่วงก่อน:')} {points(deltaEngagementPts)}
                </div>
              ) : null}
            </article>
          </section>

          <section className={styles.panel} aria-label={t("Top pages", "หน้าเว็บยอดนิยม")}>
            <div className={styles.panelHead}>
              <h2 className={styles.h2}>{t("Top pages", "หน้าเว็บยอดนิยม")}</h2>
              <p className={styles.sub2}>{t("Sorted by views", "เรียงตามจำนวนการดู")}</p>
            </div>

            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>{t("Page", "หน้าเว็บ")}</th>
                    <th className={styles.num}>{t("Views", "จำนวนการดู")}</th>
                    <th className={styles.num}>{t("Sessions", "เซสชัน")}</th>
                    <th className={styles.num}>{t("Users", "ผู้ใช้")}</th>
                    {compare ? <th className={styles.num}>{t("Δ Views", "ผลต่างการดู")}</th> : null}
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
                          {formatNumber(r.views)}
                        </td>
                        <td className={`${styles.num} ${styles.mono}`}>
                          {formatNumber(r.sessions)}
                        </td>
                        <td className={`${styles.num} ${styles.mono}`}>
                          {formatNumber(r.users)}
                        </td>
                        {compare ? (
                          <td className={`${styles.num} ${styles.mono}`}>
                            {percentage(r.viewsDeltaPct, true)}
                          </td>
                        ) : null}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={compare ? 5 : 4} className={styles.empty}>{t("No data yet (or property has no traffic).", "ยังไม่มีข้อมูล หรือพร็อพเพอร์ตียังไม่มีผู้เข้าชม")}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className={styles.footNote}>{t("Standard GA4 reports can be delayed. Realtime shows the latest activity received.", "รายงานมาตรฐาน GA4 อาจแสดงข้อมูลล่าช้า สถิติขณะนี้จะแสดงกิจกรรมล่าสุดที่ระบบได้รับ")}</div>
          </section>
        </>
      )}
    </main>

  )
}
