import { paymentApiError, paymentJson } from '@/lib/payments/admin-http'
import { getPublicPaymentRequest } from '@/lib/payments/service'

export const dynamic = 'force-dynamic'
type Context = { params: Promise<{ token: string }> }

export async function GET(_request: Request, context: Context) {
  try { return paymentJson(await getPublicPaymentRequest((await context.params).token)) }
  catch (error) { return paymentApiError(error) }
}
