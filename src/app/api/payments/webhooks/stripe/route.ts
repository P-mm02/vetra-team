import { NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { StripePaymentProvider, verifyStripeWebhook } from '@/lib/payments/providers/stripe'
import { reconcileProviderSession } from '@/lib/payments/service'
import { PaymentError } from '@/lib/payments/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
const events = new Set(['checkout.session.completed', 'checkout.session.async_payment_succeeded', 'checkout.session.async_payment_failed', 'checkout.session.expired'])

async function rawBody(req: Request) {
  const max = 1024 * 1024
  if (Number(req.headers.get('content-length') || 0) > max) throw new PaymentError('Notification is too large.', 413)
  const reader = req.body?.getReader()
  if (!reader) throw new PaymentError('Missing notification body.')
  const chunks: Uint8Array[] = []
  let size = 0
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > max) { await reader.cancel(); throw new PaymentError('Notification is too large.', 413) }
      chunks.push(value)
    }
  } finally { reader.releaseLock() }
  return Buffer.concat(chunks).toString('utf8')
}

export async function POST(req: Request) {
  try {
    const signature = req.headers.get('stripe-signature')
    if (!signature) throw new PaymentError('Missing Stripe notification signature.')
    const event = verifyStripeWebhook(await rawBody(req), signature)
    if (!events.has(event.type)) return NextResponse.json({ received: true, ignored: true })
    const session = event.data.object as Stripe.Checkout.Session
    // The Stripe account may also serve other applications.
    if (session.metadata?.source !== 'vetra-team-payment-request') return NextResponse.json({ received: true, ignored: true })
    const current = await new StripePaymentProvider().retrieveSession(session.id)
    await reconcileProviderSession(current, { eventId: event.id, eventType: event.type })
    return NextResponse.json({ received: true })
  } catch (error) {
    if (error instanceof PaymentError) return NextResponse.json({ error: error.message, code: error.code }, { status: error.status })
    console.error('Payment notification could not be processed:', error instanceof Error ? error.name : 'Unknown error')
    // A database outage must cause Stripe to retry the notification.
    return NextResponse.json({ error: 'Notification could not be processed. Please retry.' }, { status: 503 })
  }
}
