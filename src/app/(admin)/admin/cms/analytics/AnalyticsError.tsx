// src/app/(admin)/admin/cms/analytics/AnalyticsError.tsx

import { getCmsI18n } from '@/lib/cms/i18n-server'
import styles from './page.module.css'

export default async function AnalyticsError({ msg }: { msg: string }) {
  const { t } = await getCmsI18n()
  const explanation = /permission|forbidden|access denied|403/i.test(msg)
    ? t('The service account does not have access to this GA4 property. Check its Viewer permission.', 'บัญชีบริการไม่มีสิทธิ์เข้าถึงพร็อพเพอร์ตี GA4 นี้ กรุณาตรวจสอบสิทธิ์ผู้ดู (Viewer)')
    : /credential|private key|unauthenticated|invalid_grant|401/i.test(msg)
      ? t('Google could not verify the service account credentials. Check the configured email and private key.', 'Google ตรวจสอบข้อมูลยืนยันตัวตนของบัญชีบริการไม่สำเร็จ กรุณาตรวจสอบอีเมลและคีย์ส่วนตัวที่ตั้งค่าไว้')
      : /quota|resource.exhausted|429/i.test(msg)
        ? t('The GA4 request limit has been reached. Please try again later.', 'มีการเรียกข้อมูล GA4 ถึงขีดจำกัดแล้ว กรุณาลองอีกครั้งภายหลัง')
        : t('Analytics is temporarily unavailable. Check the connection settings below and try again.', 'ยังไม่สามารถแสดงสถิติได้ในขณะนี้ กรุณาตรวจสอบการตั้งค่าด้านล่างแล้วลองอีกครั้ง')
  return (
    <main className={styles.page} aria-label={t("Analytics", "สถิติผู้เข้าชม")}>
      <header className={styles.header}>
        <div className={styles.headerText}>
          <h1 className={styles.h1}>{t("Analytics", "สถิติผู้เข้าชม")}</h1>
          <p className={styles.sub}>{t("GA4 Data API error (check permissions / API enabled).", "เชื่อมต่อ GA4 Data API ไม่สำเร็จ กรุณาตรวจสอบสิทธิ์และการเปิดใช้ API")}</p>
        </div>

        <div className={styles.headerRight}>
          <div className={styles.pill}>GA4</div>
        </div>
      </header>

      <section className={styles.panel}>
        <div className={styles.notice}>
          <div className={styles.noticeTitle}>{t("GA4 request failed", "เรียกข้อมูล GA4 ไม่สำเร็จ")}</div>
          <div className={styles.noticeText}>
            <p>{explanation}</p>
            <details><summary>{t('Technical details', 'รายละเอียดทางเทคนิค')}</summary><p className={styles.mono} lang="en">{msg}</p></details>
          </div>
        </div>

        <div className={styles.small}>{t("Quick checklist:", "สิ่งที่ควรตรวจสอบ:")}<ul className={styles.list}>
            <li>{t("Enable “Google Analytics Data API” in Google Cloud", "เปิดใช้ “Google Analytics Data API” ใน Google Cloud")}</li>
            <li>{t("Service account added to GA4 Property Access (Viewer)", "เพิ่มบัญชีบริการในสิทธิ์เข้าถึงพร็อพเพอร์ตี GA4 โดยให้สิทธิ์ผู้ดู (Viewer)")}</li>
            <li>{t('Check the service account email and private key, including its line breaks.', 'ตรวจสอบอีเมลและคีย์ส่วนตัวของบัญชีบริการ รวมถึงการขึ้นบรรทัดใหม่ของคีย์')}</li>
            <li>{t("Redeploy after changing env vars", "เผยแพร่เว็บไซต์อีกครั้งหลังแก้ไขตัวแปรสภาพแวดล้อม")}</li>
          </ul>
        </div>
      </section>
    </main>
  )
}
