import ProjectEditor from '../_components/ProjectEditor'
import { getCmsI18n } from '@/lib/cms/i18n-server'

export async function generateMetadata() {
  const { t } = await getCmsI18n()
  return { title: t('Edit project', 'แก้ไขโปรเจกต์') }
}

export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <ProjectEditor id={id} />
}
