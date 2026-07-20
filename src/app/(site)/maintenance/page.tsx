// src/app/maintenance/page.tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import styles from './page.module.css'
import { localizedPath, pageAlternates } from '@/lib/i18n'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://vetra.asia/'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'อยู่ระหว่างปรับปรุง',
  description:
    'ขณะนี้เรากำลังปรับปรุงหน้านี้ กรุณากลับมาใหม่อีกครั้ง',
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
  alternates: pageAlternates('/maintenance', 'th'),
}

export default function MaintenancePage() {
  return (
    <main className={styles.main} aria-label="หน้าอยู่ระหว่างปรับปรุง">
      <div className={styles.wrap}>
        <div className={styles.card}>
          <div className={styles.badge} aria-hidden="true">
            <span className={styles.dot} />
            <span className={styles.badgeText}>สถานะ</span>
          </div>

          <h1 className={styles.h1}>
            อยู่ระหว่าง <span className={styles.accent}>ปรับปรุง</span> /{' '}
            <span className={styles.accent2}>พัฒนา</span>
          </h1>

          <p className={styles.sub}>
            เรากำลังปรับปรุงหน้านี้ให้ใช้งานได้ลื่นไหล รวดเร็ว
            และสมบูรณ์ยิ่งขึ้น
          </p>

          <div className={styles.hr} />

          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <div className={styles.k}>กำลังดำเนินการ</div>
              <div className={styles.v}>ปรับปรุงระบบและรายละเอียดหน้าจอ</div>
            </div>
            <div className={styles.infoItem}>
              <div className={styles.k}>กลับมาเมื่อไร</div>
              <div className={styles.v}>
                กรุณากลับมาตรวจสอบอีกครั้งเร็ว ๆ นี้{' '}
                <span className={styles.muted}>/</span> ขอบคุณที่รอครับ
              </div>
            </div>
          </div>

          <div className={styles.actions}>
            <Link href={localizedPath('th', '/')} className={styles.btnPrimary}>
              กลับหน้าแรก
            </Link>
            <Link
              href={localizedPath('th', '/contact')}
              className={styles.btnGhost}
            >
              ติดต่อ
            </Link>
          </div>

          <p className={styles.foot}>
            หากมีเรื่องเร่งด่วน สามารถติดต่อเราได้ผ่านหน้าติดต่อ
          </p>
        </div>

        <div className={styles.glow} aria-hidden="true" />
      </div>
    </main>
  )
}
