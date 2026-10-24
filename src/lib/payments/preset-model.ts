import mongoose, { Schema } from 'mongoose'
import { connectMongo } from '@/lib/db/mongoose'
import type { PaymentPresetFields } from './preset-validation'

export type PaymentPresetDoc = {
  _id: string
  createdBy: string
  updatedBy: string
  idempotencyKey: string
  payloadFingerprint: string
  name: string
  details: PaymentPresetFields
  version: number
  createdAt: Date
  updatedAt: Date
}

const detailsSchema = new Schema<PaymentPresetFields>({
  gateway: { type: String, required: true, enum: ['stripe'] },
  kind: { type: String, required: true, enum: ['service', 'product'] },
  title: { type: String, default: '', maxlength: 160 },
  description: { type: String, default: '', maxlength: 2000 },
  amount: { type: String, default: '', maxlength: 20 },
  customerName: { type: String, default: '', maxlength: 120 },
  customerEmail: { type: String, default: '', maxlength: 254 },
  reference: { type: String, default: '', maxlength: 80 },
  internalNote: { type: String, default: '', maxlength: 1000 },
  expiresInDays: { type: Number, required: true, enum: [7, 14, 30, 90] },
}, { _id: false, strict: 'throw' })

const presetSchema = new Schema<PaymentPresetDoc>({
  _id: String,
  createdBy: { type: String, required: true, immutable: true },
  updatedBy: { type: String, required: true },
  idempotencyKey: { type: String, required: true, immutable: true },
  payloadFingerprint: { type: String, required: true, immutable: true },
  name: { type: String, required: true, maxlength: 100 },
  details: { type: detailsSchema, required: true },
  version: { type: Number, required: true, default: 0, min: 0 },
}, { timestamps: true, versionKey: false, strict: 'throw', collection: 'paymentpresets' })

presetSchema.index({ createdBy: 1, idempotencyKey: 1 }, { unique: true, name: 'payment_preset_idempotency' })
presetSchema.index({ name: 1, _id: 1 }, { name: 'payment_preset_name' })

// A running dev server can retain the earlier model that required title and
// amount after hot reload. Recompile only that stale schema; saved data stays
// in MongoDB and production always starts with the current schema.
const cachedPresetModel = mongoose.models.PaymentPreset as mongoose.Model<PaymentPresetDoc> | undefined
if (process.env.NODE_ENV !== 'production' && cachedPresetModel &&
  (cachedPresetModel.schema.path('details.title')?.isRequired || cachedPresetModel.schema.path('details.amount')?.isRequired)) {
  mongoose.deleteModel('PaymentPreset')
}

export const PaymentPreset = (mongoose.models.PaymentPreset as mongoose.Model<PaymentPresetDoc>) ||
  mongoose.model<PaymentPresetDoc>('PaymentPreset', presetSchema)

let indexesReady: Promise<void> | null = null

/** Create retry safety also applies when production disables Mongoose autoIndex. */
export async function ensurePaymentPresetIndexes() {
  await connectMongo()
  if (!indexesReady) indexesReady = (async () => {
    await PaymentPreset.collection.createIndex({ createdBy: 1, idempotencyKey: 1 }, { unique: true, name: 'payment_preset_idempotency' })
    await PaymentPreset.collection.createIndex({ name: 1, _id: 1 }, { name: 'payment_preset_name' })
  })().catch((error: unknown) => { indexesReady = null; throw error })
  await indexesReady
}
