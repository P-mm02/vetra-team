import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/session'

export const dynamic = 'force-dynamic'

export default async function PaymentsLayout({ children }: Readonly<{ children: ReactNode }>) {
  const user = await getCurrentUser()
  if (!user) redirect('/admin/login?next=/admin/cms/payments')
  if (!['admin', 'dev'].includes(user.role)) redirect('/admin/cms')
  return children
}
