import PaymentDetail from '../PaymentDetail'

export default async function PaymentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <PaymentDetail id={id} />
}
