'use client'

// src/app/(admin)/admin/cms/analytics/Loading.tsx
import { useCmsI18n } from '@/components/cms/CmsLanguageProvider'
import styles from './AnalyticsView.module.css'

import Skeleton from '@/app/(admin)/admin/cms/_components/loading/Skeleton/Skeleton'
import CircleSpining from '@/app/(admin)/admin/cms/_components/loading/CircleSpining/CircleSpining'

export default function Loading() {
  const { t, formatNumber } = useCmsI18n()
  return (
    <main className={styles.page} aria-label={t("Loading analytics", "กำลังโหลดสถิติผู้เข้าชม")}>
      <header className={styles.header}>
        <h1 className={styles.h1}>{t("Analytics GA4", "สถิติผู้เข้าชม GA4")}</h1>

        <div className={styles.sub}>
          <Skeleton lines={1} style={{ width: '20rem', maxWidth: '90vw' }} />
        </div>

        <div className={styles.controls} aria-label={t("Range controls", "ตัวเลือกช่วงเวลา")}>
          <div className={styles.seg} aria-label={t("Range", "ช่วงเวลา")}>
            {[7, 28, 90, 365].map((days) => <button key={days} type="button" className={styles.segLink} disabled>{t(`${formatNumber(days)} days`, `${formatNumber(days)} วัน`)}</button>)}
          </div>

          <button type="button" className={styles.toggle} disabled>{t("Compare", "เปรียบเทียบ")}</button>
        </div>
      </header>

      <div className={styles.loadingCenter} aria-label={t("Loading", "กำลังโหลด")}>
        <CircleSpining />
      </div>

      <section className={styles.kpiGrid} aria-label={t("Key metrics loading", "กำลังโหลดสถิติสำคัญ")}>
        <article className={styles.card}>
          <div className={styles.k}>{t("Active users", "ผู้ใช้ที่กำลังใช้งาน")}</div>
          <Skeleton lines={3} />
        </article>

        <article className={styles.card}>
          <div className={styles.k}>{t("Total users", "ผู้ใช้ทั้งหมด")}</div>
          <Skeleton lines={3} />
        </article>

        <article className={styles.card}>
          <div className={styles.k}>{t("Sessions", "เซสชัน")}</div>
          <Skeleton lines={3} />
        </article>

        <article className={styles.card}>
          <div className={styles.k}>{t("Page views", "การดูหน้าเว็บ")}</div>
          <Skeleton lines={3} />
        </article>

        <article className={styles.card}>
          <div className={styles.k}>{t("Engagement rate", "อัตราการมีส่วนร่วม")}</div>
          <Skeleton lines={3} />
        </article>
      </section>

      <section className={styles.panel} aria-label={t("Top pages loading", "กำลังโหลดหน้าเว็บยอดนิยม")}>
        <div className={styles.panelHead}>
          <h2 className={styles.h2}>{t("Top pages", "หน้าเว็บยอดนิยม")}</h2>
          <p className={styles.sub2}>{t("Sorted by views", "เรียงตามจำนวนการดู")}</p>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table} style={{position: 'relative', height: '15rem'}} aria-label={t("Loading top pages table", "กำลังโหลดตารางหน้าเว็บยอดนิยม")}>
            <thead>
              <tr>
                <th>{t("Page", "หน้าเว็บ")}</th>
                <th className={styles.num}>{t("Views", "จำนวนการดู")}</th>
                <th className={styles.num}>{t("Sessions", "เซสชัน")}</th>
                <th className={styles.num}>{t("Users", "ผู้ใช้")}</th>
                <th className={styles.num}>{t("Δ Views", "ผลต่างการดู")}</th>
              </tr>
            </thead>
            <tbody>
              <tr><td colSpan={5}><Skeleton lines={6} /></td></tr>
            </tbody>
          </table>
        </div>

        <div className={styles.footNote}>{t("Standard GA4 reports can be delayed. Realtime shows the latest activity received.", "รายงานมาตรฐาน GA4 อาจแสดงข้อมูลล่าช้า สถิติขณะนี้จะแสดงกิจกรรมล่าสุดที่ระบบได้รับ")}</div>
      </section>
    </main>
  )
}
