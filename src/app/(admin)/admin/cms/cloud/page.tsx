// src/app/(admin)/admin/cms/cloud/page.tsx
import styles from './page.module.css'
import { connectMongo } from '@/lib/db/mongoose'

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
  } catch (err) {
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

function UsageCard({
  title,
  subtitle,
  usage,
}: {
  title: string
  subtitle: string
  usage: Usage
}) {
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
            <span className={styles.badge}>Mock</span>
          ) : (
            <span className={`${styles.badge} ${styles.badgeLive}`}>Live</span>
          )}
        </div>
        <p className={styles.cardSub}>{subtitle}</p>
      </header>

      <div className={styles.barWrap} aria-label={`${title} usage`}>
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
          <span className={styles.usageDim}>used</span>
          <span className={styles.usageDim}> · </span>
          <span className={styles.usageStrong}>{fmtBytes(remaining)}</span>{' '}
          <span className={styles.usageDim}>left</span>
        </div>
        <div className={styles.usageRight}>
          <span className={styles.usageDim}>Quota:</span>{' '}
          <span className={styles.usageStrong}>
            {fmtBytes(usage.quotaBytes)}
          </span>
        </div>
      </div>

      <div className={styles.statsGrid}>
        {usage.details.map((d) => (
          <div key={d.label} className={styles.stat}>
            <div className={styles.statLabel}>{d.label}</div>
            <div className={styles.statValue}>{d.value}</div>
          </div>
        ))}
      </div>

      {usage.note ? <p className={styles.hint}>{usage.note}</p> : null}
    </section>
  )
}

export default async function CloudPage() {
  const [mongo, cloudinary] = await Promise.all([
    getMongoUsage(),
    getCloudinaryUsage(),
  ])

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerText}>
          <h1 className={styles.h1}>Cloud Usage</h1>
          <p className={styles.sub}>
            Storage visibility for MongoDB + Cloudinary. Safe fallbacks
            included.
          </p>
        </div>

        <div className={styles.meta}>
          <div className={styles.metaLabel}>Last updated</div>
          <div className={styles.metaValue}>
            {new Intl.DateTimeFormat('en-GB', {
              dateStyle: 'medium',
              timeStyle: 'short',
            }).format(new Date())}
          </div>
        </div>
      </header>

      <div className={styles.grid}>
        <UsageCard
          title="MongoDB"
          subtitle="Database storage usage (db.stats when available)"
          usage={mongo}
        />
        <UsageCard
          title="Cloudinary"
          subtitle="Media storage + delivery (mock for now)"
          usage={cloudinary}
        />
      </div>
    </div>
  )
}
