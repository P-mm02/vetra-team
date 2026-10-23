import mongoose, { Schema } from 'mongoose'
import { connectMongo } from '@/lib/db/mongoose'
import type { PaymentMode, PaymentStatus } from './types'

export type PaymentAttemptStatus = 'creating' | 'open' | 'pending' | 'paid' | 'failed' | 'expired' | 'unknown'

export type PaymentRequestDoc = {
  _id: string
  createdBy: string
  idempotencyKey: string
  shareToken: string
  payloadFingerprint: string
  gateway: 'stripe'
  mode: PaymentMode
  kind: 'service' | 'product'
  title: string
  description: string
  amountMinor: number
  currency: 'THB'
  customerName?: string
  customerEmail?: string
  reference?: string
  internalNote?: string
  expiresAt: Date
  status: PaymentStatus
  activeAttemptId?: string | null
  paidAttemptId?: string | null
  paidAt?: Date | null
  cancelledAt?: Date | null
  operationOwner?: string | null
  operationExpiresAt?: Date | null
  version: number
  createdAt: Date
  updatedAt: Date
}

const paymentRequestSchema = new Schema<PaymentRequestDoc>({
  _id: String,
  createdBy: { type: String, required: true, immutable: true },
  idempotencyKey: { type: String, required: true, immutable: true },
  shareToken: { type: String, required: true, immutable: true },
  payloadFingerprint: { type: String, required: true, immutable: true },
  gateway: { type: String, required: true, enum: ['stripe'], immutable: true },
  mode: { type: String, required: true, enum: ['test', 'live'], immutable: true },
  kind: { type: String, required: true, enum: ['service', 'product'], immutable: true },
  title: { type: String, required: true, immutable: true },
  description: { type: String, default: '', immutable: true },
  amountMinor: { type: Number, required: true, min: 1000, max: 99999999, immutable: true },
  currency: { type: String, required: true, enum: ['THB'], default: 'THB', immutable: true },
  customerName: String,
  customerEmail: String,
  reference: String,
  internalNote: String,
  expiresAt: { type: Date, required: true },
  status: { type: String, required: true, enum: ['pending', 'processing', 'paid', 'cancelled', 'expired', 'needs_review'], default: 'pending' },
  activeAttemptId: { type: String, default: null },
  paidAttemptId: { type: String, default: null },
  paidAt: { type: Date, default: null },
  cancelledAt: { type: Date, default: null },
  operationOwner: { type: String, default: null },
  operationExpiresAt: { type: Date, default: null },
  version: { type: Number, required: true, default: 0 },
}, { timestamps: true, versionKey: false, strict: 'throw' })
paymentRequestSchema.index({ createdBy: 1, idempotencyKey: 1 }, { unique: true, name: 'payment_idempotency' })
paymentRequestSchema.index({ shareToken: 1 }, { unique: true, name: 'payment_share_token' })
paymentRequestSchema.index({ createdAt: -1 }, { name: 'payment_recent' })

export const PaymentRequest = (mongoose.models.PaymentRequest as mongoose.Model<PaymentRequestDoc>) || mongoose.model<PaymentRequestDoc>('PaymentRequest', paymentRequestSchema)

export type PaymentAttemptDoc = {
  _id: string
  requestId: string
  gateway: 'stripe'
  status: PaymentAttemptStatus
  providerIdempotencyKey: string
  checkoutExpiresAt: Date
  successUrl: string
  cancelUrl: string
  providerSessionId?: string | null
  providerUrl?: string | null
  providerExpiresAt?: Date | null
  providerPaymentIntentId?: string | null
  livemode?: boolean | null
  lastCheckedAt?: Date | null
  createLeaseUntil?: Date | null
  failureCode?: string | null
  lastEventId?: string | null
  lastEventType?: string | null
  createdAt: Date
  updatedAt: Date
}

const paymentAttemptSchema = new Schema<PaymentAttemptDoc>({
  _id: String,
  requestId: { type: String, required: true },
  gateway: { type: String, required: true, enum: ['stripe'] },
  status: { type: String, required: true, enum: ['creating', 'open', 'pending', 'paid', 'failed', 'expired', 'unknown'] },
  providerIdempotencyKey: { type: String, required: true },
  checkoutExpiresAt: { type: Date, required: true },
  successUrl: { type: String, required: true },
  cancelUrl: { type: String, required: true },
  providerSessionId: { type: String, default: null },
  providerUrl: { type: String, default: null },
  providerExpiresAt: { type: Date, default: null },
  providerPaymentIntentId: { type: String, default: null },
  livemode: { type: Boolean, default: null },
  lastCheckedAt: { type: Date, default: null },
  createLeaseUntil: { type: Date, default: null },
  failureCode: { type: String, default: null },
  lastEventId: { type: String, default: null },
  lastEventType: { type: String, default: null },
}, { timestamps: true, versionKey: false, strict: 'throw' })
paymentAttemptSchema.index({ requestId: 1, createdAt: -1 }, { name: 'payment_attempt_request' })
paymentAttemptSchema.index({ providerSessionId: 1 }, { unique: true, name: 'payment_provider_session', partialFilterExpression: { providerSessionId: { $type: 'string' } } })
paymentAttemptSchema.index({ providerIdempotencyKey: 1 }, { unique: true, name: 'payment_provider_idempotency' })

export const PaymentAttempt = (mongoose.models.PaymentAttempt as mongoose.Model<PaymentAttemptDoc>) || mongoose.model<PaymentAttemptDoc>('PaymentAttempt', paymentAttemptSchema)

let indexesReady: Promise<void> | null = null

/** Financial uniqueness constraints must exist even with production autoIndex disabled. */
export async function ensurePaymentIndexes() {
  await connectMongo()
  if (!indexesReady) indexesReady = (async () => {
    await PaymentRequest.collection.createIndex({ createdBy: 1, idempotencyKey: 1 }, { unique: true, name: 'payment_idempotency' })
    await PaymentRequest.collection.createIndex({ shareToken: 1 }, { unique: true, name: 'payment_share_token' })
    await PaymentAttempt.collection.createIndex({ providerIdempotencyKey: 1 }, { unique: true, name: 'payment_provider_idempotency' })
    await PaymentAttempt.collection.createIndex({ providerSessionId: 1 }, { unique: true, name: 'payment_provider_session', partialFilterExpression: { providerSessionId: { $type: 'string' } } })
  })().catch((error: unknown) => { indexesReady = null; throw error })
  await indexesReady
}
