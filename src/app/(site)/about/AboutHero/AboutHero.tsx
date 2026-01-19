// src/app/about/AboutHero/AboutHero.tsx
import Link from 'next/link'
import Image from 'next/image'
import styles from './AboutHero.module.css'

export default function AboutHero() {
  return (
    <header className={styles.hero}>
      <div className={styles.container}>
        <div className={styles.heroCard}>
          <Link
            href="/about"
            className={styles.kicker}
            aria-label="Go to About page"
          >
            About
          </Link>

          {/* Profile image */}
          <div className={styles.profileWrap} aria-label="Wee profile photo">
            <Image
              src="/about/Wee-Profile-2025.jpg"
              alt="Wee (Poomtawee Rompho) profile photo"
              width={768}
              height={768}
              priority
              className={styles.profileImg}
            />
          </div>

          <h1 className={styles.h1}>
            สวัสดีครับ ผมชื่อ <span className={styles.h1Accent}>Wee</span>{' '}
            (Poomtawee Rompho)
          </h1>

          <p className={`${styles.subhead} text-indent`}>
            เป็นผู้นำ ทีมฟรีแลนซ์ ออกแบบ และพัฒนา สร้าง เว็บไซต์ เว็บแอปพลิเคชัน
            รวมถึงระบบช่วยเหลือการทำงานสำหรับธุรกิจทุกประเภท
            มีประสบการณ์บริหารองค์กรหลายปี เข้าใจผู้ประกอบการ เข้าใจลูกค้า
            สร้างผลงานที่ตอบโจทย์ความต้องการได้
          </p>

          <div className={styles.heroGrid}>
            <div className={styles.heroBox}>
              <div className={styles.heroK}>โฟกัส</div>
              <div className={`${styles.heroV} text-indent`}>
                เว็บไซต์ธุรกิจ SEO เต็มระบบ เพิ่มโอกาสค้นหาเจอ จาก AI และ
                Google, ระบบบริหารงานภายในองค์กร, ระบบอัตโนมัติต่างๆ
              </div>
            </div>

            <div className={styles.heroBox}>
              <div className={styles.heroK}>สไตล์งาน</div>
              <div className={styles.heroV}>
                มีประสบการณ์ออกแบบทุกสไตล์ ให้เข้ากับธุรกิจของคุณ ไม่ว่าจะเป็น
                พรีเมียม ลักซูรี่ ทันสมัย ล้ำสมัย มินิมอล เน้นใช้งานง่าย
                ดูเข้าใจง่าย
              </div>
            </div>

            <div className={styles.heroBox}>
              <div className={styles.heroK}>วิธีทำงาน</div>
              <div className={styles.heroV}>
                1.วางโครงสร้างก่อน ให้ระบบทำงานลื่นไหล ประสิทธิภาพสูงสุด
                กินทรัพยากรน้อยที่สุด <br />
                2.เขียนโค้ดสะอาด เข้าใจง่าย นำไปพัฒนาต่อได้ <br />
                3.ทดสอบระบบ แก้ไขละเอียด ไม่ให้มีจุดบกพร่อง
              </div>
            </div>
          </div>

          <div className={styles.actions}>
            <Link className={styles.btnPrimary} href="/contact">
              ติดต่อเพื่อเริ่มโปรเจกต์
            </Link>
            <Link className={styles.btnGhost} href="/projects">
              ดูผลงาน
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}
