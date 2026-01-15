// src/app/(admin)/cms/layout.tsx
import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/session'
import CmsShell from './CmsShell/CmsShell'

export default async function CmsLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const user = await getCurrentUser()
  if (!user) redirect('/login?next=/cms')

  return <CmsShell user={user}>{children}</CmsShell>
}
