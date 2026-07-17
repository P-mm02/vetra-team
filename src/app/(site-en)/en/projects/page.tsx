import type { Metadata } from 'next'
import Link from 'next/link'
import styles from '@/app/(site)/projects/page.module.css'
import Projects from '@/app/(site)/projects/Projects/Projects'
import { localizedPath, pageAlternates } from '@/lib/i18n'

const DESC =
  'A portfolio of VETRA website and web app projects: Next.js sites, business websites, dashboards, internal systems, and polished UI concepts.'

export const metadata: Metadata = {
  title: 'Projects',
  description: DESC,
  alternates: pageAlternates('/projects', 'en'),
  openGraph: {
    title: 'Projects | VETRA',
    description: DESC,
    images: [
      {
        url: '/images/preview/projects-og.png',
        width: 1200,
        height: 630,
        alt: 'Projects | VETRA',
      },
    ],
    locale: 'en_US',
    alternateLocale: ['th_TH'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Projects | VETRA',
    description: DESC,
    images: ['/images/preview/projects-og.png'],
  },
}

export default function EnglishProjectsPage() {
  return (
    <main className={styles.page}>
      <section className={styles.hero} aria-label="Projects hero">
        <div className={styles.heroInner}>
          <Link href={localizedPath('en', '/projects')} className={styles.badge}>
            Projects
          </Link>
          <h1 className={styles.title}>Our Work</h1>

          <p className={styles.subTitle}>
            Websites, web apps, online platforms, and internal business systems
            designed for companies that need clarity, trust, and room to grow.
          </p>
        </div>
      </section>

      <section className={styles.section} aria-label="Projects list">
        <div className={styles.sectionInner}>
          <Projects locale="en" />
        </div>
      </section>
    </main>
  )
}
