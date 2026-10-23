import { z } from 'zod'
import { PaymentError } from './types'

export const MIN_AMOUNT_MINOR = 1000
export const MAX_AMOUNT_MINOR = 99999999

/** Parse decimal baht without floating point rounding or exponent notation. */
export function parsePaymentAmount(value: string): number {
  const amount = value.trim()
  if (!/^\d{1,6}(\.\d{1,2})?$/.test(amount)) throw new PaymentError('Enter a THB amount with up to two decimal places.')
  const [whole, fraction = ''] = amount.split('.')
  const minor = Number(whole) * 100 + Number(fraction.padEnd(2, '0'))
  if (!Number.isSafeInteger(minor) || minor < MIN_AMOUNT_MINOR || minor > MAX_AMOUNT_MINOR) {
    throw new PaymentError('The payment amount must be between ฿10.00 and ฿999,999.99.')
  }
  return minor
}

const optionalText = (max: number) => z.string().trim().max(max).optional().default('')
export const createPaymentSchema = z.object({
  idempotencyKey: z.string().uuid(),
  gateway: z.literal('stripe'),
  kind: z.enum(['service', 'product']),
  title: z.string().trim().min(1).max(160),
  description: optionalText(2000),
  amount: z.string().max(20),
  customerName: optionalText(120),
  customerEmail: optionalText(254).refine(value => !value || z.email().safeParse(value).success, 'Enter a valid customer email.'),
  reference: optionalText(80),
  internalNote: optionalText(1000),
  expiresInDays: z.union([z.literal(7), z.literal(14), z.literal(30), z.literal(90)]).default(30),
}).strict()
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>
export const paymentTokenPattern = /^[A-Za-z0-9_-]{43}$/
export const paymentIdSchema = z.string().uuid()
