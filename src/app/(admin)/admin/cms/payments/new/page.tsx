import PaymentCreate from '../PaymentCreate'
import { getCmsI18n } from '@/lib/cms/i18n-server'

export async function generateMetadata() {
  const { t } = await getCmsI18n()
  return { title: t('Create payment link', 'สร้างลิงก์ชำระเงิน') }
}

export default function NewPaymentPage() {
  return <PaymentCreate />
}
