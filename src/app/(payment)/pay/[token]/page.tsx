import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { paymentTokenPattern } from '@/lib/payments/validation'
import PaymentCheckout from './PaymentCheckout'

export const dynamic = 'force-dynamic'
type Props = { params: Promise<{ token: string }>; searchParams: Promise<{ lang?: string; checkout?: string }> }
export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { lang } = await searchParams
  return { title: lang === 'en' ? 'Secure payment | VETRA' : 'ชำระเงิน | VETRA' }
}
export default async function PaymentPage({ params, searchParams }: Props) {
  const [{ token }, query] = await Promise.all([params, searchParams])
  if (!paymentTokenPattern.test(token)) notFound()
  return <PaymentCheckout token={token} locale={query.lang === 'en' ? 'en' : 'th'} returned={query.checkout === 'returned'} />
}
