// src/app/(admin)/admin/cms/analytics/function.ts

import { BetaAnalyticsDataClient } from '@google-analytics/data'

export function canAccessCms(role: string) {
  return role === 'dev' || role === 'admin'
}

const ALLOWED_RANGES = [7, 28, 90, 365] as const
export type AllowedRangeDays = (typeof ALLOWED_RANGES)[number]

export function parseRangeDays(v: unknown): AllowedRangeDays {
  const raw = Array.isArray(v) ? v[0] : v
  const n = Number(raw)
  return (ALLOWED_RANGES as readonly number[]).includes(n) ? (n as any) : 28
}

/**
 * Timezone used to compute "today/yesterday" boundaries for dateRanges.
 * GA4 reports are based on the GA4 Property timezone, so set this to match
 * your property (Thailand example: Asia/Bangkok).
 *
 * Optional env:
 *   GA_TZ=Asia/Bangkok
 */
const GA_TZ = process.env.GA_TZ || 'Asia/Bangkok'

function isoDateInTz(date: Date, timeZone: string) {
  // returns YYYY-MM-DD in that timezone (no time)
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)

  const y = parts.find((p) => p.type === 'year')?.value ?? '1970'
  const m = parts.find((p) => p.type === 'month')?.value ?? '01'
  const d = parts.find((p) => p.type === 'day')?.value ?? '01'
  return `${y}-${m}-${d}`
}

function addDaysIso(iso: string, deltaDays: number) {
  // iso = YYYY-MM-DD (treat as UTC day math to avoid local TZ surprises)
  const dt = new Date(`${iso}T00:00:00.000Z`)
  dt.setUTCDate(dt.getUTCDate() + deltaDays)
  return dt.toISOString().slice(0, 10)
}

/**
 * Build an explicit range ending yesterday in GA_TZ (GA standard reports can lag today).
 * Range is inclusive: start..end.
 */
export function startEndForRangeDays(rangeDays: number) {
  const todayIso = isoDateInTz(new Date(), GA_TZ)
  const endDate = todayIso
  const startDate = addDaysIso(endDate, -(rangeDays - 1))
  return { startDate, endDate }
}

/**
 * Previous period of equal length, immediately before current start.
 */
export function prevPeriodFrom(startDate: string, endDate: string) {
  const start = new Date(`${startDate}T00:00:00.000Z`)
  const end = new Date(`${endDate}T00:00:00.000Z`)

  const msDay = 1000 * 60 * 60 * 24
  const days = Math.round((end.getTime() - start.getTime()) / msDay) + 1

  const prevEndDate = addDaysIso(startDate, -1)
  const prevStartDate = addDaysIso(prevEndDate, -(days - 1))

  return {
    prevStartDate,
    prevEndDate,
    days,
  }
}

export function safeNumber(v: any) {
  const n = Number(v ?? 0)
  return Number.isFinite(n) ? n : 0
}

export function safePercent01(v: any) {
  const n = safeNumber(v) // 0..1
  return `${(n * 100).toFixed(1)}%`
}

function pctDelta(curr: number, prev: number) {
  if (!Number.isFinite(prev) || prev <= 0) return null
  return ((curr - prev) / prev) * 100
}

function fmtSignedPct(v: number | null) {
  if (v === null) return '—'
  const sign = v > 0 ? '+' : ''
  return `${sign}${v.toFixed(1)}%`
}

function fmtSignedPts(v: number | null) {
  if (v === null) return '—'
  const sign = v > 0 ? '+' : ''
  return `${sign}${v.toFixed(1)} pts`
}

export function errMessage(err: any) {
  return (
    err?.message ||
    err?.details ||
    'Unknown GA4 Data API error. Check service account + property access.'
  )
}

export function gaClientFromEnv() {
  const propertyId = process.env.GA4_PROPERTY_ID
  const clientEmail = process.env.GA4_CLIENT_EMAIL
  const privateKeyRaw = process.env.GA4_PRIVATE_KEY

  if (!propertyId || !clientEmail || !privateKeyRaw) return null

  // Vercel env keeps newlines as \n
  const privateKey = privateKeyRaw.replace(/\\n/g, '\n')

  const client = new BetaAnalyticsDataClient({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey,
    },
  })

  return { client, propertyId }
}

export type AnalyticsRow = {
  path: string
  views: number
  sessions: number
  users: number
  // compare (optional)
  prevViews?: number
  viewsDeltaPct?: string
}

export type AnalyticsData = {
  startDate: string
  endDate: string
  activeUsers: number
  totalUsers: number
  sessions: number
  pageViews: number
  engagementRate: string

  // compare (optional)
  compareStartDate?: string
  compareEndDate?: string
  deltaTotalUsersPct?: string
  deltaSessionsPct?: string
  deltaPageViewsPct?: string
  deltaEngagementPts?: string

  rows: AnalyticsRow[]
}

export async function fetchAnalyticsData(params: {
  client: BetaAnalyticsDataClient
  propertyId: string
  rangeDays?: number
  compare?: boolean
}): Promise<AnalyticsData> {
  const { client, propertyId, rangeDays = 28, compare = false } = params

  const { startDate, endDate } = startEndForRangeDays(rangeDays)

  // ✅ Realtime (not compared)
  const [rtRes] = await client.runRealtimeReport({
    property: `properties/${propertyId}`,
    metrics: [{ name: 'activeUsers' }],
  })
  const activeUsers = safeNumber(rtRes.rows?.[0]?.metricValues?.[0]?.value)

  // Current summary
  const [summaryRes] = await client.runReport({
    property: `properties/${propertyId}`,
    dateRanges: [{ startDate, endDate }],
    metrics: [
      { name: 'totalUsers' },
      { name: 'sessions' },
      { name: 'screenPageViews' },
      { name: 'engagementRate' },
    ],
  })

  const m = summaryRes.rows?.[0]?.metricValues ?? []
  const totalUsers = safeNumber(m[0]?.value)
  const sessions = safeNumber(m[1]?.value)
  const pageViews = safeNumber(m[2]?.value)
  const engagement01 = safeNumber(m[3]?.value)
  const engagementRate = safePercent01(engagement01)

  // Current top pages
  const [pagesRes] = await client.runReport({
    property: `properties/${propertyId}`,
    dateRanges: [{ startDate, endDate }],
    dimensions: [{ name: 'pagePath' }],
    metrics: [
      { name: 'screenPageViews' },
      { name: 'sessions' },
      { name: 'totalUsers' },
    ],
    orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
    limit: 25,
  })

  let rows: AnalyticsRow[] =
    pagesRes.rows?.map((r) => ({
      path: r.dimensionValues?.[0]?.value || '—',
      views: safeNumber(r.metricValues?.[0]?.value),
      sessions: safeNumber(r.metricValues?.[1]?.value),
      users: safeNumber(r.metricValues?.[2]?.value),
    })) ?? []

  // Compare (previous period)
  let compareStartDate: string | undefined
  let compareEndDate: string | undefined
  let deltaTotalUsersPct: string | undefined
  let deltaSessionsPct: string | undefined
  let deltaPageViewsPct: string | undefined
  let deltaEngagementPts: string | undefined

  if (compare) {
    const prev = prevPeriodFrom(startDate, endDate)
    compareStartDate = prev.prevStartDate
    compareEndDate = prev.prevEndDate

    const [prevSummaryRes] = await client.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [
        { startDate: prev.prevStartDate, endDate: prev.prevEndDate },
      ],
      metrics: [
        { name: 'totalUsers' },
        { name: 'sessions' },
        { name: 'screenPageViews' },
        { name: 'engagementRate' },
      ],
    })

    const pm = prevSummaryRes.rows?.[0]?.metricValues ?? []
    const pTotalUsers = safeNumber(pm[0]?.value)
    const pSessions = safeNumber(pm[1]?.value)
    const pPageViews = safeNumber(pm[2]?.value)
    const pEng01 = safeNumber(pm[3]?.value)

    deltaTotalUsersPct = fmtSignedPct(pctDelta(totalUsers, pTotalUsers))
    deltaSessionsPct = fmtSignedPct(pctDelta(sessions, pSessions))
    deltaPageViewsPct = fmtSignedPct(pctDelta(pageViews, pPageViews))
    // engagement: show percentage-points delta
    deltaEngagementPts = fmtSignedPts((engagement01 - pEng01) * 100)

    // Compare top pages (views only, mapped by path)
    const [prevPagesRes] = await client.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [
        { startDate: prev.prevStartDate, endDate: prev.prevEndDate },
      ],
      dimensions: [{ name: 'pagePath' }],
      metrics: [{ name: 'screenPageViews' }],
      orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
      limit: 200, // larger to increase match chance
    })

    const prevMap = new Map<string, number>()
    for (const r of prevPagesRes.rows ?? []) {
      const path = r.dimensionValues?.[0]?.value || ''
      const v = safeNumber(r.metricValues?.[0]?.value)
      if (path) prevMap.set(path, v)
    }

    rows = rows.map((r) => {
      const pv = prevMap.get(r.path) ?? 0
      const d = pctDelta(r.views, pv)
      return {
        ...r,
        prevViews: pv,
        viewsDeltaPct: fmtSignedPct(d),
      }
    })
  }

  return {
    startDate,
    endDate,
    activeUsers,
    totalUsers,
    sessions,
    pageViews,
    engagementRate,

    compareStartDate,
    compareEndDate,
    deltaTotalUsersPct,
    deltaSessionsPct,
    deltaPageViewsPct,
    deltaEngagementPts,

    rows,
  }
}
