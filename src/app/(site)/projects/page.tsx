// src/app/projects/page.tsx
import type { Metadata } from 'next'
import styles from './page.module.css'
import Projects from './Projects/Projects'

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
          <p className={styles.kicker}>VETRA • WORK</p>

          <h1 className={styles.title}>
            Projects that look <span className={styles.grad}>premium</span>
            <br />
            and ship <span className={styles.grad2}>fast</span>
          </h1>

          <p className={styles.subTitle}>
            A curated mix of client work, internal tools, and UI experiments.
            Filter by <b>ตัวอย่าง</b> or browse <b>ทั้งหมด</b>.
          </p>

          <div className={styles.heroLine} />
          <div className={styles.stats}>
            <div className={styles.stat}>
              <div className={styles.statNum}>30</div>
              <div className={styles.statLabel}>Project entries</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statNum}>Next.js</div>
              <div className={styles.statLabel}>Core stack</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statNum}>Dark UI</div>
              <div className={styles.statLabel}>Vetra theme</div>
            </div>
          </div>
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
