// src/app/(site)/services/page.tsx
import type { Metadata } from 'next'
import PageClient from './pageClient/pageClient'
import styles from './page.module.css'
import Link from 'next/link'

const TH_DESC =
  'ประเมินราคาเว็บไซต์และเว็บแอป เลือกประเภทบริการและฟังก์ชันเสริม ระบบจะคำนวณราคารวมให้โดยอัตโนมัติ (ราคาโดยประมาณ)'

export const metadata: Metadata = {
  title: 'Services |',
  description: TH_DESC,
  openGraph: {
    title: 'Services | VETRA',
    description: TH_DESC,
    images: [
      {
        url: '/images/preview/services-og.png',
        width: 1200,
        height: 630,
        alt: 'ประเมินราคาเว็บไซต์ | Vetra',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Services | Vetra',
    description: TH_DESC,
    images: ['/images/preview/services-og.png'],
  },
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
