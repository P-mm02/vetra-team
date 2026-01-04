// src/app/work/page.tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import styles from './page.module.css'

export const metadata: Metadata = {
  title: 'Work',
  description:
    'ผลงาน (Work) ของ Wee | Freelance — เว็บไซต์และเว็บแอปด้วย Next.js โทนดาร์ก-ฟิวเจอร์ริสติก เน้น SEO + Performance',
  alternates: { canonical: '/work' },
  openGraph: {
    title: 'Work | Wee | Freelance',
    description:
      'ผลงานเว็บไซต์/เว็บแอป Next.js — โค้ดสะอาด ดูแลง่าย SEO ดี และใช้งานจริงได้',
    url: '/work',
    type: 'website',
    locale: 'th_TH',
  },
}

type WorkItem = {
  title: string
  subtitle: string
  type: 'Website' | 'Web App' | 'Dashboard'
  stack: string[]
  highlights: string[]
  year: string
  status: 'Live' | 'In Progress' | 'Private'
  links?: { label: string; href: string }[]
}

const work: WorkItem[] = [
  {
    title: 'SGW Project Manager',
    subtitle: 'ระบบจัดการโครงการและแผนงานทีมงาน (Next.js + MongoDB)',
    type: 'Dashboard',
    stack: ['Next.js 15', 'TypeScript', 'MongoDB', 'Mongoose'],
    highlights: [
      'ตารางโครงการ + รายละเอียดงาน + เอกสาร',
      'ระบบบันทึก Work Log / Timeline',
      'โครงสร้างข้อมูลชัดเจน พร้อมต่อยอดฟีเจอร์',
    ],
    year: '2025–2026',
    status: 'In Progress',
    links: [{ label: 'ขอเดโม/รายละเอียด', href: '/contact' }],
  },
  {
    title: 'Caroline Clinic Website',
    subtitle: 'เว็บไซต์คลินิกหลายภาษา โครงสร้างชัด และดูพรีเมียม',
    type: 'Website',
    stack: ['Next.js', 'i18n', 'SEO'],
    highlights: [
      'โครงหน้าเหมาะกับบริการและรีวิว',
      'รองรับหลายภาษา (TH/EN)',
      'เน้นภาพรวมแบรนด์ + conversion',
    ],
    year: '2025',
    status: 'Private',
    links: [{ label: 'ติดต่อเพื่อดูตัวอย่าง', href: '/contact' }],
  },
  {
    title: 'QR Contact Landing',
    subtitle: 'หน้า Contact สำหรับแปะ QR ในสื่อออฟไลน์',
    type: 'Website',
    stack: ['Next.js', 'UI/UX', 'Performance'],
    highlights: [
      'กดทัก LINE / โทร / อีเมล ได้ทันที',
      'คัดลอกข้อมูลติดต่อ + ดาวน์โหลด vCard',
      'ออกแบบให้มือถือใช้ง่ายมาก',
    ],
    year: '2026',
    status: 'In Progress',
    links: [
      { label: 'ไปหน้า Contact', href: '/contact' },
      { label: 'ดูราคา', href: '/pricing' },
    ],
  },
]

const statusTone: Record<WorkItem['status'], { label: string }> = {
  Live: { label: 'ใช้งานจริง' },
  'In Progress': { label: 'กำลังพัฒนา' },
  Private: { label: 'ส่วนตัว/ขอชมได้' },
}

export default function WorkPage() {
  return (
    <main id="main" className={styles.page}>
      <header className={styles.hero}>
        <div className={styles.heroFx} aria-hidden="true" />
        <div className={styles.container}>
          <div className={styles.heroCard}>
            <div className={styles.kicker}>Work</div>

            <h1 className={styles.h1}>
              ผลงานที่โฟกัส
              <span className={styles.h1Accent}> คุณภาพและการใช้งานจริง</span>
            </h1>

            <p className={styles.subhead}>
              ตัวอย่างงานเว็บไซต์/เว็บแอปที่เน้นโครงสร้างชัดเจน UI พรีเมียม
              โค้ดดูแลง่าย และรองรับการต่อยอด (บางงานเป็น private/ภายในองค์กร)
            </p>

            <div className={styles.heroActions}>
              <Link className={styles.btnPrimary} href="/contact">
                ขอเดโม / คุยโปรเจกต์
              </Link>
              <Link className={styles.btnGhost} href="/pricing">
                ดูราคา (Pricing)
              </Link>
              <a className={styles.btnSoft} href="#list">
                ดูทั้งหมด
              </a>
            </div>
          </div>
        </div>
      </header>

      <section id="list" className={styles.section}>
        <div className={styles.container}>
          <div className={styles.grid}>
            {work.map((w) => (
              <article className={styles.card} key={w.title}>
                <div className={styles.cardTop}>
                  <div>
                    <h2 className={styles.h2}>{w.title}</h2>
                    <div className={styles.subtitle}>{w.subtitle}</div>
                  </div>

                  <div className={styles.badges}>
                    <span className={styles.pill}>{w.type}</span>
                    <span className={styles.pillDim}>{w.year}</span>
                    <span className={styles.pillStatus}>
                      {statusTone[w.status].label}
                    </span>
                  </div>
                </div>

                <div className={styles.block}>
                  <div className={styles.blockTitle}>Stack</div>
                  <div className={styles.tags}>
                    {w.stack.map((t) => (
                      <span className={styles.tag} key={t}>
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                <div className={styles.block}>
                  <div className={styles.blockTitle}>Highlights</div>
                  <ul className={styles.list}>
                    {w.highlights.map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                </div>

                <div className={styles.cardFoot}>
                  {(w.links || []).map((l, i) => (
                    <Link
                      key={`${w.title}-${l.href}`}
                      className={i === 0 ? styles.btnPrimary : styles.btnGhost}
                      href={l.href}
                    >
                      {l.label}
                    </Link>
                  ))}

                  <div className={styles.spacer} />

                  <Link className={styles.btnSoft} href="/contact">
                    ขอใบเสนอราคา
                  </Link>
                </div>
              </article>
            ))}
          </div>

          <div className={styles.bottomCard}>
            <div>
              <div className={styles.bottomTitle}>อยากได้งานสไตล์นี้?</div>
              <div className={styles.bottomText}>
                ส่งเป้าหมาย + reference + deadline + งบคร่าว ๆ มาได้เลย
                แล้วผมจะสรุป scope และแนวทางทำงานให้ชัด
              </div>
            </div>

            <div className={styles.bottomActions}>
              <Link className={styles.btnPrimary} href="/contact">
                ไปหน้า Contact
              </Link>
              <Link className={styles.btnGhost} href="/process">
                ดู Process
              </Link>
              <Link className={styles.btnSoft} href="/pricing">
                Pricing
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
