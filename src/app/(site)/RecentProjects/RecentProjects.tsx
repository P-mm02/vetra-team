import Image from 'next/image'
import Link from 'next/link'
import projectsData from '@/app/(site)/projects/Projects/projects.json'
import type { ProjectItem } from '@/app/(site)/projects/Projects/Modal/Modal'
import { localizedPath, type Locale } from '@/lib/i18n'
import { localizeProject } from '@/app/(site)/projects/Projects/projectContent'
import styles from './RecentProjects.module.css'

const copy = {
  th: {
    eyebrow: 'ผลงานล่าสุด',
    title: 'โปรเจกต์ที่เพิ่งทำเสร็จ',
    intro:
      'ตัวอย่างเว็บไซต์และเว็บแอปที่ออกแบบให้พร้อมใช้งานจริง ทั้งหน้าขายสินค้า ธุรกิจบริการ แพลตฟอร์มทัวร์ และระบบเฉพาะทาง',
    viewProject: 'ดูรายละเอียด',
    viewAll: 'ดูผลงานทั้งหมด',
    yearLabel: 'ปี',
  },
  en: {
    eyebrow: 'Recent Projects',
    title: 'Latest work from our studio',
    intro:
      'A quick look at recent websites and web apps built for sales, services, travel, education, e-commerce, and custom business use.',
    viewProject: 'View details',
    viewAll: 'View all projects',
    yearLabel: 'Year',
  },
} satisfies Record<Locale, Record<string, string>>

function projectNumber(id: string) {
  const match = id.match(/^p-(\d+)/)
  return match ? Number(match[1]) : 0
}

function getRecentProjects(locale: Locale) {
  return (projectsData as ProjectItem[])
    .map((project) => localizeProject(project, locale))
    .sort((a, b) => projectNumber(b.id) - projectNumber(a.id))
    .slice(0, 6)
}

export default function RecentProjects({
  locale = 'th',
}: {
  locale?: Locale
}) {
  const t = copy[locale]
  const projects = getRecentProjects(locale)
  const projectsHref = localizedPath(locale, '/projects')

  return (
    <section className={styles.section} aria-labelledby="recent-projects-title">
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.headingGroup}>
            <p className={styles.eyebrow}>{t.eyebrow}</p>
            <h2 id="recent-projects-title" className={styles.title}>
              {t.title}
            </h2>
            <p className={styles.intro}>{t.intro}</p>
          </div>

          <Link className={styles.viewAll} href={projectsHref}>
            {t.viewAll}
          </Link>
        </div>

        <div className={styles.grid}>
          {projects.map((project, index) => (
            <article key={project.id} className={styles.card}>
              <Link
                className={styles.mediaLink}
                href={projectsHref}
                aria-label={`${t.viewProject}: ${project.title}`}
              >
                <Image
                  src={project.cover.src}
                  alt={project.cover.alt}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                  className={styles.image}
                  priority={index < 2}
                />
              </Link>

              <div className={styles.body}>
                <div className={styles.cardTop}>
                  <h3 className={styles.cardTitle}>{project.title}</h3>
                  <span
                    className={styles.year}
                    aria-label={`${t.yearLabel} ${project.year}`}
                  >
                    {project.year}
                  </span>
                </div>

                <p className={styles.desc}>{project.shortDesc}</p>

                <div className={styles.footer}>
                  <Link className={styles.detailLink} href={projectsHref}>
                    {t.viewProject}
                  </Link>

                  {project.stack?.[0] ? (
                    <span className={styles.stack}>{project.stack[0]}</span>
                  ) : null}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
