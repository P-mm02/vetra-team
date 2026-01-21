// src/app/projects/page.tsx
import type { Metadata } from 'next'
import styles from './page.module.css'
import Projects from './Projects/Projects'
import Link from 'next/link'

const TH_DESC =
  'รวมผลงานออกแบบและพัฒนาเว็บไซต์ของ VETRA — เว็บไซต์ Next.js, เว็บแอป, แดชบอร์ด และระบบ UI สำหรับธุรกิจและองค์กร พร้อมระบบค้นหาและคัดเลือกผลงานตัวอย่าง.'

export const metadata: Metadata = {
  title: 'Projects |',
  description: TH_DESC,
  openGraph: {
    title: 'Projects | VETRA',
    description: TH_DESC,
    images: [
      {
        url: '/images/preview/projects-og.png',
        width: 1200,
        height: 630,
        alt: 'Projects | Vetra',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Projects',
    description: TH_DESC,
    images: ['/images/preview/projects-og.png'],
  },
}

export default function ProjectsPage() {
  return (
    <main className={styles.page}>
      <section className={styles.hero} aria-label="Projects hero">
        <div className={styles.heroInner}>
          <Link href="/contact" className={styles.badge}>
            Projects
          </Link>
          <h1 className={styles.title}>รวมผลงานของเรา</h1>

          <p className={styles.subTitle}>
            งาน ออกแบบ สร้าง เว็บไซต์ สำหรับธุรกิจหลากหลายประเภท ทั้งเว็บบริษัท
            แพลตฟอร์มออนไลน์ และระบบบริการงานภายในองค์กร(ERP)
          </p>
        </div>
      </section>

      <section className={styles.section} aria-label="Projects list">
        <div className={styles.sectionInner}>
          <Projects />
        </div>
      </section>
    </main>
  )
}
