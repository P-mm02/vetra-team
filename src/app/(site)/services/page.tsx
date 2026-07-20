// src/app/(site)/services/page.tsx
import type { Metadata } from 'next'
import PageClient from './pageClient/pageClient'
import styles from './page.module.css'
import Link from 'next/link'
import { localizedPath, pageAlternates } from '@/lib/i18n'
import OngoingServices from './OngoingServices/OngoingServices'

const TH_DESC =
  'ประเมินราคาเว็บไซต์และเว็บแอป เลือกประเภทบริการและฟังก์ชันเสริม ระบบจะคำนวณราคารวมให้โดยอัตโนมัติ (ราคาโดยประมาณ)'

export const metadata: Metadata = {
  title: 'บริการ',
  description: TH_DESC,
  alternates: pageAlternates('/services', 'th'),
  openGraph: {
    title: 'บริการ | VETRA',
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
    title: 'บริการ | VETRA',
    description: TH_DESC,
    images: ['/images/preview/services-og.png'],
  },
}

export default function ServicesPage() {
  return (
    <main className={styles.page}>
      <section className={`section ${styles.hero}`} aria-label="ส่วนแนะนำบริการ">
        <div className="container">
          <div className={styles.heroflex}>
            <Link href={localizedPath('th', '/services')} className={styles.badge}>
              บริการ
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
        aria-label="เครื่องมือประเมินราคาเว็บไซต์"
      >
        <div className="container">
          <PageClient locale="th" />
        </div>
      </section>

      <OngoingServices locale="th" />
    </main>
  )
}
