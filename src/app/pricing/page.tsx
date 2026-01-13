// src/app/pricing/page.tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import styles from './page.module.css'
import CopyButton from '@/components/ui/CopyButton/CopyButton'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

// TODO: change later
const contactEmail = 'hello@example.com'

type Package = {
  name: string
  price: string
  subtitle: string
  bestFor: string
  time: string
  deliverables: string[]
  notes: string[]
  ctaLabel: string
  ctaHref: string
  accent?: 'a' | 'b'
}

const packages: Package[] = [
  {
    name: 'Starter',
    price: 'เริ่มต้น 9,900 บาท',
    subtitle: 'Landing Page / Single Page แบบพรีเมียม',
    bestFor: 'ธุรกิจที่ต้องการหน้าแนะนำ + ปิดการขายแบบเร็ว',
    time: '3–7 วัน',
    deliverables: [
      '1 หน้า (Hero + Services + Work/Highlights + Contact)',
      'Responsive ทุกขนาด (มือถือ/แท็บเล็ต/เดสก์ท็อป)',
      'SEO พื้นฐาน + Metadata + OpenGraph',
      'Optimize ภาพ + Performance pass (Core Web Vitals-friendly)',
      'Deploy ให้พร้อมใช้งาน (Vercel / Netlify)',
    ],
    notes: [
      'เหมาะมากสำหรับทำ QR Landing ใช้การตลาดออฟไลน์',
      'แก้ไขรอบงาน: 2 รอบ',
    ],
    ctaLabel: 'ขอใบเสนอราคา',
    ctaHref: '/contact',
    accent: 'a',
  },
  {
    name: 'Business',
    price: 'เริ่มต้น 24,900 บาท',
    subtitle: 'เว็บไซต์หลายหน้า สำหรับแบรนด์และบริษัท',
    bestFor: 'ต้องการเว็บจริงจัง น่าเชื่อถือ และต่อยอดได้',
    time: '10–21 วัน',
    deliverables: [
      '5–8 หน้า (เช่น Home, Services, Work, About, Contact, Pricing)',
      'โครงสร้างเนื้อหา + Navigation ที่ชัดเจน',
      'SEO ดีขึ้น: semantic HTML + sitemap/robots (ถ้าต้องการ)',
      'ฟอร์มติดต่อ + ส่งเมล (ตามโฮสต์ที่ใช้)',
      'รองรับภาษาไทย/อังกฤษ (ถ้าต้องการ)',
    ],
    notes: [
      'แก้ไขรอบงาน: 3 รอบ',
      'เหมาะกับธุรกิจที่อยากให้เว็บเป็น “หน้าเชื่อถือหลัก” ของแบรนด์',
    ],
    ctaLabel: 'คุยโปรเจกต์',
    ctaHref: '/contact',
    accent: 'b',
  },
  {
    name: 'Custom',
    price: 'ประเมินตามสcope',
    subtitle: 'Web App / Dashboard / Internal Tools',
    bestFor: 'ระบบหลังบ้าน, portal, dashboard, CRUD, workflow',
    time: 'ตามขอบเขตงาน',
    deliverables: [
      'วิเคราะห์ requirement + วางสถาปัตยกรรมระบบ',
      'App Router + แนวปฏิบัติ production-ready',
      'เชื่อมฐานข้อมูล/ระบบสมาชิก/สิทธิ์ (ถ้าต้องการ)',
      'UX สำหรับงานระบบ: โฟกัสความเร็วและความชัด',
      'เอกสารการใช้งาน + ส่งมอบโค้ดดูแลง่าย',
    ],
    notes: [
      'เหมาะสำหรับงานที่ต้อง “ต่อยอดยาว” และมีหลายฟีเจอร์',
      'เริ่มจากสรุป scope แล้วทำ roadmap เป็นเฟสได้',
    ],
    ctaLabel: 'ขอประเมินงาน',
    ctaHref: '/contact',
  },
]

export const metadata: Metadata = {
  title: 'Pricing',
  description:
    'แพ็กเกจราคาเว็บไซต์/เว็บแอป (Next.js) — งานพรีเมียม โค้ดสะอาด SEO ดี โหลดเร็ว และต่อยอดได้จริง',
  alternates: { canonical: '/pricing' },
  openGraph: {
    title: 'Pricing | Wee | Freelance',
    description:
      'แพ็กเกจราคาเว็บไซต์/เว็บแอป (Next.js) — งานพรีเมียม โค้ดสะอาด SEO ดี โหลดเร็ว',
    url: '/pricing',
    type: 'website',
    locale: 'th_TH',
  },
}

export default function PricingPage() {
  return (
    <main id="main" className={styles.page}>
      <header className={styles.hero}>
        <div className={styles.container}>
          <div className={styles.heroCard}>
            <div className={styles.kicker}>Pricing</div>

            <h1 className={styles.h1}>
              ราคาแบบชัดเจน
              <span className={styles.h1Accent}> เลือกให้เหมาะกับเป้าหมาย</span>
            </h1>

            <p className={styles.subhead}>
              เน้นงานพรีเมียม: UI โทนดาร์ก-ฟิวเจอร์ริสติก, โค้ดสะอาด, SEO ดี และ
              performance พร้อมใช้งานจริง — ถ้าคุณมี reference + deadline +
              งบคร่าว ๆ จะสรุป scope ได้ไวมาก
            </p>

            <div className={styles.quick}>
              <div className={styles.quickItem}>
                <div className={styles.quickK}>เริ่มต้น</div>
                <div className={styles.quickV}>Landing / Website / Web App</div>
              </div>
              <div className={styles.quickItem}>
                <div className={styles.quickK}>โฟกัส</div>
                <div className={styles.quickV}>SEO + Speed + Maintainable</div>
              </div>
              <div className={styles.quickItem}>
                <div className={styles.quickK}>ติดต่อ</div>
                <div className={styles.quickVInline}>
                  <span className={styles.code}>{contactEmail}</span>
                  <CopyButton
                    className={styles.copyBtn}
                    value={contactEmail}
                    copiedText="คัดลอกแล้ว!"
                    idleText="คัดลอก"
                  />
                </div>
              </div>
            </div>

            <div className={styles.heroActions}>
              <Link className={styles.btnPrimary} href="/contact">
                เริ่มคุยโปรเจกต์
              </Link>
              <a className={styles.btnGhost} href="#faq">
                ดูคำถามที่พบบ่อย
              </a>
            </div>
          </div>
        </div>
      </header>

      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.grid}>
            {packages.map((p) => (
              <article
                key={p.name}
                className={[
                  styles.card,
                  p.accent === 'a' ? styles.accentA : '',
                  p.accent === 'b' ? styles.accentB : '',
                ].join(' ')}
              >
                <div className={styles.cardTop}>
                  <div>
                    <div className={styles.pkgName}>{p.name}</div>
                    <div className={styles.pkgSub}>{p.subtitle}</div>
                  </div>
                  <div className={styles.price}>{p.price}</div>
                </div>

                <div className={styles.meta}>
                  <div className={styles.metaItem}>
                    <div className={styles.metaK}>เหมาะกับ</div>
                    <div className={styles.metaV}>{p.bestFor}</div>
                  </div>
                  <div className={styles.metaItem}>
                    <div className={styles.metaK}>ระยะเวลา</div>
                    <div className={styles.metaV}>{p.time}</div>
                  </div>
                </div>

                <div className={styles.block}>
                  <div className={styles.blockTitle}>สิ่งที่จะได้</div>
                  <ul className={styles.list}>
                    {p.deliverables.map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                </div>

                <div className={styles.block}>
                  <div className={styles.blockTitle}>หมายเหตุ</div>
                  <ul className={styles.listDim}>
                    {p.notes.map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                </div>

                <div className={styles.cardFoot}>
                  <Link className={styles.btnPrimary} href={p.ctaHref}>
                    {p.ctaLabel}
                  </Link>
                  <a className={styles.btnSoft} href={`mailto:${contactEmail}`}>
                    อีเมลเลย
                  </a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className={styles.section}>
        <div className={styles.container}>
          <div className={styles.faq}>
            <div className={styles.faqHead}>
              <h2 className={styles.h2}>คำถามที่พบบ่อย (FAQ)</h2>
              <p className={styles.lead}>
                ถ้าคุณส่งข้อมูล 3 อย่างนี้มา:{' '}
                <span className={styles.accent}>เป้าหมาย</span> •{' '}
                <span className={styles.accent}>งบคร่าว ๆ</span> •{' '}
                <span className={styles.accent}>deadline</span>{' '}
                จะประเมินงานได้เร็วมาก
              </p>
            </div>

            <div className={styles.faqGrid}>
              <details className={styles.qa}>
                <summary>ราคา “เริ่มต้น” หมายความว่าอะไร?</summary>
                <p>
                  หมายถึงแพ็กเกจฐานที่ครอบคลุมงานหลักตามรายการ หาก scope เพิ่ม
                  (หลายภาษา, ฟีเจอร์เพิ่ม, ระบบสมาชิก, CMS, อินทิเกรต API ฯลฯ)
                  จะประเมินเพิ่มตามจริงแบบโปร่งใส
                </p>
              </details>

              <details className={styles.qa}>
                <summary>ถ้าต้องการทำหลายภาษา (TH/EN) ได้ไหม?</summary>
                <p>
                  ได้ครับ และสามารถวางโครงสร้างให้รองรับ i18n ตั้งแต่ต้น
                  เพื่อให้เพิ่มภาษาในอนาคตได้ง่าย
                </p>
              </details>

              <details className={styles.qa}>
                <summary>โฮสติ้ง/โดเมนรวมในราคาไหม?</summary>
                <p>
                  โดยทั่วไปยังไม่รวม เพราะแต่ละเจ้ามีแพ็กเกจต่างกัน
                  แต่ผมช่วยแนะนำ + ช่วย deploy + ตั้งค่าโดเมนได้
                </p>
              </details>

              <details className={styles.qa}>
                <summary>ขอแก้ไขงานได้กี่รอบ?</summary>
                <p>
                  ตามหมายเหตุของแต่ละแพ็กเกจ (Starter 2 รอบ, Business 3 รอบ)
                  เพื่อให้ควบคุม timeline และคุณภาพได้ ถ้ามีงานเพิ่มนอก scope
                  จะประเมินเพิ่มก่อนทำเสมอ
                </p>
              </details>

              <details className={styles.qa}>
                <summary>ถ้ามีงานเร่งด่วน ทำได้ไหม?</summary>
                <p>
                  ได้ในบางช่วงเวลา ขึ้นอยู่กับคิวงานและขอบเขต ถ้าเร่งมากให้ส่ง
                  deadline มาเลย จะตอบตรง ๆ ว่าทันไหม
                </p>
              </details>

              <details className={styles.qa}>
                <summary>เริ่มต้นต้องส่งข้อมูลอะไร?</summary>
                <p>
                  1) ประเภทงาน (Website/Web App) 2) เป้าหมาย + กลุ่มลูกค้า 3)
                  จำนวนหน้า/ฟีเจอร์คร่าว ๆ 4) reference 5) งบ + deadline
                </p>
              </details>
            </div>

            <div className={styles.faqCta}>
              <Link className={styles.btnPrimary} href="/contact">
                ไปที่หน้า Contact
              </Link>
              <a className={styles.btnGhost} href={`mailto:${contactEmail}`}>
                ส่งอีเมล {contactEmail}
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
