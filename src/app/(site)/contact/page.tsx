// src/app/contact/page.tsx
import type { Metadata } from 'next'
import styles from './page.module.css'
import CopyButton from '@/components/ui/CopyButton/CopyButton'
import Link from 'next/link'
import ContactsBox from '@/app/(site)/contact/ContactsBox/ContactsBox'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://vetra.asia/'

// ✅ Change these to your real info (or move to env if you want)
const CONTACT = {
  brand: 'VETRA Team leader',
  name: 'ภูมิทวี ร่มโพธิ์',
  roleTh: 'ฟรีแลนซ์รับทำเว็บไซต์ / เว็บแอป',
  roleEn: 'Next.js Web Developer',

  // Put real values here
  phone: '0936661370',
  email: 'poomtawee@outlook.com',
  lineLink: 'https://lin.ee/hgKZAHm',
  lineId: '@078wpjlo',

  // optional
  websiteUrl: SITE_URL,
  workUrl: '/projects',
}

export const metadata: Metadata = {
  title: 'Contact |',
  description:
    'ติดต่อ Wee | VETRA — รับทำเว็บไซต์และเว็บแอปด้วย Next.js. ติดต่อได้ทันที (LINE / โทร / อีเมล).',
  alternates: { canonical: '/contact' },
  openGraph: {
    title: 'VETRA | Contact',
    description:
      'ติดต่อ เริ่มโปรเจกต์เว็บไซต์ เว็บแอป (Next.js) — LINE / โทร / อีเมล',
    url: '/contact',
    type: 'website',
    locale: 'th_TH',
  },
}

function toVCardDataUrl() {
  // Keep it simple + widely supported (vCard 3.0)
  const vcard = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${CONTACT.name}`,
    `ORG:${CONTACT.brand}`,
    `TITLE:${CONTACT.roleEn}`,
    `TEL;TYPE=CELL:${CONTACT.phone}`,
    `EMAIL:${CONTACT.email}`,
    `URL:${CONTACT.websiteUrl}`,
    `NOTE:Contact via QR landing page: ${CONTACT.websiteUrl}/contact`,
    'END:VCARD',
  ].join('\n')

  return `data:text/vcard;charset=utf-8,${encodeURIComponent(vcard)}`
}

export default function ContactPage() {
  const lineLink = `${CONTACT.lineLink}`
  const telLink = `tel:${CONTACT.phone.replace(/\s+/g, '')}`
  const mailLink = `mailto:${CONTACT.email}?subject=${encodeURIComponent(
    'Project inquiry (Wee | Freelance)'
  )}`

  const vcardUrl = toVCardDataUrl()

  return (
    <main id="main" className={styles.page}>
      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.container}>
          <div className={styles.card}>
            <div className={styles.top}>
              <Link href="/contact" className={styles.badge}>
                Contact
              </Link>

              <h1 className={styles.h1}>
                ติดต่อ เรื่อง
                <span className={styles.h1Accent}> เว็บไซต์</span>
              </h1>

              <p className={styles.subhead}>
                | ยินดีให้คำปรึกษา ไม่คิดค่าใช้จ่าย |
              </p>
            </div>

            {/* Quick Actions */}
            <div className={styles.actions} aria-label="Quick actions">
              <ContactsBox />
            </div>

            {/* Contact Grid */}
            <div className={styles.grid}>
              <section className={styles.info} aria-label="Contact details">
                <h2 className={styles.h2}>ข้อมูลติดต่อ</h2>

                <div className={styles.rows}>
                  <div className={styles.row}>
                    <div className={styles.k}>ชื่อ</div>
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
                        copiedText="คัดลอกแล้ว!"
                        idleText="คัดลอก"
                      />
                    </div>
                  </div>

                  <div className={styles.row}>
                    <div className={styles.k}>โทร</div>
                    <div className={styles.vInline}>
                      <span className={styles.code}>{CONTACT.phone}</span>
                      <CopyButton
                        className={styles.copyBtn}
                        value={CONTACT.phone}
                        copiedText="คัดลอกแล้ว!"
                        idleText="คัดลอก"
                      />
                    </div>
                  </div>

                  <div className={styles.row}>
                    <div className={styles.k}>อีเมล</div>
                    <div className={styles.vInline}>
                      <span className={styles.code}>{CONTACT.email}</span>
                      <CopyButton
                        className={styles.copyBtn}
                        value={CONTACT.email}
                        copiedText="คัดลอกแล้ว!"
                        idleText="คัดลอก"
                      />
                    </div>
                  </div>
                </div>

                <div className={styles.metaActions}>
                  <a className={styles.btnSoft} href={CONTACT.workUrl}>
                    ดูผลงาน (Work)
                  </a>
                </div>

                <p className={styles.note}>
                  แนะนำ: ให้ส่ง “เป้าหมาย งบคร่าวๆ ความเร่งด่วน”
                  จะช่วยให้สรุปงานได้เร็วมาก
                </p>
              </section>

              {/* What to send (helps real use) */}
              <aside className={styles.checklist} aria-label="What to send">
                <div className={styles.checkTitle}>ข้อมูล เพื่อประเมินราคา</div>
                <ul className={styles.checkList}>
                  <li>● ต้องการให้เว็บไซต์แสดงข้อมูลอะไรบ้าง</li>
                  <li>● ตัวอย่างเว็บไซต์ หรือแนวการออกแบบที่ชอบ</li>
                  <li>● ฟังก์ชันการใช้งาน ฟีเจอร์เพิ่มเติม ที่ต้องการ</li>
                  <li>● มีคอนเทนต์ ข้อความ รูปภาพ ที่จะใส่ในหน้าเว็บไซต์ไว้แล้วหรือยัง (ถ้ายังไม่มี เราจัดทำให้ได้)</li>
                  <li>
                    ● มีสิ่งที่ “ไม่ชอบ” ไหม เช่น สีจัด เว็บแน่น แอนิเมชันเยอะ
                  </li>
                </ul>

                <div className={styles.miniCard}>
                  <div className={styles.miniTitle}>Response time</div>
                  <div className={styles.miniText}>
                    ตอบกลับภายใน <span className={styles.accent}>12 ชม.</span>{' '}
                    (ถ้าเร่งด่วนให้โทรได้เลย)
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </div>
      </section>

      {/* JSON-LD for SEO */}
      <script
        type="application/ld+json"
        // keep it minimal + safe
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Person',
            name: CONTACT.name,
            url: `${SITE_URL}/contact`,
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
