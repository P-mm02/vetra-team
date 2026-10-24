import ProjectEditor from '../_components/ProjectEditor'
import { getCmsI18n } from '@/lib/cms/i18n-server'

export async function generateMetadata() {
  const { t } = await getCmsI18n()
  return { title: t('New project', 'เพิ่มโปรเจกต์') }
}

export default function NewProjectPage() {
  return <ProjectEditor />
}
