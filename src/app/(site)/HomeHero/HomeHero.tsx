// src/app/HomeHero/HomeHero.tsx
import Link from 'next/link'
import styles from './HomeHero.module.css'
import Image from 'next/image'
import { localizedPath, type Locale } from '@/lib/i18n'

const copy = {
  th: {
    title: 'สร้างเว็บไซต์ ทันสมัย ระดับพรีเมี่ยม ด้วย',
    subPrefix: 'เว็บไซต์เพื่อธุรกิจ ดีไซน์สวยงาม ทำ SEO เต็มระบบ',
    connector: 'และ',
    subSuffix: 'ค้นหาเจอง่าย เพิ่มยอดขายได้มาก',
    primary: 'ผลงานตัวอย่าง',
    secondary: 'ดูบริการทั้งหมด',
    highlightsLabel: 'จุดเด่น',
    highlights: [
      { k: 'เทคโนโลยี', v: 'Next.js MongoDB Cloudinary' },
      { k: 'ค่าใช้จ่ายรายปี', v: 'น้อยกว่า WordPress หลายเท่าตัว' },
      { k: 'การพัฒนาในอนาคต', v: 'เขียนเพิ่มฟังก์ชันการใช้งานที่ซับซ้อนได้' },
      { k: 'บทความ รูปภาพ', v: 'เราช่วยจัดทำคอนเทนต์ให้ ในส่วนที่ลูกค้าไม่มี' },
    ],
  },
  en: {
    title: 'Premium, modern websites built with',
    subPrefix:
      'Business websites with polished design, strong SEO, performance,',
    connector: 'and',
    subSuffix:
      'and content structured so customers can find you and trust you faster.',
    primary: 'View Projects',
    secondary: 'Explore Services',
    highlightsLabel: 'Highlights',
    highlights: [
      { k: 'Technology', v: 'Next.js MongoDB Cloudinary' },
      { k: 'Annual cost', v: 'Much lighter than typical WordPress overhead' },
      { k: 'Future growth', v: 'Ready for advanced custom features' },
      { k: 'Content & images', v: 'We can help prepare missing site content' },
    ],
  },
} satisfies Record<Locale, Record<string, unknown>>

export default function HomeHero({ locale = 'th' }: { locale?: Locale }) {
  const t = copy[locale]
  const heroImage =
    locale === 'en'
      ? {
          src: '/images/preview/vetra-preview.jpg',
          alt: 'VETRA website design and development',
          width: 1200,
          height: 630,
        }
      : {
          src: '/home/hero.png',
          alt: 'Vetra',
          width: 1200,
          height: 450,
        }

  return (
    <header className={styles.hero}>
      <div className={styles.container}>
        <div className={styles.heroCard}>
          <h1 className={styles.h1}>
            {t.title as string}
            <span className={styles.h1Accent}> Next.js</span>
          </h1>

          <p className={styles.subhead}>
            {t.subPrefix as string}
            <span className={styles.h1Accent}> AI </span>
            {t.connector as string}
            <span className={styles.h1Accent}> Google </span>
            {t.subSuffix as string}
          </p>

          {/* Logo image */}
          <div className={styles.heroImageWrap} aria-hidden="true">
            <Image
              src={heroImage.src}
              alt={heroImage.alt}
              width={heroImage.width}
              height={heroImage.height}
              priority
              className={styles.heroImage}
            />
          </div>

          <div className={styles.actions}>
            <Link
              className={styles.btnPrimary}
              href={localizedPath(locale, '/projects')}
            >
              {t.primary as string}
            </Link>

            <Link
              className={styles.btnGhost}
              href={localizedPath(locale, '/services')}
            >
              {t.secondary as string}
            </Link>
          </div>

          <div
            className={styles.highlights}
            aria-label={t.highlightsLabel as string}
          >
            {(t.highlights as Array<{ k: string; v: string }>).map((x) => (
              <div className={styles.highlightCard} key={x.k}>
                <div className={styles.highlightKey}>{x.k}</div>
                <div className={styles.highlightVal}>{x.v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </header>
  )
}
