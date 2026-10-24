import { paymentAdminActor, paymentPresetApiError, paymentJson, readPaymentJson } from '@/lib/payments/admin-http'
import { createPaymentPreset, listPaymentPresets } from '@/lib/payments/presets'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const actor = await paymentAdminActor()
    return paymentJson(await listPaymentPresets(actor))
  } catch (error) { return paymentPresetApiError(error) }
}

export async function POST(request: Request) {
  try {
    const actor = await paymentAdminActor(true)
    const body = await readPaymentJson(request)
    return paymentJson(await createPaymentPreset(actor, body), 201)
  } catch (error) { return paymentPresetApiError(error) }
}
