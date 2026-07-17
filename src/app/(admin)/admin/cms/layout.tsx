// src/app/(admin)/admin/cms/layout.tsx
import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/session'
import CmsShell from './CmsShell/CmsShell'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export default async function CmsLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const user = await getCurrentUser()
  if (!user) redirect('/admin/login?next=/admin/cms')

  return <CmsShell user={user}>{children}</CmsShell>
}
