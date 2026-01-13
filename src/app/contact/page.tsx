// src/app/contact/page.tsx
import type { Metadata } from 'next'
import styles from './page.module.css'
import CopyButton from '@/components/ui/CopyButton/CopyButton'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

// ✅ Change these to your real info (or move to env if you want)
const CONTACT = {
  brand: 'Wee | Freelance',
  name: 'Wee',
  roleTh: 'ฟรีแลนซ์รับทำเว็บไซต์ / เว็บแอป',
  roleEn: 'Next.js Web Developer',

  // Put real values here
  phone: '+66XXXXXXXXX',
  email: 'hello@example.com',
  lineId: 'yourlineid',
  locationTh: 'Bangkok, Thailand',
  mapUrl: 'https://maps.google.com/',

  // optional
  websiteUrl: SITE_URL,
  workUrl: '/work',
}

export const metadata: Metadata = {
  title: 'Contact',
  description:
    'ติดต่อ Wee | Freelance — รับทำเว็บไซต์และเว็บแอปด้วย Next.js. สแกน QR แล้วติดต่อได้ทันที (LINE / โทร / อีเมล).',
  alternates: { canonical: '/contact' },
  openGraph: {
    title: 'Contact | Wee | Freelance',
    description:
      'ติดต่อเพื่อเริ่มโปรเจกต์เว็บไซต์/เว็บแอป (Next.js) — LINE / โทร / อีเมล',
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
  const lineLink = `https://line.me/R/ti/p/~${CONTACT.lineId}`
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
              <div className={styles.badge}>QR Landing • Contact</div>

              <h1 className={styles.h1}>
                ติดต่อเพื่อเริ่มโปรเจกต์
                <span className={styles.h1Accent}> เว็บไซต์ / เว็บแอป</span>
              </h1>

              <p className={styles.subhead}>
                หน้านี้ทำไว้สำหรับแปะบน QR Code ตอนทำการตลาดแบบออฟไลน์ —
                สแกนแล้วกดติดต่อได้ทันที (LINE / โทร / อีเมล)
                แบบไม่ต้องหาอะไรเพิ่ม
              </p>
            </div>

            {/* Quick Actions */}
            <div className={styles.actions} aria-label="Quick actions">
              <a
                className={styles.btnPrimary}
                href={lineLink}
                target="_blank"
                rel="noreferrer"
              >
                ทัก LINE
              </a>

              <a className={styles.btnGhost} href={telLink}>
                โทร
              </a>

              <a className={styles.btnGhost} href={mailLink}>
                อีเมล
              </a>

              <a
                className={styles.btnGhost}
                href={CONTACT.mapUrl}
                target="_blank"
                rel="noreferrer"
              >
                เปิดแผนที่
              </a>
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
                    <div className={styles.k}>สายงาน</div>
                    <div className={styles.v}>
                      {CONTACT.roleTh}{' '}
                      <span className={styles.dim}>• {CONTACT.roleEn}</span>
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

                  <div className={styles.row}>
                    <div className={styles.k}>ที่ตั้ง</div>
                    <div className={styles.v}>
                      {CONTACT.locationTh}{' '}
                      <a
                        className={styles.inlineLink}
                        href={CONTACT.mapUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        (ดูแผนที่)
                      </a>
                    </div>
                  </div>
                </div>

                <div className={styles.metaActions}>
                  <a
                    className={styles.btnSoft}
                    href={vcardUrl}
                    download="wee-contact.vcf"
                  >
                    ดาวน์โหลดนามบัตร (vCard)
                  </a>

                  <a className={styles.btnSoft} href={CONTACT.workUrl}>
                    ดูผลงาน (Work)
                  </a>
                </div>

                <p className={styles.note}>
                  แนะนำ: ถ้าทักมาทาง LINE ให้ส่ง “เป้าหมาย + งบคร่าว ๆ +
                  deadline” จะช่วยให้สรุปแผนได้เร็วมาก
                </p>
              </section>

              {/* What to send (helps real use) */}
              <aside className={styles.checklist} aria-label="What to send">
                <div className={styles.checkTitle}>
                  ส่งข้อมูลนี้มา จะเริ่มงานได้เร็ว
                </div>
                <ul className={styles.checkList}>
                  <li>ประเภทงาน: Website / Web App / Dashboard</li>
                  <li>เป้าหมายหลัก + กลุ่มลูกค้า</li>
                  <li>จำนวนหน้า/ฟีเจอร์คร่าว ๆ</li>
                  <li>ตัวอย่างเว็บที่ชอบ (reference)</li>
                  <li>งบประมาณคร่าว ๆ + deadline</li>
                </ul>

                <div className={styles.miniCard}>
                  <div className={styles.miniTitle}>Response time</div>
                  <div className={styles.miniText}>
                    โดยทั่วไปตอบกลับภายใน{' '}
                    <span className={styles.accent}>24 ชม.</span>{' '}
                    (ถ้าเร่งด่วนให้โทรได้เลย)
                  </div>
                </div>
              </aside>
            </div>
          </div>

          <p className={styles.footerNote}>
            URL สำหรับ QR:{' '}
            <span className={styles.code}>{SITE_URL}/contact</span>
          </p>
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
