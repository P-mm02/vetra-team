import PaymentDetail from '../PaymentDetail'
import { getCmsI18n } from '@/lib/cms/i18n-server'

export async function generateMetadata() {
  const { t } = await getCmsI18n()
  return { title: t('Payment details', 'รายละเอียดการชำระเงิน') }
}

export default async function PaymentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <PaymentDetail id={id} />
}
