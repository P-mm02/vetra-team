// src/app/HomeHero/HomeHero.tsx
import Link from 'next/link'
import styles from './HomeHero.module.css'
import SmoothScrollLink from '@/components/ui/SmoothScrollLink/SmoothScrollLink'
import Image from 'next/image'

const highlights = [
  { k: 'เทคโนโลยี', v: 'Next.js MongoDB Cloudinary' },
  { k: 'ค่าใช้จ่ายรายปี', v: 'น้อยกว่า WordPress หลายเท่าตัว' },
  { k: 'การพัฒนาในอนาคต', v: 'เขียนเพิ่มฟังก์ชันการใช้งานที่ซับซ้อนได้' },
  { k: 'บทความ รูปภาพ', v: 'เราช่วยจัดทำคอนเทนต์ให้ ในส่วนที่ลูกค้าไม่มี' },
]

export default function HomeHero() {
  return (
    <header className={styles.hero}>
      <div className={styles.container}>
        <div className={styles.heroCard}>
          <h1 className={styles.h1}>
            สร้างเว็บไซต์ ทันสมัย ระดับพรีเมี่ยม ด้วย
            <span className={styles.h1Accent}> Next.js</span>
          </h1>

          <p className={styles.subhead}>
            เว็บไซต์เพื่อธุรกิจ ดีไซน์สวยงาม ทำ SEO เต็มระบบ
            <span className={styles.h1Accent}> AI </span> และ
            <span className={styles.h1Accent}> Google </span>
            ค้นหาเจอง่าย เพิ่มยอดขายได้มาก
          </p>

          {/* Logo image */}
          <div className={styles.heroImageWrap} aria-hidden="true">
            <Image
              src="/home/Vetra-logo-caption-3.jpg"
              alt="Vetra"
              width={1200}
              height={450}
              priority
              className={styles.heroImage}
            />
          </div>

          <div className={styles.actions}>
            <SmoothScrollLink className={styles.btnPrimary} href="#contact">
              เริ่มต้นโปรเจกต์
            </SmoothScrollLink>

            <Link className={styles.btnGhost} href="#services">
              ดูบริการทั้งหมด
            </Link>
          </div>

          <div className={styles.highlights} aria-label="จุดเด่น">
            {highlights.map((x) => (
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
