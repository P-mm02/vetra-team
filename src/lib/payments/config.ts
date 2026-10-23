import type { PaymentConfiguration, PaymentMode } from './types'
import { MIN_AMOUNT_MINOR, MAX_AMOUNT_MINOR } from './validation'

export function getPaymentMode(): PaymentMode { return process.env.STRIPE_MODE === 'live' ? 'live' : 'test' }

export function getPaymentSiteUrl(): string | null {
  try {
    const url = new URL(process.env.NEXT_PUBLIC_SITE_URL || '')
    const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
    if (url.username || url.password || url.search || url.hash || url.pathname !== '/') return null
    if (url.protocol !== 'https:' && !(local && url.protocol === 'http:')) return null
    return url.origin
  } catch { return null }
}

export function getPaymentConfiguration(): PaymentConfiguration {
  const mode = getPaymentMode()
  const siteUrl = getPaymentSiteUrl()
  const configurationIssues: string[] = []
  if (process.env.PAYMENTS_ENABLED !== 'true') configurationIssues.push('Enable payments with PAYMENTS_ENABLED=true when setup is complete.')
  if (process.env.STRIPE_MODE && !['test', 'live'].includes(process.env.STRIPE_MODE)) configurationIssues.push('STRIPE_MODE must be test or live.')
  if (!process.env.STRIPE_SECRET_KEY?.startsWith(`sk_${mode}_`)) configurationIssues.push(`Add a Stripe ${mode} secret key in STRIPE_SECRET_KEY.`)
  if (!process.env.STRIPE_WEBHOOK_SECRET?.startsWith('whsec_')) configurationIssues.push('Add the endpoint signing secret in STRIPE_WEBHOOK_SECRET.')
  if (!siteUrl) configurationIssues.push('Set NEXT_PUBLIC_SITE_URL to this website’s origin, without a path.')
  const linksShareable = !!siteUrl && !['localhost', '127.0.0.1', '[::1]'].includes(new URL(siteUrl).hostname)
  if (mode === 'live') {
    if (!linksShareable || !siteUrl?.startsWith('https:')) configurationIssues.push('Live payments need a public HTTPS website URL.')
    if (process.env.NODE_ENV !== 'production' || (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== 'production')) {
      configurationIssues.push('Live payments are available only in a production deployment. Use Stripe test mode here.')
    }
  }
  return {
    gateways: [
      { id: 'stripe', name: 'Stripe', description: 'Secure hosted checkout for one-time payments.', implemented: true, ready: configurationIssues.length === 0 },
      { id: 'ipay', name: 'Bangkok Bank Merchant iPay', description: 'Available after merchant approval and integration.', implemented: false, ready: false },
    ],
    currency: 'THB', minimumAmountMinor: MIN_AMOUNT_MINOR, maximumAmountMinor: MAX_AMOUNT_MINOR,
    mode, siteUrl, linksShareable, configurationIssues,
  }
}
