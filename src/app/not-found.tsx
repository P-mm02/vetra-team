// src/app/not-found.tsx
import Link from 'next/link'
import styles from './not-found.module.css'

export default function NotFound() {
  return (
    <main className={styles.page} aria-label="Not Found Page">
      <section className={styles.card} aria-label="404 Not Found">
        <div className={styles.fx} aria-hidden="true" />

        <div className={styles.kicker}>404 • Not Found</div>

        <h1 className={styles.h1}>
          ไม่พบหน้านี้ <span className={styles.h1Accent}>(404)</span>
        </h1>

        <p className={styles.subhead}>
          ลิงก์อาจเปลี่ยนไปแล้ว หรือคุณพิมพ์ URL ไม่ถูกต้อง ลองกลับไปหน้าแรก
          หรือไปหน้าติดต่อเพื่อให้ผมช่วยนำทางได้ครับ
        </p>

        <div className={styles.actions}>
          <Link className={styles.btnPrimary} href="/">
            กลับหน้า Home
          </Link>

          <Link className={styles.btnGhost} href="/contact">
            ไปหน้า Contact
          </Link>

          <Link className={styles.btnSoft} href="/services">
            ดู Services
          </Link>
        </div>

        <div className={styles.quick}>
          <div className={styles.quickTitle}>ลิงก์ยอดนิยม</div>
          <div className={styles.quickLinks}>
            <Link className={styles.quickLink} href="/pricing">
              Pricing
            </Link>
            <Link className={styles.quickLink} href="/work">
              Work
            </Link>
            <Link className={styles.quickLink} href="/process">
              Process
            </Link>
            <Link className={styles.quickLink} href="/about">
              About
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
