import type { ReactNode } from 'react'
import { getCmsI18n } from '@/lib/cms/i18n-server'

export async function generateMetadata() {
  const { t } = await getCmsI18n()
  return { title: { default: t('Projects', 'โปรเจกต์'), template: t('%s • Admin • VETRA', '%s • ระบบจัดการ • VETRA') } }
}

export default function ProjectsLayout({ children }: { children: ReactNode }) {
  return children
}
