import Link from 'next/link'
import { localizedPath, type Locale } from '@/lib/i18n'
import styles from './PortfolioUnavailable.module.css'

const copy = {
  th: {
    title: 'ยังโหลดผลงานไม่ได้',
    body: 'ระบบผลงานขัดข้องชั่วคราว กรุณาลองอีกครั้งในอีกสักครู่ ระหว่างนี้ยังติดต่อเราได้ตามปกติ',
    retry: 'ลองอีกครั้ง',
    contact: 'ติดต่อเรา',
  },
  en: {
    title: 'Projects are temporarily unavailable',
    body: 'Please try again shortly. You can still reach us through the contact page.',
    retry: 'Try again',
    contact: 'Contact us',
  },
} satisfies Record<Locale, Record<string, string>>

export default function PortfolioUnavailable({ locale, retryPath }: { locale: Locale; retryPath: string }) {
  const t = copy[locale]
  return (
    <div className={styles.panel} role="status">
      <h2>{t.title}</h2>
      <p>{t.body}</p>
      <div className={styles.actions}>
        <form action={retryPath} method="get"><button type="submit" className={styles.primary}>{t.retry}</button></form>
        <Link href={localizedPath(locale, '/contact')} className={styles.secondary}>{t.contact}</Link>
      </div>
    </div>
  )
}
