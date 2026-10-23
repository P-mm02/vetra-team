import Image from 'next/image'
import Link from 'next/link'
import { getPublicProjects } from '@/lib/cms/projects'
import type { ProjectItem } from '@/app/(site)/projects/Projects/Modal/Modal'
import { localizedPath, type Locale } from '@/lib/i18n'
import { localizeProject } from '@/app/(site)/projects/Projects/projectContent'
import { compareProjectsNewestFirst } from '@/app/(site)/projects/Projects/projectChronology'
import styles from './RecentProjects.module.css'

const copy = {
  th: {
    eyebrow: 'ผลงานล่าสุด',
    title: 'โปรเจกต์ที่เพิ่งทำเสร็จ',
    intro:
      'ตัวอย่างเว็บไซต์และเว็บแอปที่ออกแบบให้พร้อมใช้งานจริง ทั้งหน้าขายสินค้า ธุรกิจบริการ แพลตฟอร์มทัวร์ และระบบเฉพาะทาง',
    viewProject: 'ดูรายละเอียด',
    viewPortfolio: 'ดูผลงานทั้งหมด',
    viewAll: 'ดูผลงานทั้งหมด',
    yearLabel: 'ปี',
  },
  en: {
    eyebrow: 'Recent Projects',
    title: 'Latest work from our studio',
    intro:
      'A quick look at recent websites and web apps built for sales, services, travel, education, e-commerce, and custom business use.',
    viewProject: 'View details',
    viewPortfolio: 'View portfolio',
    viewAll: 'View all projects',
    yearLabel: 'Year',
  },
} satisfies Record<Locale, Record<string, string>>

async function getRecentProjects(locale: Locale) {
  return ((await getPublicProjects()) as ProjectItem[])
    .map((project) => localizeProject(project, locale))
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || compareProjectsNewestFirst(a, b))
    .slice(0, 6)
}

export default async function RecentProjects({
  locale = 'th',
}: {
  locale?: Locale
}) {
  const t = copy[locale]
  const projects = await getRecentProjects(locale)
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
          {projects.map((project) => {
            const projectHref = project.hasDetail
              ? `${projectsHref}?project=${encodeURIComponent(project.id)}`
              : project.isExample ? projectsHref : `${projectsHref}?view=all`
            const actionLabel = project.hasDetail ? t.viewProject : t.viewPortfolio

            return (
              <article key={project.id} className={styles.card}>
              <Link
                className={styles.mediaLink}
                href={projectHref}
                aria-label={`${actionLabel}: ${project.title}`}
              >
                <Image
                  src={project.cover.src}
                  alt={project.cover.alt}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                  className={styles.image}
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
                  <Link className={styles.detailLink} href={projectHref}>
                    {actionLabel}
                  </Link>

                  {project.stack?.[0] ? (
                    <span className={styles.stack}>{project.stack[0]}</span>
                  ) : null}
                </div>
              </div>
            </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
