import { paymentApiError, paymentJson, requirePaymentOrigin } from '@/lib/payments/admin-http'
import { refreshPublicPaymentRequest } from '@/lib/payments/service'

export const dynamic = 'force-dynamic'
type Context = { params: Promise<{ token: string }> }

export async function POST(_request: Request, context: Context) {
  try {
    await requirePaymentOrigin()
    return paymentJson(await refreshPublicPaymentRequest((await context.params).token))
  } catch (error) { return paymentApiError(error) }
}
