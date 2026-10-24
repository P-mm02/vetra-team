// src/app/(admin)/admin/cms/analytics/page.tsx

import { Suspense } from "react";
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/session'
import { getCmsI18n } from '@/lib/cms/i18n-server'


import {
  canAccessCms,
  errMessage,
  fetchAnalyticsData,
  gaClientFromEnv,
  parseRangeDays,
} from './function'

import AnalyticsEmpty from './AnalyticsEmpty'
import AnalyticsError from './AnalyticsError'
import AnalyticsView from './AnalyticsView'
import Loading from './Loading'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

type SP = Record<string, string | string[] | undefined>

export async function generateMetadata() {
  const { t } = await getCmsI18n()
  return { title: t('Analytics', 'สถิติผู้เข้าชม') }
}

async function AnalyticsStream({
  measurementId,
  rangeDays,
  compare,
}: {
  measurementId: string
  rangeDays: number
  compare: boolean
}) {
  const ga = gaClientFromEnv()
  if (!ga) return <AnalyticsEmpty measurementId={measurementId} />

  const result = await fetchAnalyticsData({
      client: ga.client,
      propertyId: ga.propertyId,
      rangeDays,
      compare,
    }).then(
      (data) => ({ ok: true as const, data }),
      (error: unknown) => ({ ok: false as const, message: errMessage(error) }),
    )

  if (!result.ok) return <AnalyticsError msg={result.message} />
  return <AnalyticsView data={result.data} rangeDays={rangeDays} compare={compare} />
}

export default async function AnalyticsPage(props: {
  searchParams?: Promise<SP>
}) {
  const me = await getCurrentUser()
  if (!me) redirect(`/admin/login?next=/admin/cms/analytics`)
  if (!canAccessCms(String(me.role))) redirect('/admin/cms')

  const measurementId = process.env.NEXT_PUBLIC_GA_ID || ''

  // ✅ Next.js 16: searchParams is async
  const sp = (await props.searchParams) ?? {}

  const rangeDays = parseRangeDays(sp.range)
  const compare =
    (Array.isArray(sp.compare) ? sp.compare[0] : sp.compare) === '1'

  return (
    <Suspense fallback={<Loading />}>
      <AnalyticsStream
        measurementId={measurementId}
        rangeDays={rangeDays}
        compare={compare}
      />
    </Suspense>
  )
}
