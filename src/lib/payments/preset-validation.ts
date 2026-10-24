import { z } from 'zod'
import { createPaymentSchema, type CreatePaymentInput } from './validation'

export type PaymentPresetFields = Omit<CreatePaymentInput, 'idempotencyKey'>

export type PaymentPresetView = {
  id: string
  name: string
  details: PaymentPresetFields
  version: number
  createdAt: string
  updatedAt: string
}

// A preset can be a partial draft; payment creation still validates title and amount.
export const paymentPresetFieldsSchema = createPaymentSchema.omit({ idempotencyKey: true }).extend({
  title: z.string().trim().max(160),
  amount: z.string().trim().max(20),
}).strict()
const presetName = z.string().trim().max(100)

export const createPaymentPresetSchema = z.object({
  idempotencyKey: z.string().uuid(),
  name: presetName,
  details: paymentPresetFieldsSchema,
}).strict()

export const updatePaymentPresetSchema = z.object({
  expectedVersion: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER - 1),
  name: presetName,
  details: paymentPresetFieldsSchema,
}).strict()
