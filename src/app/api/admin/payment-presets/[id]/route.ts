import { paymentAdminActor, paymentPresetApiError, paymentJson, readPaymentJson } from '@/lib/payments/admin-http'
import { updatePaymentPreset } from '@/lib/payments/presets'

export const dynamic = 'force-dynamic'
type Context = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, context: Context) {
  try {
    const actor = await paymentAdminActor(true)
    const body = await readPaymentJson(request)
    return paymentJson(await updatePaymentPreset(actor, (await context.params).id, body))
  } catch (error) { return paymentPresetApiError(error) }
}
