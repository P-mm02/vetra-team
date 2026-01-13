// src/app/process/page.tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import styles from './page.module.css'

export const metadata: Metadata = {
  title: 'Process',
  description:
    'กระบวนการทำงานของ Wee | Freelance — ชัดเจน เป็นขั้นตอน ตั้งแต่สรุป scope, ออกแบบ, พัฒนา, optimize จน launch',
  alternates: { canonical: '/process' },
  openGraph: {
    title: 'Process | Wee | Freelance',
    description:
      'กระบวนการทำงานแบบชัดเจน: scope → design system → build & optimize → launch & iterate',
    url: '/process',
    type: 'website',
    locale: 'th_TH',
  },
}

const steps = [
  {
    num: '01',
    title: 'เก็บ requirement & สรุป Scope',
    desc: 'คุยเป้าหมาย กลุ่มลูกค้า ฟีเจอร์ เนื้อหา และ deadline เพื่อสรุป “ขอบเขตงาน” ให้ชัดก่อนเริ่ม',
    bullets: [
      'สรุปเป้าหมายและ KPI (เช่น lead, booking, sales)',
      'กำหนดหน้า/section + content outline',
      'สรุปฟีเจอร์/อินทิเกรต (ฟอร์ม, analytics, CRM, etc.)',
      'ไทม์ไลน์ + milestone + เงื่อนไขการแก้ไข',
    ],
    out: [
      'Scope doc / Sitemap (ย่อ)',
      'Plan + Timeline',
      'Checklist ก่อนเริ่มทำงาน',
    ],
  },
  {
    num: '02',
    title: 'วางโครงสร้าง & Information Architecture',
    desc: 'จัดระบบ navigation, hierarchy และ layout foundation ให้คนอ่านเข้าใจเร็ว และ SEO ทำงานได้จริง',
    bullets: [
      'วางโครงหน้า (wireframe แบบย่อ) เพื่อความชัด',
      'กำหนดชื่อ section และลำดับเนื้อหาให้ไหลลื่น',
      'วางโครง SEO: title/description, heading, internal links',
      'เตรียม assets: โลโก้ รูปภาพ สี ฟอนต์',
    ],
    out: ['Wireframe (lite)', 'โครงหน้า + โครงเนื้อหา', 'SEO structure plan'],
  },
  {
    num: '03',
    title: 'Design System (Dark Futuristic)',
    desc: 'ทำดีไซน์ให้ cohesive: typography, spacing, components, states เพื่อให้เว็บดู “พรีเมียม” แบบคุมโทน',
    bullets: [
      'กำหนด token: สี/ระยะ/เงา/รัศมี/transition',
      'ออกแบบ components หลัก: button, card, nav, form',
      'สร้าง style direction ที่ consistent ทั้งเว็บ',
      'รองรับ responsive และ accessibility ตั้งแต่ต้น',
    ],
    out: ['UI direction + components', 'Reusable styles', 'Responsive rules'],
  },
  {
    num: '04',
    title: 'Build (Next.js) + Content Implementation',
    desc: 'พัฒนาโค้ดแบบ clean, maintainable และวางโครงให้ต่อยอดง่ายในอนาคต',
    bullets: [
      'จัดโครงโปรเจกต์ + naming ที่อ่านง่าย',
      'ทำหน้า/section ตาม scope + ใส่คอนเทนต์จริง',
      'เชื่อมฟอร์ม/อีเมล/LINE/analytics (ถ้าต้องการ)',
      'ตรวจความเรียบร้อยทั้ง UX และ details',
    ],
    out: ['Working pages', 'Ready-to-edit structure', 'Basic QA checklist'],
  },
  {
    num: '05',
    title: 'Optimize: SEO + Performance + Accessibility',
    desc: 'ก่อนปล่อยใช้งานจริง ต้องจูนให้เร็วและแข็งแรง: metadata, images, semantics, Core Web Vitals-friendly',
    bullets: [
      'ตรวจ metadata / OG / Twitter cards',
      'ปรับรูปภาพและโหลดให้เหมาะสม',
      'เช็ค semantic HTML + heading hierarchy',
      'ตรวจ responsive, focus states, keyboard nav',
    ],
    out: ['SEO pass', 'Performance tuning', 'Accessibility pass (basic)'],
  },
  {
    num: '06',
    title: 'Launch & Iterate',
    desc: 'Deploy ขึ้น production, ตั้งค่าโดเมน และติดตามผลจริง แล้วค่อยปรับให้ดีขึ้นตามข้อมูล',
    bullets: [
      'Deploy (Vercel/Netlify) + environment setup',
      'เชื่อมโดเมน/SSL + basic monitoring',
      'เก็บ feedback/analytics แล้ว iterate เป็นรอบ ๆ',
      'เพิ่มหน้า/เพิ่มฟีเจอร์แบบเป็นเฟสได้',
    ],
    out: ['Live website', 'Launch checklist', 'Next improvements list'],
  },
]

const deliverables = [
  { k: 'โค้ด', v: 'โครงสร้างสะอาด อ่านง่าย และดูแลต่อได้' },
  { k: 'ดีไซน์', v: 'คุมโทนพรีเมียม dark-futuristic แบบ consistent' },
  { k: 'SEO', v: 'semantic HTML + metadata + internal structure' },
  { k: 'Performance', v: 'ภาพ/การโหลด/UX ลื่น และ production-ready' },
]

export default function ProcessPage() {
  return (
    <main id="main" className={styles.page}>
      <header className={styles.hero}>
        <div className={styles.container}>
          <div className={styles.heroCard}>
            <div className={styles.kicker}>Process</div>

            <h1 className={styles.h1}>
              กระบวนการทำงานแบบ
              <span className={styles.h1Accent}> ชัดเจนและคุมคุณภาพ</span>
            </h1>

            <p className={styles.subhead}>
              เป้าหมายคือให้คุณได้เว็บ/เว็บแอปที่ “ดูพรีเมียม + เร็ว + SEO ดี +
              ดูแลง่าย” โดยทำงานเป็นขั้นตอนและมี checklist ชัดเจนตั้งแต่ต้นจนจบ
            </p>

            <div className={styles.badges} aria-label="Deliverables">
              {deliverables.map((d) => (
                <div className={styles.badge} key={d.k}>
                  <div className={styles.badgeK}>{d.k}</div>
                  <div className={styles.badgeV}>{d.v}</div>
                </div>
              ))}
            </div>

            <div className={styles.actions}>
              <Link className={styles.btnPrimary} href="/contact">
                เริ่มคุยโปรเจกต์
              </Link>
              <Link className={styles.btnGhost} href="/pricing">
                ดูราคา (Pricing)
              </Link>
              <a className={styles.btnSoft} href="#steps">
                ดูขั้นตอนทั้งหมด
              </a>
            </div>
          </div>
        </div>
      </header>

      <section id="steps" className={styles.section}>
        <div className={styles.container}>
          <div className={styles.stepGrid}>
            {steps.map((s) => (
              <article className={styles.step} key={s.num}>
                <div className={styles.stepTop}>
                  <div className={styles.stepNum}>{s.num}</div>
                  <div>
                    <h2 className={styles.h2}>{s.title}</h2>
                    <p className={styles.lead}>{s.desc}</p>
                  </div>
                </div>

                <div className={styles.cols}>
                  <div className={styles.col}>
                    <div className={styles.colTitle}>ทำอะไรบ้าง</div>
                    <ul className={styles.list}>
                      {s.bullets.map((x) => (
                        <li key={x}>{x}</li>
                      ))}
                    </ul>
                  </div>

                  <div className={styles.col}>
                    <div className={styles.colTitle}>ได้อะไร</div>
                    <ul className={styles.listDim}>
                      {s.out.map((x) => (
                        <li key={x}>{x}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.bottomCard}>
            <div className={styles.bottomText}>
              <div className={styles.bottomTitle}>
                เริ่มต้นเร็วที่สุดต้องส่งอะไร?
              </div>
              <div className={styles.bottomLead}>
                ส่งมา 5 อย่างนี้:{' '}
                <span className={styles.accent}>ประเภทงาน</span> •{' '}
                <span className={styles.accent}>เป้าหมาย</span> •{' '}
                <span className={styles.accent}>reference</span> •{' '}
                <span className={styles.accent}>งบคร่าว ๆ</span> •{' '}
                <span className={styles.accent}>deadline</span>
              </div>

              <div className={styles.bottomHint}>
                ถ้ามีคอนเทนต์/โลโก้/รูปภาพพร้อม จะช่วยให้ timeline
                สั้นลงและคุมคุณภาพได้ง่ายขึ้น
              </div>
            </div>

            <div className={styles.bottomActions}>
              <Link className={styles.btnPrimary} href="/contact">
                ไปหน้า Contact
              </Link>
              <Link className={styles.btnGhost} href="/pricing">
                ดูแพ็กเกจราคา
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
