// src/app/(site)/services/page.tsx
import type { Metadata } from 'next'
import PageClient from './pageClient/pageClient'
import styles from './page.module.css'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Services | Vetra',
  description:
    'Estimate website and web app pricing by selecting service type and add-on features.',
}

export default function ServicesPage() {
  return (
    <main className={styles.page}>
      <section className={`section ${styles.hero}`} aria-label="Services Hero">
        <div className="container">
          <div className={styles.heroflex}>
            <Link href="/services" className={styles.badge}>
              Services
            </Link>
            <h1 className={styles.h1}>ประเมินราคาเว็บไซต์</h1>
            <p className={styles.sub}>
              &nbsp;&nbsp;เลือกประเภทเว็บไซต์ และฟังก์ชันที่ต้องการ
              ระบบจะรวมราคาให้แบบอัตโนมัติ&nbsp;
            </p>
            <div className={styles.notice} role="note">
              <div className={styles.noticeDot} aria-hidden="true" />
              <p className={styles.noticeText}>
                เป็นราคาโดยประมาณเท่านั้น ราคาจริงจะมีหักส่วนลด
                และแถมฟังก์ชันให้ โดยคิดตามความยากง่ายของงาน
              </p>
            </div>
          </div>
        </div>
      </section>

      <section
        className={`section ${styles.calSection}`}
        aria-label="Services Calculator"
      >
        <div className="container">
          <PageClient />
        </div>
      </section>
    </main>
  )
}
