// src/app/page.tsx
import Link from 'next/link'
import styles from './page.module.css'
import SmoothScrollLink from '@/components/ui/SmoothScrollLink/SmoothScrollLink'
import CopyButton from '@/components/ui/CopyButton/CopyButton'
import AboutHero from '@/app/about/AboutHero/AboutHero'
import HomeHero from '@/app/HomeHero/HomeHero'

const services = [
  {
    title: 'เว็บไซต์ด้วย Next.js',
    desc: 'เว็บไซต์ธุรกิจสมัยใหม่: เร็ว เนี้ยบ SEO-friendly และวางโครงสร้างให้ต่อยอด (scale) ได้',
  },
  {
    title: 'เว็บแอป & แดชบอร์ด',
    desc: 'แอดมินพาเนล เครื่องมือภายใน พอร์ทัล และโปรดักต์สายข้อมูล พร้อมประสบการณ์ใช้งาน (UX) ระดับพรีเมียม',
  },
  {
    title: 'ออกแบบ UI/UX (ดาร์ก-ฟิวเจอร์ริสติก)',
    desc: 'ระบบดีไซน์ที่ไปทิศทางเดียวกัน: ฟอนต์ ระยะห่าง ลำดับความสำคัญ และภาพรวมที่ดูพรีเมียม',
  },
  {
    title: 'ความเร็วเว็บ & SEO',
    desc: 'โครงสร้าง HTML ที่มีความหมาย (semantic), เมตาดาต้า, การเข้าถึง (accessibility), ปรับรูปภาพ และจูน performance ให้พร้อมใช้งานจริง',
  },
]

const highlights = [
  { k: 'เทคโนโลยี', v: 'Next.js 15+, TypeScript' },
  { k: 'การส่งมอบงาน', v: 'โครงสร้างสะอาด โค้ดดูแลง่าย' },
  { k: 'การดีพลอย', v: 'พร้อมขึ้นระบบบน Vercel / Netlify' },
  { k: 'การขยายระบบ', v: 'App Router และแนวปฏิบัติที่ดี' },
]

const contactEmail = 'hello@example.com' // change later

export default function Page() {
  return (
    <div className={styles.page}>
      <a className={styles.skipLink} href="#main">
        ข้ามไปยังเนื้อหา
      </a>

      <HomeHero />

      <AboutHero />

      <main id="main" className={styles.main}>
        <section id="services" className={styles.section}>
          <div className={styles.sectionHead}>
            <h2 className={styles.h2}>บริการ</h2>
            <p className={styles.lead}>
              สแตกที่โฟกัส โครงสร้างสะอาด และภาพรวมดูพรีเมียม —
              โดยไม่เพิ่มความซับซ้อนที่ไม่จำเป็น
            </p>
          </div>

          <div className={styles.grid}>
            {services.map((s) => (
              <article className={styles.card} key={s.title}>
                <div className={styles.cardTop}>
                  <span className={styles.dot} aria-hidden="true" />
                  <h3 className={styles.h3}>{s.title}</h3>
                </div>
                <p className={styles.text}>{s.desc}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="process" className={styles.section}>
          <div className={styles.sectionHead}>
            <h2 className={styles.h2}>กระบวนการทำงาน</h2>
            <p className={styles.lead}>
              ขั้นตอนชัดเจน ไม่วุ่นวาย — และผลลัพธ์ดูดีระดับท็อป
            </p>
          </div>

          <div className={styles.steps}>
            <div className={styles.step}>
              <div className={styles.stepNum}>01</div>
              <div>
                <h3 className={styles.h3}>กำหนดขอบเขต & โครงสร้าง</h3>
                <p className={styles.text}>
                  วางหน้าเว็บ โครงร่างเนื้อหา เมนูนำทาง
                  และฐานเลย์เอาต์ให้พร้อมก่อนเริ่มพัฒนา
                </p>
              </div>
            </div>

            <div className={styles.step}>
              <div className={styles.stepNum}>02</div>
              <div>
                <h3 className={styles.h3}>ระบบดีไซน์ (Design System)</h3>
                <p className={styles.text}>
                  ออกแบบ UI โทนดาร์ก-ฟิวเจอร์ริสติก ให้ฟอนต์ ระยะห่าง
                  และคอมโพเนนต์สอดคล้องกันทั้งเว็บ
                </p>
              </div>
            </div>

            <div className={styles.step}>
              <div className={styles.stepNum}>03</div>
              <div>
                <h3 className={styles.h3}>พัฒนา & ปรับจูน</h3>
                <p className={styles.text}>
                  จัดการ SEO metadata, การเข้าถึง (accessibility), ความเร็ว
                  และแนวปฏิบัติสำหรับ production
                </p>
              </div>
            </div>

            <div className={styles.step}>
              <div className={styles.stepNum}>04</div>
              <div>
                <h3 className={styles.h3}>ขึ้นระบบ & ปรับปรุงต่อเนื่อง</h3>
                <p className={styles.text}>
                  ส่งมอบงานแบบโค้ดสะอาด ติดตามผลการใช้งานจริง
                  แล้วปรับให้ดีขึ้นอย่างต่อเนื่อง
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="contact" className={styles.section}>
          <div className={styles.contact}>
            <div>
              <h2 className={styles.h2}>มาสร้างงานพรีเมียมด้วยกัน</h2>
              <p className={styles.lead}>
                ส่งเป้าหมาย ไทม์ไลน์ และตัวอย่างที่ชอบ —
                ผมจะสรุปเป็นแผนที่ชัดเจน แล้วลงมือพัฒนาให้
              </p>

              <div className={styles.actions}>
                <a
                  className={styles.btnPrimary}
                  href={`mailto:${contactEmail}`}
                >
                  ส่งอีเมล
                </a>

                {/* client island */}
                <CopyButton
                  className={styles.btnGhost}
                  value={contactEmail}
                  copiedText="คัดลอกแล้ว!"
                  idleText="คัดลอกอีเมล"
                />
              </div>

              <p className={styles.note}>
                อีเมลติดต่อปัจจุบัน:{' '}
                <span className={styles.code}>{contactEmail}</span>
              </p>
            </div>

            <aside className={styles.checklist} aria-label="เช็กลิสต์อย่างย่อ">
              <div className={styles.checkTitle}>เช็กลิสต์อย่างย่อ</div>
              <ul className={styles.checkList}>
                <li>หน้าเว็บ & โครงร่างเนื้อหา</li>
                <li>ทิศทางสไตล์ดาร์ก-ฟิวเจอร์ริสติก</li>
                <li>เป้าหมาย SEO & กลุ่มเป้าหมาย</li>
                <li>โฮสติ้ง + โดเมน</li>
              </ul>
            </aside>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.container}>
          <div className={styles.footerInner}>
            <div>
              <div className={styles.brand}>Wee | Freelance</div>
              <div className={styles.footerSub}>Next.js • เว็บแอป • SEO</div>
            </div>

            <nav className={styles.footerNav} aria-label="ท้ายเว็บ">
              <a className={styles.footerLink} href="#services">
                บริการ
              </a>
              <a className={styles.footerLink} href="#process">
                กระบวนการทำงาน
              </a>
              <a className={styles.footerLink} href="#contact">
                ติดต่อ
              </a>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  )
}
