import { Suspense } from 'react'
import PageClient from './pageClient'

export default function Page() {
  return (
    <Suspense fallback={<main style={{ minHeight: '100vh' }} />}>
      <PageClient />
    </Suspense>
  )
}
