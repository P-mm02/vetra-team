import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/session'
import TrashClient from './TrashClient'
import { getCmsI18n } from '@/lib/cms/i18n-server'

export async function generateMetadata() {
  const { t } = await getCmsI18n()
  return { title: t('Trash', 'ถังขยะ') }
}

export const dynamic = 'force-dynamic'

export default async function TrashPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/admin/login?next=/admin/cms/trash')
  if (!['editor', 'admin', 'dev'].includes(user.role)) redirect('/admin/cms')
  return <TrashClient role={user.role} />
}
