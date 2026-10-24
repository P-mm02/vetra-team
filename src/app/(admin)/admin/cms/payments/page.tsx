import PaymentsClient from './PaymentsClient'
import { getCmsI18n } from '@/lib/cms/i18n-server'

export async function generateMetadata() {
  const { t } = await getCmsI18n()
  return { title: t('Payment links', 'ลิงก์ชำระเงิน') }
}

export default function PaymentsPage() {
  return <PaymentsClient />
}
