// src/app/(admin)/admin/cms/cloud/page.tsx
import styles from './page.module.css'
import { connectMongo } from '@/lib/db/mongoose'
import { getCmsI18n } from '@/lib/cms/i18n-server'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export async function generateMetadata() {
  const { t } = await getCmsI18n()
  return { title: t('Cloud usage', 'การใช้พื้นที่จัดเก็บ') }
}

const thaiCopy: Record<string, string> = {
  'Data size': 'ขนาดข้อมูล', 'Index size': 'ขนาดดัชนี', 'Storage size': 'พื้นที่จัดเก็บ',
  'Collections': 'คอลเลกชัน', 'Assets': 'ไฟล์สื่อ', 'Bandwidth': 'ปริมาณรับส่งข้อมูล',
  'Transformations': 'การแปลงไฟล์', 'Last sync': 'ซิงก์ล่าสุด', 'Not connected': 'ยังไม่ได้เชื่อมต่อ',
  'Live MongoDB stats fetched from db.stats(). Quota is configurable via MONGO_QUOTA_MB.': 'สถิติ MongoDB ปัจจุบัน โควตาเป็นค่าที่กำหนดไว้ในการตั้งค่าระบบ',
  'Mock mode: could not read MongoDB stats (permissions or connectivity).': 'ข้อมูลตัวอย่าง: ไม่สามารถอ่านสถิติ MongoDB ได้ กรุณาตรวจสอบสิทธิ์หรือการเชื่อมต่อ',
  'Mock mode: connect Cloudinary Admin API later.': 'ข้อมูลตัวอย่าง: การแสดงสถิติการใช้พื้นที่ Cloudinary ยังไม่ได้เปิดใช้งาน',
}

type Usage = {
  usedBytes: number
  quotaBytes: number
  details: { label: string; value: string }[]
  note?: string
  isMock?: boolean
}

function clamp(n: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, n))
}

function fmtBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB'] as const
  let v = bytes
  let i = 0
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024
    i++
  }
  return `${v.toFixed(v >= 10 || i === 0 ? 0 : 1)} ${units[i]}`
}

function fmtPercent(used: number, quota: number) {
  if (quota <= 0) return 0
  return clamp((used / quota) * 100)
}

async function getMongoUsage(): Promise<Usage> {
  // Optional env knobs (safe defaults)
  const quotaMB = Number(process.env.MONGO_QUOTA_MB ?? 512) // tweak per your plan
  const quotaBytes = Math.max(1, quotaMB) * 1024 * 1024

  try {
    const m = await connectMongo()
    const db = m.connection.db
    if (!db) throw new Error('MongoDB connection has no db handle')

    // db.stats() may require privileges; scale=1 keeps raw bytes
    const stats = await db.stats({ scale: 1 })

    const dataSize = Number(stats.dataSize ?? 0)
    const storageSize = Number(stats.storageSize ?? 0)
    const indexSize = Number(stats.indexSize ?? 0)

    // Prefer storageSize when available (closer to real disk usage in many cases)
    const usedBytes = storageSize > 0 ? storageSize : dataSize + indexSize

    return {
      usedBytes,
      quotaBytes,
      details: [
        { label: 'Data size', value: fmtBytes(dataSize) },
        { label: 'Index size', value: fmtBytes(indexSize) },
        { label: 'Storage size', value: fmtBytes(storageSize) },
        { label: 'Collections', value: String(stats.collections ?? '—') },
      ],
      note: 'Live MongoDB stats fetched from db.stats(). Quota is configurable via MONGO_QUOTA_MB.',
      isMock: false,
    }
  } catch {
    // Fallback mock (keeps UI usable even without admin privileges)
    const usedBytes = 184 * 1024 * 1024 // 184 MB mock
    return {
      usedBytes,
      quotaBytes,
      details: [
        { label: 'Data size', value: '146 MB (mock)' },
        { label: 'Index size', value: '28 MB (mock)' },
        { label: 'Storage size', value: '184 MB (mock)' },
        { label: 'Collections', value: '—' },
      ],
      note: 'Mock mode: could not read MongoDB stats (permissions or connectivity).',
      isMock: true,
    }
  }
}

async function getCloudinaryUsage(): Promise<Usage> {
  // Mock only for now — wire later via Cloudinary Admin API.
  const quotaGB = Number(process.env.CLOUDINARY_QUOTA_GB ?? 25) // editable
  const quotaBytes = Math.max(1, quotaGB) * 1024 * 1024 * 1024

  const usedBytes = 6.8 * 1024 * 1024 * 1024 // 6.8 GB mock
  return {
    usedBytes,
    quotaBytes,
    details: [
      { label: 'Assets', value: '— (mock)' },
      { label: 'Bandwidth', value: '— (mock)' },
      { label: 'Transformations', value: '— (mock)' },
      { label: 'Last sync', value: 'Not connected' },
    ],
    note: 'Mock mode: connect Cloudinary Admin API later.',
    isMock: true,
  }
}

async function UsageCard({
  title,
  subtitle,
  usage,
}: {
  title: string
  subtitle: string
  usage: Usage
}) {
  const { t } = await getCmsI18n()
  const copy = (value: string) => t(value, thaiCopy[value] ?? value.replace('(mock)', '(ตัวอย่าง)'))
  const percent = fmtPercent(usage.usedBytes, usage.quotaBytes)
  const remaining = Math.max(0, usage.quotaBytes - usage.usedBytes)

  const warn =
    percent >= 90 ? 'bad' : percent >= 75 ? 'warn' : percent >= 0 ? 'ok' : 'ok'

  return (
    <section className={styles.card}>
      <header className={styles.cardHead}>
        <div className={styles.cardTitleRow}>
          <div className={styles.cardTitle}>{title}</div>
          {usage.isMock ? (
            <span className={styles.badge}>{t('Sample data', 'ข้อมูลตัวอย่าง')}</span>
          ) : (
            <span className={`${styles.badge} ${styles.badgeLive}`}>{t('Live', 'ข้อมูลปัจจุบัน')}</span>
          )}
        </div>
        <p className={styles.cardSub}>{subtitle}</p>
      </header>

      <div className={styles.barWrap} aria-label={t(`${title} usage`, `พื้นที่ใช้งาน ${title}`)}>
        <div
          className={`${styles.barFill} ${styles[`barFill_${warn}`]}`}
          style={{ width: `${percent}%` }}
          aria-hidden="true"
        />
      </div>

      <div className={styles.usageRow}>
        <div className={styles.usageMain}>
          <span className={styles.usageStrong}>
            {fmtBytes(usage.usedBytes)}
          </span>{' '}
          <span className={styles.usageDim}>{t('used', 'ใช้แล้ว')}</span>
          <span className={styles.usageDim}> · </span>
          <span className={styles.usageStrong}>{fmtBytes(remaining)}</span>{' '}
          <span className={styles.usageDim}>{t('left', 'คงเหลือ')}</span>
        </div>
        <div className={styles.usageRight}>
          <span className={styles.usageDim}>{t('Quota:', 'โควตา:')}</span>{' '}
          <span className={styles.usageStrong}>
            {fmtBytes(usage.quotaBytes)}
          </span>
        </div>
      </div>

      <div className={styles.statsGrid}>
        {usage.details.map((d) => (
          <div key={d.label} className={styles.stat}>
            <div className={styles.statLabel}>{copy(d.label)}</div>
            <div className={styles.statValue}>{copy(d.value)}</div>
          </div>
        ))}
      </div>

      {usage.note ? <p className={styles.hint}>{copy(usage.note)}</p> : null}
    </section>
  )
}

export default async function CloudPage() {
  const { t, formatDate } = await getCmsI18n()
  const [mongo, cloudinary] = await Promise.all([
    getMongoUsage(),
    getCloudinaryUsage(),
  ])

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerText}>
          <h1 className={styles.h1}>{t('Cloud Usage', 'การใช้พื้นที่จัดเก็บ')}</h1>
          <p className={styles.sub}>
            {t('Storage overview for MongoDB and Cloudinary. Unconnected statistics are marked as sample data.', 'ภาพรวมพื้นที่จัดเก็บ MongoDB และ Cloudinary สถิติที่ยังไม่เชื่อมต่อจะแสดงป้ายข้อมูลตัวอย่าง')}
          </p>
        </div>

        <div className={styles.meta}>
          <div className={styles.metaLabel}>{t('Last updated', 'อัปเดตล่าสุด')}</div>
          <div className={styles.metaValue}>
            {formatDate(new Date(), { dateStyle: 'medium', timeStyle: 'short' })}
          </div>
        </div>
      </header>

      <div className={styles.grid}>
        <UsageCard
          title="MongoDB"
          subtitle={t('Database storage usage', 'พื้นที่จัดเก็บฐานข้อมูล')}
          usage={mongo}
        />
        <UsageCard
          title="Cloudinary"
          subtitle={t('Media storage and delivery (sample data)', 'พื้นที่จัดเก็บและรับส่งสื่อ (ข้อมูลตัวอย่าง)')}
          usage={cloudinary}
        />
      </div>
    </div>
  )
}
