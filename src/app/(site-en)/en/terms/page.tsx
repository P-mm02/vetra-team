import type { Metadata } from 'next'
import Link from 'next/link'
import styles from '@/app/(site)/terms/page.module.css'
import { pageAlternates } from '@/lib/i18n'

export const metadata: Metadata = {
  title: 'Terms',
  description:
    'VETRA service terms covering scope, payment, revisions, delivery, support, and project responsibilities.',
  alternates: pageAlternates('/terms', 'en'),
  openGraph: {
    title: 'Terms | VETRA',
    description:
      'Service terms for website and web app projects with VETRA.',
    url: '/en/terms',
    type: 'website',
    locale: 'en_US',
    alternateLocale: ['th_TH'],
  },
}

const updatedAt = 'January 4, 2026'

const sections = [
  {
    id: 'overview',
    title: 'Overview',
    body: [
      'These terms describe the working agreement between the client and VETRA for website, web app, or digital system projects.',
      'Starting work, paying a deposit, or approving a scope means the client accepts the agreed terms for that project.',
    ],
  },
  {
    id: 'scope',
    title: 'Scope and Changes',
    body: [
      'The project scope follows the agreed checklist, quotation, or project summary.',
      'Requests outside the agreed scope may require additional budget or time, and will be discussed before implementation.',
    ],
  },
  {
    id: 'timeline',
    title: 'Timeline and Delivery',
    body: [
      'Timelines depend on requirement clarity, asset readiness, feedback speed, and technical complexity.',
      'Delivery may be split into milestones such as structure, interface, implementation, optimization, and deployment.',
    ],
  },
  {
    id: 'payment',
    title: 'Payment',
    body: [
      'Work normally begins after scope confirmation and deposit payment as specified in the quotation.',
      'Additional work will be estimated separately before that work starts.',
    ],
  },
  {
    id: 'revisions',
    title: 'Revisions',
    body: [
      'Revision rounds follow the package or quotation.',
      'Major direction changes, new pages, or new features may be treated as additional work.',
    ],
  },
  {
    id: 'content',
    title: 'Content and Assets',
    body: [
      'The client confirms they have the right to use any text, logo, images, fonts, or assets they provide.',
      'If VETRA helps prepare extra content or images, that may be estimated as separate work.',
    ],
  },
  {
    id: 'support',
    title: 'Support',
    body: [
      'Post-delivery bug support follows the agreed package or quotation.',
      'Future improvements, feature additions, or maintenance can be planned as a next phase.',
    ],
  },
]

export default function EnglishTermsPage() {
  return (
    <main id="main" className={styles.page}>
      <header className={styles.hero}>
        <div className={styles.container}>
          <div className={styles.heroCard}>
            <div className={styles.kicker}>Terms</div>
            <h1 className={styles.h1}>
              Terms of <span className={styles.h1Accent}>Service</span>
            </h1>
            <p className={styles.subhead}>
              A clear working reference for scope, payments, revisions, delivery,
              and support.
            </p>

            <div className={styles.metaRow}>
              <div className={styles.metaItem}>
                <div className={styles.metaK}>Last updated</div>
                <div className={styles.metaV}>{updatedAt}</div>
              </div>
              <div className={styles.metaItem}>
                <div className={styles.metaK}>Related document</div>
                <div className={styles.metaV}>
                  <Link className={styles.metaLink} href="/en/privacy">
                    Privacy
                  </Link>
                </div>
              </div>
              <div className={styles.metaItem}>
                <div className={styles.metaK}>Contact</div>
                <div className={styles.metaV}>
                  <Link className={styles.metaLink} href="/en/contact">
                    /en/contact
                  </Link>
                </div>
              </div>
            </div>

            <div className={styles.actions}>
              <a className={styles.btnSoft} href="#toc">
                View Contents
              </a>
              <Link className={styles.btnPrimary} href="/en/contact">
                Start a Project
              </Link>
              <Link className={styles.btnGhost} href="/en/services">
                View Pricing
              </Link>
            </div>
          </div>
        </div>
      </header>

      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.layout}>
            <aside className={styles.toc} id="toc" aria-label="Table of contents">
              <div className={styles.tocTitle}>Contents</div>
              <nav className={styles.tocNav}>
                {sections.map((s) => (
                  <a key={s.id} className={styles.tocLink} href={`#${s.id}`}>
                    {s.title}
                  </a>
                ))}
              </nav>
            </aside>

            <article className={styles.content} aria-label="Terms content">
              {sections.map((s) => (
                <section key={s.id} id={s.id} className={styles.block}>
                  <h2 className={styles.h2}>{s.title}</h2>
                  {s.body.map((p) => (
                    <p className={styles.text} key={p}>
                      {p}
                    </p>
                  ))}
                </section>
              ))}
            </article>
          </div>
        </div>
      </section>
    </main>
  )
}
