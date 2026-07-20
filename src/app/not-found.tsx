// src/app/not-found.tsx
import Link from 'next/link'
import styles from './not-found.module.css'

export default function NotFound() {
  return (
    <main className={styles.page} aria-label="ไม่พบหน้า">
      <section className={styles.card} aria-label="ไม่พบหน้า 404">
        <div className={styles.kicker}>404 • ไม่พบหน้า</div>

        <h1 className={styles.h1}>
          ไม่พบหน้านี้ <span className={styles.h1Accent}>(404)</span>
        </h1>

        <p className={styles.subhead}>
          ลิงก์อาจเปลี่ยนไปแล้ว หรือคุณพิมพ์ URL ไม่ถูกต้อง ลองกลับไปหน้าแรก
          หรือไปหน้าติดต่อเพื่อให้ผมช่วยนำทางได้ครับ
        </p>

        <div className={styles.actions}>
          <Link className={styles.btnPrimary} href="/">
            กลับหน้าแรก
          </Link>

          <Link className={styles.btnGhost} href="/contact">
            ไปหน้าติดต่อ
          </Link>

          <Link className={styles.btnSoft} href="/services">
            ดูบริการ
          </Link>
        </div>

        <div className={styles.quick}>
          <div className={styles.quickTitle}>ลิงก์ยอดนิยม</div>
          <div className={styles.quickLinks}>
            <Link className={styles.quickLink} href="/services">
              บริการ
            </Link>
            <Link className={styles.quickLink} href="/projects">
              ผลงาน
            </Link>
            <Link className={styles.quickLink} href="/contact">
              ติดต่อ
            </Link>
            <Link className={styles.quickLink} href="/about">
              เกี่ยวกับเรา
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
