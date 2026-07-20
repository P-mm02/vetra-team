// src/app/about/AboutHero/AboutHero.tsx
import Link from 'next/link'
import Image from 'next/image'
import styles from './AboutHero.module.css'
import { localizedPath, type Locale } from '@/lib/i18n'

const copy = {
  th: {
    kicker: 'เกี่ยวกับเรา',
    ariaKicker: 'ไปยังหน้าเกี่ยวกับเรา',
    profileAlt: 'รูปโปรไฟล์ของ Wee (ภูมิทวี ร่มโพธิ์)',
    titleBefore: 'สวัสดีครับ ผมชื่อ',
    titleAfter: '(Poomtawee Rompho)',
    intro:
      'เป็นผู้นำ ทีมฟรีแลนซ์ ออกแบบ และพัฒนา สร้าง เว็บไซต์ เว็บแอปพลิเคชัน รวมถึงระบบช่วยเหลือการทำงานสำหรับธุรกิจทุกประเภท มีประสบการณ์บริหารองค์กรหลายปี เข้าใจผู้ประกอบการ เข้าใจลูกค้า สร้างผลงานที่ตอบโจทย์ความต้องการได้',
    focusK: 'โฟกัส',
    focusV:
      'เว็บไซต์ธุรกิจ SEO เต็มระบบ เพิ่มโอกาสค้นหาเจอ จาก AI และ Google, ระบบบริหารงานภายในองค์กร, ระบบอัตโนมัติต่างๆ',
    styleK: 'สไตล์งาน',
    styleV:
      'มีประสบการณ์ออกแบบทุกสไตล์ เพื่อให้เข้ากับธุรกิจ ไม่ว่าจะเป็น พรีเมียม ลักซูรี่ ทันสมัย ล้ำสมัย มินิมอล เน้นใช้งานง่าย ดูเข้าใจง่าย',
    methodK: 'วิธีทำงาน',
    methodV: [
      '1.วางโครงสร้างก่อน ให้ระบบทำงานลื่นไหล ประสิทธิภาพสูงสุด กินทรัพยากรน้อยที่สุด',
      '2.เขียนโค้ดสะอาด เข้าใจง่าย นำไปพัฒนาต่อได้',
      '3.ทดสอบระบบ แก้ไขละเอียด ไม่ให้มีจุดบกพร่อง',
    ],
    primary: 'ติดต่อเพื่อเริ่มโปรเจกต์',
    secondary: 'ดูผลงาน',
  },
  en: {
    kicker: 'About',
    ariaKicker: 'Go to About page',
    profileAlt: 'Profile photo of Wee (Poomtawee Rompho)',
    titleBefore: "Hi, I'm",
    titleAfter: '(Poomtawee Rompho)',
    intro:
      'I lead a freelance team that designs and builds websites, web applications, and business workflow systems. My background in running businesses helps me understand owners, customers, and the practical details that make a website useful after launch.',
    focusK: 'Focus',
    focusV:
      'Business websites with strong SEO, AI-ready content structure, internal management systems, automation, and custom workflows.',
    styleK: 'Design style',
    styleV:
      'I adapt the visual direction to each business: premium, luxury, modern, futuristic, minimal, or practical and easy to scan.',
    methodK: 'How we work',
    methodV: [
      '1. Plan the structure first so the system stays fast, efficient, and scalable.',
      '2. Write clean code that is easy to maintain and extend.',
      '3. Test carefully and refine details before delivery.',
    ],
    primary: 'Start a Project',
    secondary: 'View Projects',
  },
} satisfies Record<Locale, Record<string, unknown>>

type AboutHeroProps = {
  locale?: Locale
  headingLevel?: 'h1' | 'h2'
}

export default function AboutHero({
  locale = 'th',
  headingLevel = 'h1',
}: AboutHeroProps) {
  const t = copy[locale]
  const Heading = headingLevel

  return (
    <header className={styles.hero}>
      <div className={styles.container}>
        <div className={styles.heroCard}>
          <Link
            href={localizedPath(locale, '/about')}
            className={styles.kicker}
            aria-label={t.ariaKicker as string}
          >
            {t.kicker as string}
          </Link>

          {/* Profile image */}
          <div className={styles.profileWrap}>
            <Image
              src="/about/Wee-Profile-2025.jpg"
              alt={t.profileAlt as string}
              width={768}
              height={768}
              priority={headingLevel === 'h1'}
              className={styles.profileImg}
            />
          </div>

          <Heading className={styles.h1}>
            {t.titleBefore as string}{' '}
            <span className={styles.h1Accent}>Wee</span>{' '}
            {t.titleAfter as string}
          </Heading>

          <p className={`${styles.subhead} text-indent`}>
            {t.intro as string}
          </p>

          <div className={styles.heroGrid}>
            <div className={styles.heroBox}>
              <div className={styles.heroK}>{t.focusK as string}</div>
              <div className={`${styles.heroV} text-indent`}>
                {t.focusV as string}
              </div>
            </div>

            <div className={styles.heroBox}>
              <div className={styles.heroK}>{t.styleK as string}</div>
              <div className={styles.heroV}>
                {t.styleV as string}
              </div>
            </div>

            <div className={styles.heroBox}>
              <div className={styles.heroK}>{t.methodK as string}</div>
              <div className={styles.heroV}>
                {(t.methodV as string[]).map((line) => (
                  <span key={line}>
                    {line}
                    <br />
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className={styles.actions}>
            <Link
              className={styles.btnPrimary}
              href={localizedPath(locale, '/contact')}
            >
              {t.primary as string}
            </Link>
            <Link
              className={styles.btnGhost}
              href={localizedPath(locale, '/projects')}
            >
              {t.secondary as string}
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}
