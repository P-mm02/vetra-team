import { Suspense } from 'react'
import PageClient from './pageClient'
import { getCmsI18n } from '@/lib/cms/i18n-server'

export async function generateMetadata() {
  const { t } = await getCmsI18n()
  return { title: t('Sign in', 'เข้าสู่ระบบ') }
}

export default function Page() {
  return (
    <Suspense fallback={<main style={{ minHeight: '100vh' }} />}>
      <PageClient />
    </Suspense>
  )
}
