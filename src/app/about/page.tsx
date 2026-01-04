// src/app/about/page.tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import styles from './page.module.css'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

export const metadata: Metadata = {
  title: 'About',
  description:
    'เกี่ยวกับ Wee | Freelance — รับทำเว็บไซต์/เว็บแอปด้วย Next.js เน้นงานพรีเมียม โค้ดสะอาด SEO ดี และดูแลง่าย',
  alternates: { canonical: '/about' },
  openGraph: {
    title: 'About | Wee | Freelance',
    description:
      'เกี่ยวกับ Wee | Freelance — รับทำเว็บไซต์/เว็บแอปด้วย Next.js เน้นงานพรีเมียม โค้ดสะอาด SEO ดี',
    url: '/about',
    type: 'website',
    locale: 'th_TH',
  },
}

const skills = [
  { label: 'Next.js (App Router)', level: 'Advanced' },
  { label: 'TypeScript', level: 'Advanced' },
  { label: 'UI/UX (Dark Futuristic)', level: 'Strong' },
  { label: 'Performance & SEO', level: 'Strong' },
  { label: 'MongoDB / Mongoose', level: 'Good' },
  { label: 'Deployment (Vercel/Netlify)', level: 'Good' },
]

const principles = [
  {
    title: 'คิดแบบระบบ (System thinking)',
    desc: 'วางโครงสร้างให้โตได้: routing, content, data, component, และ naming ที่ชัด',
  },
  {
    title: 'UI ต้อง “ดูแพง” แต่ใช้ง่าย',
    desc: 'ชัดเจน อ่านง่าย ลำดับความสำคัญดี และรู้สึกพรีเมียมโดยไม่รก',
  },
  {
    title: 'SEO + Performance คือของจริง',
    desc: 'semantic HTML, metadata, image optimization, accessibility และ Core Web Vitals-friendly',
  },
  {
    title: 'โค้ดต้องดูแลง่าย',
    desc: 'clean structure, ยืดหยุ่น, แก้ไขง่าย, ทีมต่อรับงานต่อได้จริง',
  },
]

export default function AboutPage() {
  return (
    <main id="main" className={styles.page}>
      <header className={styles.hero}>
        <div className={styles.heroFx} aria-hidden="true" />

        <div className={styles.container}>
          <div className={styles.heroCard}>
            <div className={styles.kicker}>About</div>

            <h1 className={styles.h1}>
              สวัสดีครับ ผมชื่อ <span className={styles.h1Accent}>Wee</span>
            </h1>

            <p className={styles.subhead}>
              ฟรีแลนซ์รับทำเว็บไซต์และเว็บแอปด้วย Next.js —
              โทนดาร์ก-ฟิวเจอร์ริสติกแบบพรีเมียม เน้น SEO + ความเร็ว
              และทำให้โค้ด “ดูแลง่าย” เพื่อรองรับการเติบโตของโปรเจกต์
            </p>

            <div className={styles.heroGrid}>
              <div className={styles.heroBox}>
                <div className={styles.heroK}>โฟกัส</div>
                <div className={styles.heroV}>
                  เว็บไซต์ธุรกิจ, Landing สำหรับแคมเปญ/QR, และ Web App/Dashboard
                </div>
              </div>

              <div className={styles.heroBox}>
                <div className={styles.heroK}>สไตล์งาน</div>
                <div className={styles.heroV}>
                  Dark Futuristic • Minimal Premium • อ่านง่าย • ลื่นไหล
                </div>
              </div>

              <div className={styles.heroBox}>
                <div className={styles.heroK}>วิธีทำงาน</div>
                <div className={styles.heroV}>
                  วางโครงสร้างก่อน • ทำ Design system • build แบบ clean •
                  optimize ก่อน launch
                </div>
              </div>
            </div>

            <div className={styles.actions}>
              <Link className={styles.btnPrimary} href="/contact">
                ติดต่อเพื่อเริ่มโปรเจกต์
              </Link>
              <Link className={styles.btnGhost} href="/pricing">
                ดูราคา (Pricing)
              </Link>
              <a className={styles.btnSoft} href={`${SITE_URL}/contact`}>
                ลิงก์สำหรับ QR
              </a>
            </div>
          </div>
        </div>
      </header>

      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.grid}>
            <section className={styles.card} aria-label="Story">
              <h2 className={styles.h2}>แนวคิดและสไตล์งาน</h2>
              <p className={styles.text}>
                ผมชอบงานที่ “ดูพรีเมียม” และ “ใช้งานได้จริง” ไปพร้อมกัน
                งานเว็บที่ดีไม่ใช่แค่สวย แต่ต้องเร็ว อ่านง่าย
                มีโครงสร้างที่ถูกต้อง และต่อยอดได้โดยไม่พังเมื่อโปรเจกต์โตขึ้น
              </p>

              <p className={styles.text}>
                เป้าหมายคือทำให้เว็บไซต์ของคุณเป็น “หน้าหลักที่น่าเชื่อถือ”
                และเป็นเครื่องมือปิดการขาย
                หรือเป็นระบบงานที่ทีมใช้แล้วเร็วขึ้นจริง ไม่ใช่แค่โชว์งาน
              </p>

              <div className={styles.callout}>
                <div className={styles.calloutTitle}>สั้น ๆ</div>
                <div className={styles.calloutText}>
                  ทำเว็บให้ “ดูดี + เร็ว + SEO ดี + ดูแลง่าย”
                  ในมาตรฐานที่ใช้ทำธุรกิจได้จริง
                </div>
              </div>
            </section>

            <aside className={styles.side} aria-label="Skills & stack">
              <div className={styles.sideHead}>
                <div className={styles.sideTitle}>Skills / Stack</div>
                <div className={styles.sideSub}>
                  โฟกัสสิ่งที่จำเป็นต่อคุณภาพงาน
                </div>
              </div>

              <ul className={styles.skillList}>
                {skills.map((s) => (
                  <li className={styles.skill} key={s.label}>
                    <span className={styles.skillLabel}>{s.label}</span>
                    <span className={styles.pill}>{s.level}</span>
                  </li>
                ))}
              </ul>

              <div className={styles.miniNote}>
                ถ้าคุณมีระบบเดิม/มีโฮสต์เดิม/มี domain เดิม ผมช่วยวางแผนย้ายและ
                deploy ให้ได้
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.principles}>
            <div className={styles.sectionHead}>
              <h2 className={styles.h2}>หลักการทำงาน</h2>
              <p className={styles.lead}>
                หลัก ๆ คือ “ชัดเจน” ตั้งแต่โครงสร้างจนถึงรายละเอียด UI
                และการส่งมอบ
              </p>
            </div>

            <div className={styles.prGrid}>
              {principles.map((p) => (
                <article className={styles.prCard} key={p.title}>
                  <div className={styles.prDot} aria-hidden="true" />
                  <div>
                    <div className={styles.prTitle}>{p.title}</div>
                    <div className={styles.prText}>{p.desc}</div>
                  </div>
                </article>
              ))}
            </div>

            <div className={styles.ctaRow}>
              <Link className={styles.btnPrimary} href="/contact">
                เริ่มคุยโปรเจกต์
              </Link>
              <Link className={styles.btnGhost} href="/pricing">
                ดูแพ็กเกจราคา
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.footerCard}>
            <div>
              <div className={styles.footerTitle}>พร้อมเริ่มงาน?</div>
              <div className={styles.footerText}>
                ส่งเป้าหมาย + reference + deadline + งบคร่าว ๆ มาได้เลย
                แล้วผมจะสรุป scope และแนวทางทำงานให้ชัดเจน
              </div>
            </div>

            <div className={styles.footerActions}>
              <Link className={styles.btnPrimary} href="/contact">
                ไปที่หน้า Contact
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
