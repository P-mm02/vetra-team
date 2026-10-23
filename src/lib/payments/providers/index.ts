import { StripePaymentProvider } from './stripe'
import { PaymentError, type PaymentGatewayId, type PaymentProvider } from '../types'

export function getPaymentProvider(gateway: PaymentGatewayId): PaymentProvider {
  if (gateway === 'stripe') return new StripePaymentProvider()
  throw new PaymentError('This payment gateway is not available yet.', 503, 'PAYMENT_UNAVAILABLE')
}
