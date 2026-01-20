// src/app/projects/page.tsx
import type { Metadata } from 'next'
import styles from './page.module.css'
import Projects from './Projects/Projects'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Projects',
  description:
    'Selected projects and works — Next.js websites, web apps, dashboards, and UI systems by Vetra.',
}

export default function ProjectsPage() {
  return (
    <main className={styles.page}>
      <section className={styles.hero} aria-label="Projects hero">
        <div className={styles.heroInner}>
          <Link href="/contact" className={styles.badge}>
            Projects
          </Link>
          <h1 className={styles.title}>
            รวมผลงานของเรา
          </h1>

          <p className={styles.subTitle}>
            งาน ออกแบบ สร้าง เว็บไซต์ สำหรับธุรกิจหลากหลายประเภท ทั้งเว็บบริษัท แพลตฟอร์มออนไลน์ และระบบบริการงานภายในองค์กร(ERP)
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
