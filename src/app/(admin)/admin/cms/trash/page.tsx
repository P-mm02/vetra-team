import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/session'
import TrashClient from './TrashClient'

export const dynamic = 'force-dynamic'

export default async function TrashPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/admin/login?next=/admin/cms/trash')
  if (!['editor', 'admin', 'dev'].includes(user.role)) redirect('/admin/cms')
  return <TrashClient role={user.role} />
}
