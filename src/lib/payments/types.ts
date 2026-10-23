export type PaymentGatewayId = 'stripe' | 'ipay'
export type PaymentKind = 'service' | 'product'
export type PaymentMode = 'test' | 'live'
export type PaymentStatus = 'pending' | 'processing' | 'paid' | 'cancelled' | 'expired' | 'needs_review'

export type GatewayOption = {
  id: PaymentGatewayId
  name: string
  description: string
  implemented: boolean
  ready: boolean
}

export type PaymentConfiguration = {
  gateways: GatewayOption[]
  currency: 'THB'
  minimumAmountMinor: number
  maximumAmountMinor: number
  mode: PaymentMode
  siteUrl: string | null
  linksShareable: boolean
  configurationIssues: string[]
}

export type PaymentView = {
  id: string
  gateway: PaymentGatewayId
  kind: PaymentKind
  title: string
  description: string
  amountMinor: number
  currency: 'THB'
  mode: PaymentMode
  status: PaymentStatus
  customerName: string
  customerEmail: string
  reference: string
  internalNote: string
  createdAt: string
  updatedAt: string
  expiresAt: string
  paidAt: string | null
  shareUrl: string | null
  canCancel: boolean
}

export type PublicPaymentView = Pick<PaymentView,
  'id' | 'gateway' | 'kind' | 'title' | 'description' | 'amountMinor' | 'currency' | 'mode' |
  'status' | 'reference' | 'expiresAt' | 'paidAt'> & {
  gatewayReady: boolean
  canPay: boolean
}

export type PaymentListResponse = {
  payments: PaymentView[]
  configuration: PaymentConfiguration
  total: number
  page: number
  pageSize: number
}
export type PaymentDetailResponse = { payment: PaymentView; configuration: PaymentConfiguration }
export type PublicPaymentResponse = { payment: PublicPaymentView }

export type ProviderSession = {
  id: string
  checkoutUrl: string | null
  status: 'open' | 'complete' | 'expired'
  paymentStatus: 'paid' | 'unpaid' | 'no_payment_required'
  amountMinor: number | null
  currency: string | null
  orderId: string | null
  attemptId: string | null
  clientReferenceId: string | null
  livemode: boolean
  expiresAt: string
  paymentIntentId: string | null
}

export type CreateProviderSession = {
  orderId: string
  attemptId: string
  amountMinor: number
  currency: 'THB'
  title: string
  description: string
  customerEmail?: string
  successUrl: string
  cancelUrl: string
  /** Stable per attempt, including when a response is lost. */
  expiresAt: string
  idempotencyKey: string
}

export interface PaymentProvider {
  id: PaymentGatewayId
  createSession(input: CreateProviderSession): Promise<ProviderSession>
  retrieveSession(id: string): Promise<ProviderSession>
  expireSession(id: string): Promise<ProviderSession>
}

export class PaymentError extends Error {
  constructor(message: string, public status = 400, public code = 'PAYMENT_ERROR') { super(message) }
}

export function formatPaymentAmount(amountMinor: number, locale = 'en-GB') {
  return new Intl.NumberFormat(locale, { style: 'currency', currency: 'THB', minimumFractionDigits: 2 }).format(amountMinor / 100)
}
