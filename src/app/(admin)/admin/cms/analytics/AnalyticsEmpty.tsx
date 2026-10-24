// src/app/(admin)/admin/cms/analytics/AnalyticsEmpty.tsx

import { getCmsI18n } from '@/lib/cms/i18n-server'
import styles from './page.module.css'

export default async function AnalyticsEmpty({
  measurementId,
}: {
  measurementId: string
}) {
  const { t } = await getCmsI18n()
  return (
    <main className={styles.page} aria-label={t("Analytics", "สถิติผู้เข้าชม")}>
      <header className={styles.header}>
        <div className={styles.headerText}>
          <h1 className={styles.h1}>{t("Analytics", "สถิติผู้เข้าชม")}</h1>
          <p className={styles.sub}>{t("Connect GA4 Data API to view analytics inside CMS.", "เชื่อมต่อ GA4 Data API เพื่อดูสถิติผู้เข้าชมใน CMS")}</p>
        </div>

        <div className={styles.headerRight}>
          <div className={styles.pill}>GA4</div>
        </div>
      </header>

      <section className={styles.panel}>
        <div className={styles.notice}>
          <div className={styles.noticeTitle}>{t("GA4 not configured", "ยังไม่ได้ตั้งค่า GA4")}</div>
          <div className={styles.noticeText}>{t("Missing env vars:", "ยังไม่ได้ตั้งค่าตัวแปร:")}{' '}<code>GA4_PROPERTY_ID</code>,{' '}
            <code>GA4_CLIENT_EMAIL</code>, <code>GA4_PRIVATE_KEY</code>.
            <br />{t("Add a Google Cloud service account to your GA4 Property Access (Viewer).", "เพิ่มบัญชีบริการ Google Cloud ในสิทธิ์เข้าถึงพร็อพเพอร์ตี GA4 โดยให้สิทธิ์ผู้ดู (Viewer)")}</div>
        </div>

        <div className={styles.helperGrid}>
          <div className={styles.helpCard}>
            <div className={styles.k}>{t("Tracking tag", "แท็กติดตาม")}</div>
            <div className={styles.v}>{t("Measurement ID:", "รหัส Measurement:")}{' '}
              <b>{measurementId ? measurementId : '— (NEXT_PUBLIC_GA_ID)'}</b>
            </div>
            <div className={styles.small}>{t("(This is for tracking. Data API is for reading analytics here.)", "แท็กนี้ใช้ติดตามการเข้าชม ส่วน Data API ใช้แสดงสถิติในหน้านี้")}</div>
          </div>

          <div className={styles.helpCard}>
            <div className={styles.k}>{t("Pages you care about", "หน้าหลักของเว็บไซต์")}</div>
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
