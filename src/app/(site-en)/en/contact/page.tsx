import type { Metadata } from 'next'
import Link from 'next/link'
import styles from '@/app/(site)/contact/page.module.css'
import CopyButton from '@/components/ui/CopyButton/CopyButton'
import ContactsBox from '@/app/(site)/contact/ContactsBox/ContactsBox'
import { pageAlternates } from '@/lib/i18n'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://vetra.asia/'

const CONTACT = {
  brand: 'VETRA Team leader',
  name: 'Poomtawee Rompho',
  roleEn: 'Next.js Web Developer',
  phone: '0936661370',
  email: 'poomtawee@outlook.com',
  lineLink: 'https://lin.ee/hgKZAHm',
  lineId: '@078wpjlo',
  websiteUrl: SITE_URL,
  workUrl: '/en/projects',
  serviceUrl: '/en/services',
}

export const metadata: Metadata = {
  title: 'Contact',
  description:
    'Contact VETRA for premium Next.js websites, web apps, SEO-ready business websites, and custom systems. Reach us via LINE, phone, or email.',
  alternates: pageAlternates('/contact', 'en'),
  openGraph: {
    title: 'VETRA | Contact',
    description:
      'Start a website or web app project with VETRA. Contact via LINE, phone, or email.',
    url: '/en/contact',
    type: 'website',
    locale: 'en_US',
    alternateLocale: ['th_TH'],
  },
}

function toVCardDataUrl() {
  const vcard = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${CONTACT.name}`,
    `ORG:${CONTACT.brand}`,
    `TITLE:${CONTACT.roleEn}`,
    `TEL;TYPE=CELL:${CONTACT.phone}`,
    `EMAIL:${CONTACT.email}`,
    `URL:${CONTACT.websiteUrl}`,
    `NOTE:Contact via VETRA website: ${CONTACT.websiteUrl}/en/contact`,
    'END:VCARD',
  ].join('\n')

  return `data:text/vcard;charset=utf-8,${encodeURIComponent(vcard)}`
}

export default function EnglishContactPage() {
  const mailLink = `mailto:${CONTACT.email}?subject=${encodeURIComponent(
    'Project inquiry (VETRA)',
  )}`

  const vcardUrl = toVCardDataUrl()

  return (
    <main id="main" className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.container}>
          <div className={styles.card}>
            <div className={styles.top}>
              <Link href="/en/contact" className={styles.badge}>
                Contact
              </Link>

              <h1 className={styles.h1}>
                Let&apos;s talk about your
                <span className={styles.h1Accent}> website</span>
              </h1>

              <p className={styles.subhead}>
                Free first consultation. Send your goal, reference, rough budget,
                and timeline, and we&apos;ll help shape the scope clearly.
              </p>
            </div>

            <div className={styles.actions} aria-label="Quick actions">
              <ContactsBox locale="en" />
            </div>

            <div className={styles.grid}>
              <section className={styles.info} aria-label="Contact details">
                <h2 className={styles.h2}>Contact Details</h2>

                <div className={styles.rows}>
                  <div className={styles.row}>
                    <div className={styles.k}>Name</div>
                    <div className={styles.v}>
                      {CONTACT.name}{' '}
                      <span className={styles.dim}>({CONTACT.brand})</span>
                    </div>
                  </div>

                  <div className={styles.row}>
                    <div className={styles.k}>LINE ID</div>
                    <div className={styles.vInline}>
                      <span className={styles.code}>{CONTACT.lineId}</span>
                      <CopyButton
                        className={styles.copyBtn}
                        value={CONTACT.lineId}
                        copiedText="Copied!"
                        idleText="Copy"
                      />
                    </div>
                  </div>

                  <div className={styles.row}>
                    <div className={styles.k}>Phone</div>
                    <div className={styles.vInline}>
                      <span className={styles.code}>{CONTACT.phone}</span>
                      <CopyButton
                        className={styles.copyBtn}
                        value={CONTACT.phone}
                        copiedText="Copied!"
                        idleText="Copy"
                      />
                    </div>
                  </div>

                  <div className={styles.row}>
                    <div className={styles.k}>Email</div>
                    <div className={styles.vInline}>
                      <span className={styles.code}>{CONTACT.email}</span>
                      <CopyButton
                        className={styles.copyBtn}
                        value={CONTACT.email}
                        copiedText="Copied!"
                        idleText="Copy"
                      />
                    </div>
                  </div>
                </div>

                <div className={styles.metaActions}>
                  <a className={styles.btnSoft} href={CONTACT.workUrl}>
                    Projects
                  </a>
                  <a className={styles.btnSoft} href={CONTACT.serviceUrl}>
                    Services
                  </a>
                  <a className={styles.btnSoft} href={mailLink}>
                    Email
                  </a>
                  <a className={styles.btnSoft} href={vcardUrl}>
                    vCard
                  </a>
                </div>

                <p className={styles.note}>
                  Tip: include your goal, preferred style, must-have features,
                  deadline, and rough budget. That helps us estimate the scope
                  much faster.
                </p>
              </section>

              <aside className={styles.checklist} aria-label="What to send">
                <div className={styles.checkTitle}>What to send for a quote</div>
                <ul className={styles.checkList}>
                  <li>What information the website should show</li>
                  <li>Example websites or design references you like</li>
                  <li>Features you need now or may need later</li>
                  <li>Existing text, logo, images, or brand assets</li>
                  <li>Anything you dislike, such as crowded layouts or heavy animation</li>
                </ul>

                <div className={styles.miniCard}>
                  <div className={styles.miniTitle}>Response time</div>
                  <div className={styles.miniText}>
                    Usually within <span className={styles.accent}>12 hours</span>.
                    For urgent work, calling is fastest.
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Person',
            name: CONTACT.name,
            url: `${SITE_URL}/en/contact`,
            email: CONTACT.email,
            telephone: CONTACT.phone,
            jobTitle: CONTACT.roleEn,
            worksFor: { '@type': 'Organization', name: CONTACT.brand },
            areaServed: 'Thailand',
          }),
        }}
      />
    </main>
  )
}
