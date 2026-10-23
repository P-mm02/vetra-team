import Stripe from 'stripe'
import { getPaymentConfiguration } from '../config'
import { PaymentError, type PaymentProvider, type ProviderSession, type CreateProviderSession } from '../types'

export function stripeClient() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new PaymentError('Online payments are not configured yet.', 503, 'PAYMENT_UNAVAILABLE')
  return new Stripe(key, { maxNetworkRetries: 1, timeout: 20000 })
}

export function normalizeStripeSession(session: Stripe.Checkout.Session): ProviderSession {
  if (!session.status || !['open', 'complete', 'expired'].includes(session.status)) {
    throw new PaymentError('The payment gateway returned an invalid checkout status.', 502)
  }
  if (!['paid', 'unpaid', 'no_payment_required'].includes(session.payment_status)) {
    throw new PaymentError('The payment gateway returned an invalid payment status.', 502)
  }
  // Only Stripe's hosted Checkout origin may be used as a redirect destination.
  let checkoutUrl: string | null = null
  if (session.url) {
    const url = new URL(session.url)
    if (url.protocol !== 'https:' || url.hostname !== 'checkout.stripe.com' || url.username || url.password) {
      throw new PaymentError('The payment gateway returned an unexpected checkout URL.', 502)
    }
    checkoutUrl = url.toString()
  }
  if (session.mode !== 'payment') throw new PaymentError('The checkout mode does not match this payment request.', 409, 'PAYMENT_MISMATCH')
  return {
    id: session.id, checkoutUrl,
    status: session.status as ProviderSession['status'],
    paymentStatus: session.payment_status as ProviderSession['paymentStatus'],
    amountMinor: session.amount_total, currency: session.currency,
    orderId: session.metadata?.orderId || null, attemptId: session.metadata?.attemptId || null,
    clientReferenceId: session.client_reference_id, livemode: session.livemode,
    expiresAt: new Date(session.expires_at * 1000).toISOString(),
    paymentIntentId: typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id || null,
  }
}

export class StripePaymentProvider implements PaymentProvider {
  readonly id = 'stripe' as const
  async createSession(input: CreateProviderSession) {
    if (!getPaymentConfiguration().gateways.find(gateway => gateway.id === 'stripe')?.ready) {
      throw new PaymentError('Online payments are not available yet. Please contact VETRA.', 503, 'PAYMENT_UNAVAILABLE')
    }
    const session = await stripeClient().checkout.sessions.create({
      mode: 'payment',
      client_reference_id: input.orderId,
      metadata: { orderId: input.orderId, attemptId: input.attemptId, source: 'vetra-team-payment-request' },
      payment_intent_data: { metadata: { orderId: input.orderId, attemptId: input.attemptId, source: 'vetra-team-payment-request' } },
      customer_email: input.customerEmail || undefined,
      line_items: [{
        quantity: 1,
        price_data: {
          currency: input.currency.toLowerCase(), unit_amount: input.amountMinor,
          product_data: { name: input.title, ...(input.description ? { description: input.description } : {}) },
        },
      }],
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
      expires_at: Math.floor(Date.parse(input.expiresAt) / 1000),
      // Amounts are fixed by the stored request. No promotions, adjustments,
      // or optional items are enabled on the customer side.
      allow_promotion_codes: false,
      adaptive_pricing: { enabled: false },
      automatic_tax: { enabled: false },
      locale: 'auto',
    }, { idempotencyKey: input.idempotencyKey })
    return normalizeStripeSession(session)
  }
  async retrieveSession(id: string) { return normalizeStripeSession(await stripeClient().checkout.sessions.retrieve(id)) }
  async expireSession(id: string) { return normalizeStripeSession(await stripeClient().checkout.sessions.expire(id)) }
}

export function verifyStripeWebhook(body: string, signature: string): Stripe.Event {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) throw new PaymentError('Payment notifications are not configured.', 503, 'PAYMENT_UNAVAILABLE')
  try { return stripeClient().webhooks.constructEvent(body, signature, secret) }
  catch { throw new PaymentError('Invalid Stripe notification signature.', 400, 'INVALID_SIGNATURE') }
}
