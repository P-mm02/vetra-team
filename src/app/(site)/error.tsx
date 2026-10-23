'use client'

import Link from 'next/link'
import styles from './error.module.css'

export default function SiteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className={styles.page}>
      <section className={styles.card} role="alert" aria-labelledby="site-error-title">
        <span className={styles.eyebrow}>VETRA · แจ้งสถานะ</span>
        <h1 id="site-error-title">ยังโหลดข้อมูลผลงานไม่ได้</h1>
        <p>ระบบขัดข้องชั่วคราว กรุณาลองอีกครั้งในอีกสักครู่ หากต้องการติดต่อเรา ยังสามารถใช้หน้าติดต่อได้ตามปกติ</p>
        <div className={styles.actions}>
          <button type="button" className={styles.primaryButton} onClick={reset}>ลองอีกครั้ง</button>
          <Link className={styles.secondaryButton} href="/contact">ติดต่อเรา</Link>
        </div>
      </section>
    </main>
  )
}
