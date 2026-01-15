// src/app/services/page.tsx
import type { Metadata } from 'next'
import styles from './page.module.css'
import NextLink from 'next/link'

export const metadata: Metadata = {
  title: 'Services',
  description:
    'บริการของ Wee | Freelance — รับทำเว็บไซต์/เว็บแอปด้วย Next.js โทนดาร์ก-ฟิวเจอร์ริสติก เน้น SEO + Performance และโค้ดดูแลง่าย',
  alternates: { canonical: '/services' },
  openGraph: {
    title: 'Services | Wee | Freelance',
    description:
      'รับทำเว็บไซต์/เว็บแอป Next.js — Landing, Website, Web App/Dashboard, UI/UX, SEO & Performance',
    url: '/services',
    type: 'website',
    locale: 'th_TH',
  },
}

type Service = {
  title: string
  subtitle: string
  desc: string
  bullets: string[]
  outputs: string[]
  tag: string
}

const services: Service[] = [
  {
    title: 'Next.js Website (Business-ready)',
    subtitle: 'เว็บบริษัท/แบรนด์ ที่ดูพรีเมียม โหลดเร็ว และ SEO ดี',
    desc: 'เหมาะกับธุรกิจที่ต้องการ “เว็บหลัก” ที่น่าเชื่อถือ ปรับแก้ได้ง่าย และต่อยอดได้ในอนาคต',
    bullets: [
      'โครงสร้างหน้า/เมนูชัดเจน อ่านง่าย',
      'โทนดาร์ก-ฟิวเจอร์ริสติกแบบพรีเมียม',
      'รองรับมือถือ/แท็บเล็ต/เดสก์ท็อป',
      'วาง metadata + semantic HTML เพื่อ SEO',
    ],
    outputs: [
      'หน้าเว็บตาม scope',
      'โครงสร้างโค้ดดูแลง่าย',
      'Deploy พร้อมใช้งาน',
    ],
    tag: 'Website',
  },
  {
    title: 'Landing Page (QR / Campaign)',
    subtitle: 'หน้าเดียวเพื่อ conversion — เหมาะกับสื่อออฟไลน์/QR',
    desc: 'เหมาะมากสำหรับทำโบรชัวร์ นามบัตร ป้าย หรือสื่อออฟไลน์: สแกนแล้วกดติดต่อ/ปิดการขายได้ทันที',
    bullets: [
      'CTA ชัด: โทร / LINE / อีเมล / แผนที่',
      'คอนเทนต์กระชับ + จัดลำดับเนื้อหาดี',
      'โหลดเร็วมาก รองรับมือถือสุด ๆ',
      'ทำให้เว็บดู “แพง” แม้เป็นหน้าเดียว',
    ],
    outputs: [
      '1 หน้า conversion-ready',
      'QR-friendly UX',
      'Deploy พร้อมยิงแคมเปญ',
    ],
    tag: 'Landing',
  },
  {
    title: 'Web App / Dashboard',
    subtitle: 'ระบบหลังบ้าน เครื่องมือภายใน Portal และ Dashboard',
    desc: 'สำหรับงานที่ต้องใช้ข้อมูลจริง มี workflow มี CRUD และต้องการ UX ที่เร็วและชัด',
    bullets: [
      'วิเคราะห์ requirement + สรุป scope แบบเป็นระบบ',
      'โครงสร้าง App Router + component ที่ต่อยอดง่าย',
      'เชื่อมฐานข้อมูล/สิทธิ์/role (ตามความต้องการ)',
      'เน้นความชัดเจนและความเร็วในการใช้งาน',
    ],
    outputs: ['ระบบใช้งานจริง', 'โค้ดส่งมอบดูแลง่าย', 'แผนต่อยอดเป็นเฟส'],
    tag: 'App',
  },
  {
    title: 'UI/UX (Dark Futuristic System)',
    subtitle: 'ออกแบบระบบ UI ให้คุมโทนและดูพรีเมียมทั้งเว็บ',
    desc: 'เหมาะกับคนที่อยากให้เว็บดู “เป็นแบรนด์” และมีความสม่ำเสมอในทุกหน้า',
    bullets: [
      'token สี/spacing/typography/เงา/transition',
      'ออกแบบ component states: hover/focus/disabled',
      'คุม hierarchy ให้คนอ่านเข้าใจเร็ว',
      'รองรับ responsive + accessibility ตั้งแต่ต้น',
    ],
    outputs: [
      'Design direction',
      'Reusable components',
      'CSS ที่แก้ต่อได้ง่าย',
    ],
    tag: 'UI/UX',
  },
  {
    title: 'SEO & Performance Tuning',
    subtitle: 'ปรับให้เร็วขึ้น + โครงสร้าง SEO แข็งแรง',
    desc: 'สำหรับเว็บที่มีอยู่แล้ว แต่ต้องการยกระดับความเร็ว ความถูกต้องของโครงสร้าง และความน่าเชื่อถือ',
    bullets: [
      'metadata/OG/Twitter + semantic headings',
      'ภาพ/โหลด/UX เพื่อ Core Web Vitals-friendly',
      'ตรวจ accessibility: focus/keyboard',
      'ปรับ internal links และ content structure',
    ],
    outputs: ['รายงานสิ่งที่แก้', 'ปรับจริงในโค้ด', 'แนะนำ next steps'],
    tag: 'Optimize',
  },
]

const howWeWork = [
  { k: 'คุยเป้าหมาย', v: 'สรุป scope ให้ชัดก่อนเริ่ม' },
  { k: 'คุมโทน', v: 'Design system ให้ดูพรีเมียมและสม่ำเสมอ' },
  { k: 'ทำให้เร็ว', v: 'Performance + SEO เป็น default ไม่ใช่ add-on' },
  { k: 'ส่งมอบดูแลง่าย', v: 'โครงสร้างโค้ดอ่านง่ายต่อยอดได้' },
]

export default function ServicesPage() {
  return (
    <main id="main" className={styles.page}>
      <header className={styles.hero}>
        <div className={styles.container}>
          <div className={styles.heroCard}>
            <div className={styles.kicker}>Services</div>

            <h1 className={styles.h1}>
              บริการที่เน้น
              <span className={styles.h1Accent}> งานพรีเมียม + ใช้งานจริง</span>
            </h1>

            <p className={styles.subhead}>
              รับทำ Website / Landing / Web App (Next.js) —
              โทนดาร์ก-ฟิวเจอร์ริสติก เน้น SEO + Performance
              และโค้ดสะอาดเพื่อให้ดูแลต่อได้ง่าย
            </p>

            <div className={styles.pillRow}>
              {howWeWork.map((x) => (
                <div className={styles.pill} key={x.k}>
                  <div className={styles.pillK}>{x.k}</div>
                  <div className={styles.pillV}>{x.v}</div>
                </div>
              ))}
            </div>

            <div className={styles.actions}>
              <NextLink className={styles.btnPrimary} href="/contact">
                คุยโปรเจกต์ / ขอใบเสนอราคา
              </NextLink>
              <NextLink className={styles.btnGhost} href="/pricing">
                ดูราคา (Pricing)
              </NextLink>
              <NextLink className={styles.btnSoft} href="/process">
                ดู Process
              </NextLink>
            </div>
          </div>
        </div>
      </header>

      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.grid}>
            {services.map((s) => (
              <article className={styles.card} key={s.title}>
                <div className={styles.cardTop}>
                  <div className={styles.tag}>{s.tag}</div>
                  <h2 className={styles.h2}>{s.title}</h2>
                  <div className={styles.subtitle}>{s.subtitle}</div>
                </div>

                <p className={styles.text}>{s.desc}</p>

                <div className={styles.block}>
                  <div className={styles.blockTitle}>เหมาะกับ</div>
                  <ul className={styles.list}>
                    {s.bullets.map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                </div>

                <div className={styles.block}>
                  <div className={styles.blockTitle}>สิ่งที่จะได้</div>
                  <ul className={styles.listDim}>
                    {s.outputs.map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                </div>

                <div className={styles.cardFoot}>
                  <NextLink className={styles.btnPrimary} href="/contact">
                    ขอประเมินงาน
                  </NextLink>
                  <NextLink className={styles.btnGhost} href="/pricing">
                    ดูราคา
                  </NextLink>
                </div>
              </article>
            ))}
          </div>

          <div className={styles.bottomCard}>
            <div>
              <div className={styles.bottomTitle}>
                เริ่มต้นไวสุด: ส่งข้อมูล 5 อย่าง
              </div>
              <div className={styles.bottomText}>
                ประเภทงาน • เป้าหมาย • reference • งบคร่าว ๆ • deadline
              </div>
              <div className={styles.bottomHint}>
                ถ้ามีโลโก้/รูป/คอนเทนต์พร้อม จะช่วยให้ timeline
                สั้นลงและคุมคุณภาพได้ง่ายขึ้น
              </div>
            </div>

            <div className={styles.bottomActions}>
              <NextLink className={styles.btnPrimary} href="/contact">
                ไปหน้า Contact
              </NextLink>
              <NextLink className={styles.btnSoft} href="/process">
                ดู Process
              </NextLink>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
