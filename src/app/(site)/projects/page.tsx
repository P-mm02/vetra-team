// src/app/projects/page.tsx
import type { Metadata } from 'next'
import styles from './page.module.css'
import Projects from './Projects/Projects'
import Link from 'next/link'
import { localizedPath, pageAlternates } from '@/lib/i18n'

const TH_DESC =
  'รวมผลงานออกแบบและพัฒนาเว็บไซต์ของ VETRA — เว็บไซต์ Next.js, เว็บแอป, แดชบอร์ด และระบบ UI สำหรับธุรกิจและองค์กร พร้อมระบบค้นหาและคัดเลือกผลงานตัวอย่าง.'

export const metadata: Metadata = {
  title: 'ผลงาน',
  description: TH_DESC,
  alternates: pageAlternates('/projects', 'th'),
  openGraph: {
    title: 'ผลงาน | VETRA',
    description: TH_DESC,
    images: [
      {
        url: '/images/preview/projects-og.png',
        width: 1200,
        height: 630,
        alt: 'ผลงานของ VETRA',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ผลงาน',
    description: TH_DESC,
    images: ['/images/preview/projects-og.png'],
  },
}

export default function ProjectsPage() {
  return (
    <main className={styles.page}>
      <section className={styles.hero} aria-label="ส่วนแนะนำผลงาน">
        <div className={styles.heroInner}>
          <Link href={localizedPath('th', '/projects')} className={styles.badge}>
            ผลงาน
          </Link>
          <h1 className={styles.title}>รวมผลงานของเรา</h1>

          <p className={styles.subTitle}>
            งาน ออกแบบ สร้าง เว็บไซต์ สำหรับธุรกิจหลากหลายประเภท ทั้งเว็บบริษัท
            แพลตฟอร์มออนไลน์ และระบบบริหารงานภายในองค์กร(ERP)
          </p>
        </div>
      </section>

      <section className={styles.section} aria-label="รายการผลงาน">
        <div className={styles.sectionInner}>
          <Projects locale="th" />
        </div>
      </section>
    </main>
  )
}
