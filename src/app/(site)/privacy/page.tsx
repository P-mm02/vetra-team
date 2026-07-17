// src/app/privacy/page.tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import styles from './page.module.css'
import { pageAlternates } from '@/lib/i18n'

export const metadata: Metadata = {
  title: 'Privacy',
  description:
    'นโยบายความเป็นส่วนตัวของ VETRA — การเก็บข้อมูล การใช้งานคุกกี้ และสิทธิของผู้ใช้งาน',
  alternates: pageAlternates('/privacy', 'th'),
  openGraph: {
    title: 'Privacy | VETRA',
    description:
      'นโยบายความเป็นส่วนตัว — ข้อมูลที่เก็บ วิธีใช้งานคุกกี้ และสิทธิของผู้ใช้งาน',
    url: '/privacy',
    type: 'website',
    locale: 'th_TH',
  },
}

const updatedAt = 'January 4, 2026'

type Section = {
  id: string
  title: string
  body: string[]
}

const sections: Section[] = [
  {
    id: 'overview',
    title: 'ภาพรวม',
    body: [
      'นโยบายนี้อธิบายว่า VETRA (“เรา”) เก็บ ใช้ และปกป้องข้อมูลของคุณอย่างไรเมื่อคุณเข้าชมเว็บไซต์หรือส่งข้อมูลติดต่อ.',
      'เราให้ความสำคัญกับความเป็นส่วนตัว และจะเก็บข้อมูลเท่าที่จำเป็นเพื่อการให้บริการ/การติดต่อกลับ.',
    ],
  },
  {
    id: 'data',
    title: 'ข้อมูลที่เราอาจเก็บ',
    body: [
      'ข้อมูลที่คุณให้โดยตรง: ชื่อ/อีเมล/เบอร์โทร/ข้อความที่ส่งผ่านฟอร์มหรืออีเมล.',
      'ข้อมูลการใช้งานเว็บไซต์ (โดยอัตโนมัติ): ประเภทอุปกรณ์ เบราว์เซอร์ หน้าที่เข้าชม เวลาใช้งาน โดยเป็นข้อมูลเชิงสถิติ.',
      'เราไม่ตั้งใจเก็บข้อมูลอ่อนไหว (เช่น สุขภาพ ศาสนา การเมือง) หากคุณส่งมาโดยไม่จำเป็น โปรดหลีกเลี่ยง.',
    ],
  },
  {
    id: 'use',
    title: 'เราใช้ข้อมูลเพื่ออะไร',
    body: [
      'ติดต่อกลับเพื่อพูดคุยงาน ประเมินงาน หรือส่งใบเสนอราคา.',
      'ปรับปรุงประสบการณ์ใช้งานและคุณภาพเว็บไซต์ (เช่น ดูว่าเนื้อหาส่วนไหนคนสนใจ).',
      'ป้องกันสแปมหรือการใช้งานที่ผิดปกติ (security/abuse prevention).',
    ],
  },
  {
    id: 'cookies',
    title: 'คุกกี้และเครื่องมือวิเคราะห์',
    body: [
      'เว็บไซต์อาจใช้คุกกี้เพื่อการทำงานพื้นฐาน และ/หรือเครื่องมือวิเคราะห์ (เช่น analytics) เพื่อดูสถิติการใช้งาน.',
      'คุณสามารถตั้งค่าบล็อกคุกกี้ได้ในเบราว์เซอร์ แต่อาจกระทบประสบการณ์บางส่วน.',
      'หากในอนาคตมีการใช้เครื่องมือเพิ่มเติม เราจะปรับปรุงนโยบายนี้ให้ชัดเจน.',
    ],
  },
  {
    id: 'sharing',
    title: 'การเปิดเผยข้อมูลให้บุคคลที่สาม',
    body: [
      'เราไม่ขายข้อมูลส่วนบุคคลของคุณ.',
      'เราอาจใช้บริการของบุคคลที่สามเพื่อโฮสต์เว็บไซต์/วิเคราะห์การใช้งาน/ส่งอีเมล (เช่น Vercel/Netlify/Analytics/Email provider) ซึ่งจำเป็นต่อการให้บริการ.',
      'เราจะเปิดเผยข้อมูลเมื่อจำเป็นตามกฎหมายหรือเพื่อป้องกันการทุจริต/การโจมตีระบบ.',
    ],
  },
  {
    id: 'security',
    title: 'การเก็บรักษาและความปลอดภัย',
    body: [
      'เราใช้แนวทางที่เหมาะสมเพื่อปกป้องข้อมูล (เช่น จำกัดการเข้าถึง, ใช้ช่องทางที่ปลอดภัย).',
      'อย่างไรก็ตาม ไม่มีระบบใดปลอดภัย 100% หากมีความเสี่ยงหรือเหตุผิดปกติ เราจะพยายามแจ้งให้ทราบตามความเหมาะสม.',
    ],
  },
  {
    id: 'retention',
    title: 'ระยะเวลาการเก็บข้อมูล',
    body: [
      'เราจะเก็บข้อมูลเท่าที่จำเป็นตามวัตถุประสงค์ เช่น การติดต่อ/ประเมินงาน/ประวัติการทำงาน.',
      'หากข้อมูลไม่จำเป็นแล้ว เราอาจลบหรือทำให้ไม่สามารถระบุตัวตนได้.',
    ],
  },
  {
    id: 'rights',
    title: 'สิทธิของคุณ',
    body: [
      'คุณสามารถขอให้เราแก้ไข/ลบข้อมูลส่วนบุคคลที่คุณเคยส่งมาได้ (ภายในขอบเขตที่กฎหมายอนุญาต).',
      'คุณสามารถติดต่อผ่านหน้า Contact เพื่อขอข้อมูลเพิ่มเติมหรือดำเนินการตามสิทธิ.',
    ],
  },
  {
    id: 'changes',
    title: 'การเปลี่ยนแปลงนโยบาย',
    body: [
      'เราอาจอัปเดตนโยบายนี้เป็นครั้งคราวเพื่อให้สอดคล้องกับวิธีการทำงานหรือข้อกฎหมาย.',
      'วันที่ “อัปเดตล่าสุด” จะถูกปรับเมื่อมีการเปลี่ยนแปลง.',
    ],
  },
  {
    id: 'contact',
    title: 'ติดต่อเรา',
    body: [
      'หากมีคำถามเกี่ยวกับนโยบายความเป็นส่วนตัว สามารถติดต่อผ่านหน้า Contact.',
    ],
  },
]

export default function PrivacyPage() {
  return (
    <main id="main" className={styles.page}>
      <header className={styles.hero}>
        <div className={styles.container}>
          <div className={styles.heroCard}>
            <div className={styles.kicker}>Privacy</div>

            <h1 className={styles.h1}>
              นโยบายความเป็นส่วนตัว
              <span className={styles.h1Accent}> (Privacy)</span>
            </h1>

            <p className={styles.subhead}>
              เราเก็บข้อมูลเท่าที่จำเป็นเพื่อการติดต่อและการให้บริการเท่านั้น
              และพยายามปกป้องข้อมูลของคุณตามแนวทางที่เหมาะสม
            </p>

            <div className={styles.metaRow}>
              <div className={styles.metaItem}>
                <div className={styles.metaK}>อัปเดตล่าสุด</div>
                <div className={styles.metaV}>{updatedAt}</div>
              </div>
              <div className={styles.metaItem}>
                <div className={styles.metaK}>เอกสารที่เกี่ยวข้อง</div>
                <div className={styles.metaV}>
                  <Link className={styles.metaLink} href="/terms">
                    Terms
                  </Link>
                </div>
              </div>
              <div className={styles.metaItem}>
                <div className={styles.metaK}>ติดต่อ</div>
                <div className={styles.metaV}>
                  <Link className={styles.metaLink} href="/contact">
                    /contact
                  </Link>
                </div>
              </div>
            </div>

            <div className={styles.actions}>
              <a className={styles.btnSoft} href="#toc">
                ดูสารบัญ
              </a>
              <Link className={styles.btnPrimary} href="/contact">
                ไปหน้า Contact
              </Link>
              <Link className={styles.btnGhost} href="/services">
                ดู Services
              </Link>
            </div>
          </div>
        </div>
      </header>

      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.layout}>
            {/* TOC */}
            <aside
              className={styles.toc}
              id="toc"
              aria-label="Table of contents"
            >
              <div className={styles.tocTitle}>สารบัญ</div>
              <nav className={styles.tocNav}>
                {sections.map((s) => (
                  <a key={s.id} className={styles.tocLink} href={`#${s.id}`}>
                    {s.title}
                  </a>
                ))}
              </nav>

              <div className={styles.tocNote}>
                *นโยบายนี้เป็น template สำหรับเว็บไซต์พอร์ต/ฟรีแลนซ์ทั่วไป
                หากคุณมีการเก็บข้อมูลเชิงลึก (เช่น ระบบสมาชิก/ชำระเงิน)
                ควรปรับรายละเอียดให้เหมาะสม
              </div>
            </aside>

            {/* Content */}
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

              <div className={styles.bottomCard}>
                <div>
                  <div className={styles.bottomTitle}>
                    อยากทำเว็บที่ปลอดภัยและน่าเชื่อถือ?
                  </div>
                  <div className={styles.bottomText}>
                    ผมช่วยวางโครงสร้าง SEO + performance + content flow
                    ให้ดูมืออาชีพ และทำระบบติดต่อที่ใช้งานจริงได้ (เหมาะกับ QR
                    marketing)
                  </div>
                </div>

                <div className={styles.bottomActions}>
                  <Link className={styles.btnPrimary} href="/contact">
                    คุยโปรเจกต์
                  </Link>
                  <Link className={styles.btnGhost} href="/pricing">
                    ดูราคา
                  </Link>
                  <Link className={styles.btnSoft} href="/process">
                    ดู Process
                  </Link>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>
    </main>
  )
}
