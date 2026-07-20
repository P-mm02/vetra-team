import Link from 'next/link'
import { localizedPath, type Locale } from '@/lib/i18n'
import styles from './OngoingServices.module.css'

const content = {
  th: {
    eyebrow: 'ดูแลหลังเปิดใช้งาน',
    title: 'บริการดูแลเว็บไซต์อย่างต่อเนื่อง',
    intro:
      'เลือกดูแลเป็นรายเดือนหรือเฉพาะครั้งได้ เราช่วยให้เว็บไซต์ปลอดภัย อัปเดตง่าย และทำงานได้ดีหลังจากส่งมอบ',
    plans: [
      {
        name: 'ดูแลและบำรุงรักษา',
        summary: 'อัปเดตระบบ ตรวจสอบความพร้อม และช่วยแก้ปัญหาที่กระทบการใช้งาน',
        cadence: 'รายเดือน / ตามรอบ',
        points: ['ตรวจสอบระบบและ dependency', 'สำรองข้อมูลและแผนกู้คืน', 'แก้ไขข้อผิดพลาดตามขอบเขต'],
      },
      {
        name: 'ติดตาม SEO',
        summary: 'ดูแนวโน้มการค้นหาและปรับโครงสร้างสำคัญให้เว็บไซต์ค้นหาเจอง่ายขึ้น',
        cadence: 'รายเดือน',
        points: ['ตรวจ Search Console', 'ติดตามคำค้นหาและหน้า Landing', 'ตรวจ technical SEO'],
      },
      {
        name: 'วิเคราะห์ข้อมูล',
        summary: 'สรุปพฤติกรรมผู้ใช้และ Conversion เพื่อช่วยตัดสินใจจากข้อมูลจริง',
        cadence: 'รายเดือน / รายไตรมาส',
        points: ['ตั้งค่าและตรวจ GA4', 'รายงานหน้าที่มีประสิทธิภาพ', 'ข้อเสนอแนะเพื่อเพิ่ม Conversion'],
      },
      {
        name: 'อัปเดตคอนเทนต์',
        summary: 'ช่วยดูแลข้อความ รูปภาพ โปรโมชั่น และหน้าใหม่ให้เว็บไซต์ทันกับธุรกิจ',
        cadence: 'ตามจำนวนงาน',
        points: ['แก้ไขข้อความและรูปภาพ', 'เพิ่มบทความหรือหน้าแคมเปญ', 'จัดรูปแบบให้สอดคล้องกับแบรนด์'],
      },
      {
        name: 'ตรวจสอบประสิทธิภาพ',
        summary: 'ตรวจความเร็ว ความเสถียร และประสบการณ์ใช้งานบนอุปกรณ์จริง',
        cadence: 'รายเดือน / ก่อนแคมเปญ',
        points: ['ตรวจ Core Web Vitals', 'ปรับรูปภาพและการโหลดหน้า', 'ตรวจ Desktop และ Mobile'],
      },
    ],
    ctaTitle: 'ต้องการแผนดูแลที่เหมาะกับเว็บไซต์ของคุณ?',
    ctaText:
      'ส่งรายละเอียดเว็บไซต์และงานที่ต้องการ เราจะช่วยจัดขอบเขตงานและรอบการดูแลให้เหมาะกับธุรกิจ',
    cta: 'ปรึกษาแผนดูแลเว็บไซต์',
  },
  en: {
    eyebrow: 'After launch',
    title: 'Ongoing website care',
    intro:
      'Choose monthly support or focused one-off work. We keep your website reliable, current, and useful long after launch.',
    plans: [
      {
        name: 'Care and maintenance',
        summary:
          'Keep the system current, monitor essential services, and resolve issues that affect everyday use.',
        cadence: 'Monthly / scheduled',
        points: ['System and dependency checks', 'Backups and recovery planning', 'Scoped issue resolution'],
      },
      {
        name: 'SEO monitoring',
        summary:
          'Review search trends and improve the technical foundations that help customers discover your site.',
        cadence: 'Monthly',
        points: ['Search Console review', 'Query and landing-page tracking', 'Technical SEO checks'],
      },
      {
        name: 'Analytics reporting',
        summary:
          'Turn visitor and conversion data into clear priorities for your next business decisions.',
        cadence: 'Monthly / quarterly',
        points: ['GA4 setup and validation', 'Performance reporting', 'Conversion recommendations'],
      },
      {
        name: 'Content updates',
        summary:
          'Keep copy, imagery, promotions, and new pages aligned with the way your business is changing.',
        cadence: 'By workload',
        points: ['Copy and image updates', 'Articles and campaign pages', 'Brand-consistent formatting'],
      },
      {
        name: 'Performance checks',
        summary:
          'Review speed, stability, and real-device experience before issues affect customers.',
        cadence: 'Monthly / pre-campaign',
        points: ['Core Web Vitals review', 'Image and loading improvements', 'Desktop and mobile testing'],
      },
    ],
    ctaTitle: 'Need a care plan shaped around your website?',
    ctaText:
      'Share your site and priorities. We will recommend a practical scope and support rhythm for your business.',
    cta: 'Discuss ongoing support',
  },
} satisfies Record<
  Locale,
  {
    eyebrow: string
    title: string
    intro: string
    plans: Array<{
      name: string
      summary: string
      cadence: string
      points: string[]
    }>
    ctaTitle: string
    ctaText: string
    cta: string
  }
>

export default function OngoingServices({
  locale = 'th',
}: {
  locale?: Locale
}) {
  const t = content[locale]
  const headingId = `ongoing-services-${locale}`

  return (
    <section className={`section ${styles.section}`} aria-labelledby={headingId}>
      <div className="container">
        <header className={styles.header}>
          <p className={styles.eyebrow}>{t.eyebrow}</p>
          <h2 id={headingId} className={styles.title}>
            {t.title}
          </h2>
          <p className={styles.intro}>{t.intro}</p>
        </header>

        <div className={styles.grid}>
          {t.plans.map((plan) => (
            <article className={styles.service} key={plan.name}>
              <div className={styles.serviceHead}>
                <h3>{plan.name}</h3>
                <span>{plan.cadence}</span>
              </div>
              <p className={styles.summary}>{plan.summary}</p>
              <ul>
                {plan.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <div className={styles.ctaBand}>
          <div>
            <h3>{t.ctaTitle}</h3>
            <p>{t.ctaText}</p>
          </div>
          <Link
            className={styles.cta}
            href={localizedPath(locale, '/contact')}
          >
            {t.cta}
          </Link>
        </div>
      </div>
    </section>
  )
}
