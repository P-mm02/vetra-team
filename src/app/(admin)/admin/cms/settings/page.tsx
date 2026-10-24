import { getCmsI18n } from '@/lib/cms/i18n-server'

export default async function Page() {
  const { t } = await getCmsI18n()
  return <div>{t('Analytics', 'สถิติการเข้าชม')}</div>
}
