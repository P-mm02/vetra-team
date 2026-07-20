// src/app/terms/page.tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import styles from './page.module.css'
import { pageAlternates } from '@/lib/i18n'

export const metadata: Metadata = {
  title: 'ข้อกำหนดและเงื่อนไข',
  description:
    'ข้อกำหนดและเงื่อนไขการให้บริการของ VETRA — ขอบเขตงาน การชำระเงิน การแก้ไขงาน และการส่งมอบ',
  alternates: pageAlternates('/terms', 'th'),
  openGraph: {
    title: 'ข้อกำหนดและเงื่อนไข | VETRA',
    description:
      'ข้อกำหนดและเงื่อนไขการให้บริการ — ขอบเขตงาน การชำระเงิน การแก้ไขงาน และการส่งมอบ',
    url: '/terms',
    type: 'website',
    locale: 'th_TH',
  },
}

const updatedAt = '4 มกราคม 2569'

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
      'เอกสารฉบับนี้เป็นข้อกำหนดและเงื่อนไขการให้บริการระหว่างผู้ว่าจ้าง (“ลูกค้า”) และ Wee | Freelance (“ผู้ให้บริการ”).',
      'การเริ่มงาน/ชำระเงินมัดจำ/การยืนยันขอบเขตงาน ถือว่าเป็นการยอมรับเงื่อนไขเหล่านี้.',
    ],
  },
  {
    id: 'scope',
    title: 'ขอบเขตงาน (Scope) และการเปลี่ยนแปลง',
    body: [
      'ขอบเขตงานจะอ้างอิงจากเอกสารสรุป (เช่น Scope / Checklist / Quotation) ที่ตกลงกันก่อนเริ่มงาน.',
      'หากมีการเพิ่ม/เปลี่ยน requirement ที่อยู่นอก scope จะถือเป็น “งานเพิ่ม” และอาจมีค่าใช้จ่าย/ระยะเวลาเพิ่ม (แจ้งก่อนดำเนินการ).',
      'ลูกค้าควรส่งคอนเทนต์ โลโก้ รูปภาพ และข้อมูลที่จำเป็นภายในเวลาที่ตกลงเพื่อไม่ให้ timeline เลื่อน.',
    ],
  },
  {
    id: 'timeline',
    title: 'ไทม์ไลน์และการส่งงาน',
    body: [
      'ไทม์ไลน์ขึ้นอยู่กับความชัดเจนของ requirement และความพร้อมของคอนเทนต์/asset.',
      'การส่งมอบอาจแบ่งเป็น milestone (เช่น โครงหน้า → ดีไซน์ระบบ → หน้าใช้งานจริง → optimize → deploy).',
      'หากลูกค้าตอบกลับ/ส่งข้อมูลล่าช้า อาจทำให้กำหนดส่งขยับตามความเหมาะสม.',
    ],
  },
  {
    id: 'payment',
    title: 'การชำระเงิน',
    body: [
      'โดยทั่วไปงานจะเริ่มหลังจากยืนยัน scope และชำระเงินมัดจำตามที่ระบุในใบเสนอราคา (Quotation).',
      'งวดชำระเงิน (เช่น มัดจำ/กลางทาง/ก่อนส่งมอบ) จะระบุชัดในใบเสนอราคา.',
      'หากมีงานเพิ่ม จะประเมินราคาและระยะเวลาแยกก่อนเริ่มทำงานส่วนนั้น.',
    ],
  },
  {
    id: 'revisions',
    title: 'การแก้ไขงาน (Revisions)',
    body: [
      'จำนวนรอบแก้ไขและขอบเขตการแก้ไขจะอ้างอิงตามแพ็กเกจ/ใบเสนอราคา.',
      'การแก้ไขที่เป็นการเปลี่ยนทิศทางใหม่ (major change) หรือเพิ่มหน้า/เพิ่มฟีเจอร์ จะถือเป็นงานเพิ่ม.',
      'เพื่อความเร็ว ควรรวบรวม feedback เป็นชุด (batch) แทนการส่งทีละจุดหลายครั้ง.',
    ],
  },
  {
    id: 'content',
    title: 'คอนเทนต์และทรัพย์สิน (Content/Assets)',
    body: [
      'ลูกค้ารับรองว่ามีสิทธิ์ใช้คอนเทนต์/รูป/โลโก้/ฟอนต์ที่ส่งมา และไม่ละเมิดลิขสิทธิ์ของบุคคลอื่น.',
      'หากลูกค้าต้องการให้ผู้ให้บริการช่วยจัดทำคอนเทนต์/ภาพเพิ่มเติม สามารถประเมินเป็นงานแยกได้.',
    ],
  },
  {
    id: 'ip',
    title: 'ลิขสิทธิ์และสิทธิการใช้งาน',
    body: [
      'หลังชำระเงินครบตามที่ตกลง ลูกค้าจะได้รับสิทธิ์ในการใช้งานงานที่ส่งมอบตามขอบเขต.',
      'โค้ดส่วนที่เป็น template/utility ทั่วไปของผู้ให้บริการ อาจถูกนำไปใช้ซ้ำในโปรเจกต์อื่นได้ โดยไม่เปิดเผยข้อมูลลูกค้า.',
      'หากลูกค้าต้องการ “โอนสิทธิ์ทั้งหมด” หรือกำหนดสัญญาเฉพาะ สามารถตกลงเพิ่มเติมได้.',
    ],
  },
  {
    id: 'hosting',
    title: 'โฮสติ้ง/โดเมน/ระบบภายนอก',
    body: [
      'บริการ deploy สามารถทำได้บน Vercel/Netlify หรือระบบที่ลูกค้าต้องการ (ขึ้นกับความเหมาะสม).',
      'ค่าโฮสติ้ง/โดเมน/บริการภายนอก (เช่น email provider, analytics, CRM) เป็นค่าใช้จ่ายของลูกค้า เว้นแต่ระบุไว้เป็นอย่างอื่น.',
      'การเข้าถึงบัญชีต่าง ๆ ควรใช้วิธีที่ปลอดภัย (เช่น invite collaborator) และไม่ส่งรหัสผ่านในแชทสาธารณะ.',
    ],
  },
  {
    id: 'warranty',
    title: 'การรับประกัน/การซัพพอร์ต',
    body: [
      'หลังส่งมอบ สามารถมีช่วงซัพพอร์ตเพื่อแก้บั๊กตามที่ระบุในแพ็กเกจ/ใบเสนอราคา.',
      'การปรับปรุง/เพิ่มฟีเจอร์หลังส่งมอบจะประเมินเป็นงานต่อยอด (maintenance/phase 2).',
    ],
  },
  {
    id: 'limits',
    title: 'ข้อจำกัดความรับผิด',
    body: [
      'ผู้ให้บริการจะดำเนินงานอย่างเต็มความสามารถ แต่ไม่สามารถรับประกันผลลัพธ์ทางธุรกิจ (เช่น ยอดขาย/อันดับ SEO) ได้ 100% เพราะมีปัจจัยภายนอก.',
      'ผู้ให้บริการไม่รับผิดชอบความเสียหายที่เกิดจากบริการของบุคคลที่สาม (third-party) หรือการแก้ไขโค้ดโดยบุคคลอื่นหลังส่งมอบ.',
    ],
  },
  {
    id: 'termination',
    title: 'การยุติโปรเจกต์',
    body: [
      'หากลูกค้าต้องการยุติโปรเจกต์กลางคัน ผู้ให้บริการจะส่งมอบงานเท่าที่ทำเสร็จตามสถานะ และคิดค่าบริการตามสัดส่วนที่เหมาะสม.',
      'เงินมัดจำโดยทั่วไปไม่สามารถขอคืนได้ เนื่องจากเป็นค่าเริ่มงาน/กันเวลา/ทรัพยากร เว้นแต่มีข้อตกลงเป็นลายลักษณ์อักษร.',
    ],
  },
  {
    id: 'contact',
    title: 'ติดต่อ',
    body: [
      'หากมีคำถามเกี่ยวกับข้อกำหนดและเงื่อนไข สามารถติดต่อผ่านหน้าติดต่อ.',
    ],
  },
]

export default function TermsPage() {
  return (
    <main id="main" className={styles.page}>
      <header className={styles.hero}>
        <div className={styles.container}>
          <div className={styles.heroCard}>
            <div className={styles.kicker}>ข้อกำหนด</div>

            <h1 className={styles.h1}>
              ข้อกำหนดและเงื่อนไข
              <span className={styles.h1Accent}>การให้บริการ</span>
            </h1>

            <p className={styles.subhead}>
              เอกสารนี้ใช้เป็นแนวทางการทำงานร่วมกัน เพื่อให้ขอบเขตงานชัดเจน
              ลดความสับสน และทำงานได้ราบรื่น
              (สามารถปรับตามใบเสนอราคา/ข้อตกลงเฉพาะโปรเจกต์ได้)
            </p>

            <div className={styles.metaRow}>
              <div className={styles.metaItem}>
                <div className={styles.metaK}>อัปเดตล่าสุด</div>
                <div className={styles.metaV}>{updatedAt}</div>
              </div>
              <div className={styles.metaItem}>
                <div className={styles.metaK}>เอกสารที่เกี่ยวข้อง</div>
                <div className={styles.metaV}>
                  <Link className={styles.metaLink} href="/privacy">
                    นโยบายความเป็นส่วนตัว
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
                คุยโปรเจกต์
              </Link>
              <Link className={styles.btnGhost} href="/services">
                ดูราคา
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
              aria-label="สารบัญ"
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
                *เนื้อหาเป็นแม่แบบสำหรับงานฟรีแลนซ์ทั่วไป
                คุณสามารถปรับถ้อยคำให้เหมาะกับรูปแบบงานของคุณได้
              </div>
            </aside>

            {/* Content */}
            <article
              className={styles.content}
              aria-label="เนื้อหาข้อกำหนดและเงื่อนไข"
            >
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
                    ต้องการเริ่มงานแบบชัดเจน?
                  </div>
                  <div className={styles.bottomText}>
                    ส่งเป้าหมาย ตัวอย่างอ้างอิง กำหนดส่ง และงบคร่าว ๆ มาได้เลย
                    แล้วผมจะสรุปขอบเขตและแนวทางทำงานให้เป็นแผนที่ใช้งานได้จริง
                  </div>
                </div>

                <div className={styles.bottomActions}>
                  <Link className={styles.btnPrimary} href="/contact">
                    ไปหน้าติดต่อ
                  </Link>
                  <Link className={styles.btnGhost} href="/projects">
                    ดูผลงาน
                  </Link>
                  <Link className={styles.btnSoft} href="/services">
                    ดูราคา
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
