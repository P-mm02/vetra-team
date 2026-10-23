import { paymentAdminActor, paymentApiError, paymentJson, readPaymentJson } from '@/lib/payments/admin-http'
import { cancelPaymentRequest, getAdminPaymentRequest, refreshPaymentRequest } from '@/lib/payments/service'
import { PaymentError } from '@/lib/payments/types'

export const dynamic = 'force-dynamic'
type Context = { params: Promise<{ id: string }> }

export async function GET(_request: Request, context: Context) {
  try {
    const actor = await paymentAdminActor()
    return paymentJson(await getAdminPaymentRequest(actor, (await context.params).id))
  } catch (error) { return paymentApiError(error) }
}

export async function POST(request: Request, context: Context) {
  try {
    const actor = await paymentAdminActor(true)
    const body = await readPaymentJson(request)
    const id = (await context.params).id
    if (body.action === 'refresh') return paymentJson(await refreshPaymentRequest(actor, id))
    if (body.action === 'cancel') return paymentJson(await cancelPaymentRequest(actor, id))
    throw new PaymentError('Unknown payment action.', 400, 'INVALID_ACTION')
  } catch (error) { return paymentApiError(error) }
}
