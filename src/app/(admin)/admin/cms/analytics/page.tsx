// src/app/(admin)/admin/cms/analytics/page.tsx

import { Suspense } from "react";
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/session'


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

type SP = Record<string, string | string[] | undefined>

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

  try {
    const data = await fetchAnalyticsData({
      client: ga.client,
      propertyId: ga.propertyId,
      rangeDays,
      compare,
    })

    return <AnalyticsView data={data} rangeDays={rangeDays} compare={compare} />
  } catch (err: any) {
    return <AnalyticsError msg={errMessage(err)} />
  }
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