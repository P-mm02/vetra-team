import type { Metadata } from 'next'
import Link from 'next/link'
import styles from '@/app/(site)/privacy/page.module.css'
import { pageAlternates } from '@/lib/i18n'

export const metadata: Metadata = {
  title: 'Privacy',
  description:
    'VETRA privacy policy covering contact data, cookies, analytics, data use, and user rights.',
  alternates: pageAlternates('/privacy', 'en'),
  openGraph: {
    title: 'Privacy | VETRA',
    description:
      'How VETRA collects, uses, and protects contact and website usage data.',
    url: '/en/privacy',
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
      'This policy explains how VETRA collects, uses, and protects information when you visit our website or contact us.',
      'We only collect information that is reasonably needed to respond to inquiries, improve the website, and provide services.',
    ],
  },
  {
    id: 'data',
    title: 'Information We May Collect',
    body: [
      'Information you provide directly, such as your name, email, phone number, project details, or messages.',
      'Basic website usage information, such as device type, browser, visited pages, and usage time, usually as analytics data.',
      'Please avoid sending sensitive information unless it is necessary for the project discussion.',
    ],
  },
  {
    id: 'use',
    title: 'How We Use Information',
    body: [
      'To reply to inquiries, estimate projects, prepare proposals, or provide support.',
      'To improve website quality, content, performance, and user experience.',
      'To prevent spam, abuse, or security issues.',
    ],
  },
  {
    id: 'cookies',
    title: 'Cookies and Analytics',
    body: [
      'The website may use cookies for basic functionality and analytics tools to understand site usage.',
      'You can block cookies in your browser, but some parts of the site may not work as expected.',
    ],
  },
  {
    id: 'sharing',
    title: 'Third Parties',
    body: [
      'We do not sell your personal information.',
      'We may use third-party services for hosting, analytics, email, or other tools needed to operate the website and respond to inquiries.',
      'We may disclose information when required by law or to protect against fraud, abuse, or security threats.',
    ],
  },
  {
    id: 'rights',
    title: 'Your Rights',
    body: [
      'You may ask us to correct or delete personal information you previously sent, within legal and practical limits.',
      'For privacy questions or requests, contact us through the Contact page.',
    ],
  },
]

export default function EnglishPrivacyPage() {
  return (
    <main id="main" className={styles.page}>
      <header className={styles.hero}>
        <div className={styles.container}>
          <div className={styles.heroCard}>
            <div className={styles.kicker}>Privacy</div>
            <h1 className={styles.h1}>
              Privacy <span className={styles.h1Accent}>Policy</span>
            </h1>
            <p className={styles.subhead}>
              We collect only what is needed to respond to inquiries, provide
              services, and improve the website.
            </p>

            <div className={styles.metaRow}>
              <div className={styles.metaItem}>
                <div className={styles.metaK}>Last updated</div>
                <div className={styles.metaV}>{updatedAt}</div>
              </div>
              <div className={styles.metaItem}>
                <div className={styles.metaK}>Related document</div>
                <div className={styles.metaV}>
                  <Link className={styles.metaLink} href="/en/terms">
                    Terms
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
                Contact Us
              </Link>
              <Link className={styles.btnGhost} href="/en/services">
                View Services
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

            <article className={styles.content} aria-label="Privacy content">
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
