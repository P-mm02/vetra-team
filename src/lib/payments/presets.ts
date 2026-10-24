import crypto from 'node:crypto'
import mongoose from 'mongoose'
import { connectMongo } from '@/lib/db/mongoose'
import { User } from '@/models/User/User'
import { PaymentPreset, ensurePaymentPresetIndexes, type PaymentPresetDoc } from './preset-model'
import { createPaymentPresetSchema, updatePaymentPresetSchema, type PaymentPresetFields, type PaymentPresetView } from './preset-validation'
import type { PaymentActor } from './service'
import { PaymentError } from './types'
import { parsePaymentAmount, paymentIdSchema } from './validation'

async function requireAdmin(actor: PaymentActor) {
  if (!mongoose.isValidObjectId(actor.id) || !['dev', 'admin'].includes(actor.role)) {
    throw new PaymentError('You do not have permission to manage payments.', 403, 'PAYMENT_FORBIDDEN')
  }
  await connectMongo()
  const active = await User.findOne({ _id: actor.id, isActive: true, deletedAt: null })
    .select({ role: 1 }).lean<{ role?: string } | null>()
  if (!active || !['dev', 'admin'].includes(String(active.role))) {
    throw new PaymentError('You do not have permission to manage payments.', 403, 'PAYMENT_FORBIDDEN')
  }
}

function notFound() { return new PaymentError('This saved payment was not found.', 404, 'PAYMENT_PRESET_NOT_FOUND') }
function conflict() { return new PaymentError('This saved payment changed. Reload and use its latest details before updating, or save your form as new.', 409, 'PAYMENT_PRESET_CONFLICT') }

function toView(preset: PaymentPresetDoc): PaymentPresetView {
  // Explicitly return editable fields only; creation keys and audit identities stay private.
  const details = preset.details
  return {
    id: preset._id, name: preset.name, version: preset.version,
    details: {
      gateway: details.gateway, kind: details.kind, title: details.title, description: details.description,
      amount: details.amount, customerName: details.customerName, customerEmail: details.customerEmail,
      reference: details.reference, internalNote: details.internalNote, expiresInDays: details.expiresInDays,
    },
    createdAt: preset.createdAt.toISOString(), updatedAt: preset.updatedAt.toISOString(),
  }
}

function fingerprint(name: string, details: PaymentPresetFields, amountMinor: number | null) {
  return crypto.createHash('sha256').update(JSON.stringify({ name, details: { ...details, amount: amountMinor } })).digest('hex')
}

function replay(preset: PaymentPresetDoc, expectedFingerprint: string) {
  // The original create fingerprint is immutable even when an administrator edits the preset later.
  if (preset.payloadFingerprint !== expectedFingerprint) {
    throw new PaymentError('This save request was already used with different details.', 409, 'IDEMPOTENCY_CONFLICT')
  }
  return { preset: toView(preset) }
}

export async function listPaymentPresets(actor: PaymentActor): Promise<{ presets: PaymentPresetView[] }> {
  await requireAdmin(actor)
  const presets = await PaymentPreset.find({}).sort({ name: 1, _id: 1 }).lean<PaymentPresetDoc[]>()
  return { presets: presets.map(toView) }
}

export async function createPaymentPreset(actor: PaymentActor, rawInput: unknown): Promise<{ preset: PaymentPresetView }> {
  await requireAdmin(actor)
  const parsed = createPaymentPresetSchema.safeParse(rawInput)
  if (!parsed.success) throw new PaymentError('Check the saved payment name and fields and try again.', 400, 'INVALID_PAYMENT_PRESET')
  const input = parsed.data
  const amountMinor = input.details.amount ? parsePaymentAmount(input.details.amount) : null
  await ensurePaymentPresetIndexes()
  const payloadFingerprint = fingerprint(input.name, input.details, amountMinor)
  const key = { createdBy: actor.id, idempotencyKey: input.idempotencyKey }
  const existing = await PaymentPreset.findOne(key).lean<PaymentPresetDoc | null>()
  if (existing) return replay(existing, payloadFingerprint)
  try {
    const id = crypto.randomUUID()
    const created = await PaymentPreset.create({
      _id: id, ...key, updatedBy: actor.id, payloadFingerprint,
      name: input.name || `Preset ${id.slice(0, 8)}`, details: input.details,
    })
    return { preset: toView(created.toObject()) }
  } catch (error) {
    if ((error as { code?: number })?.code !== 11000) throw error
    const winner = await PaymentPreset.findOne(key).lean<PaymentPresetDoc | null>()
    if (!winner) throw new PaymentError('The saved payment could not be confirmed. Retry this same save.', 503, 'PAYMENT_PRESET_UNCERTAIN')
    return replay(winner, payloadFingerprint)
  }
}

export async function updatePaymentPreset(actor: PaymentActor, id: string, rawInput: unknown): Promise<{ preset: PaymentPresetView }> {
  await requireAdmin(actor)
  if (!paymentIdSchema.safeParse(id).success) throw notFound()
  const parsed = updatePaymentPresetSchema.safeParse(rawInput)
  if (!parsed.success) throw new PaymentError('Check the saved payment name and fields and try again.', 400, 'INVALID_PAYMENT_PRESET')
  const input = parsed.data
  if (input.details.amount) parsePaymentAmount(input.details.amount)
  const updated = await PaymentPreset.findOneAndUpdate(
    { _id: id, version: input.expectedVersion },
    { $set: { ...(input.name ? { name: input.name } : {}), details: input.details, updatedBy: actor.id }, $inc: { version: 1 } },
    { returnDocument: 'after', runValidators: true },
  ).lean<PaymentPresetDoc | null>()
  if (updated) return { preset: toView(updated) }
  if (!await PaymentPreset.exists({ _id: id })) throw notFound()
  throw conflict()
}
