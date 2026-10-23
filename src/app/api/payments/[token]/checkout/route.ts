import { z } from 'zod'
import { paymentApiError, paymentJson, readPaymentJson, requirePaymentOrigin } from '@/lib/payments/admin-http'
import { startCheckout } from '@/lib/payments/service'
import { PaymentError } from '@/lib/payments/types'

export const dynamic = 'force-dynamic'
type Context = { params: Promise<{ token: string }> }
const checkoutSchema = z.object({ locale: z.enum(['th', 'en']).default('th') }).strict()

export async function POST(request: Request, context: Context) {
  try {
    await requirePaymentOrigin()
    const parsed = checkoutSchema.safeParse(await readPaymentJson(request))
    if (!parsed.success) throw new PaymentError('Invalid checkout language.', 400, 'INVALID_REQUEST')
    return paymentJson(await startCheckout((await context.params).token, undefined, parsed.data.locale))
  } catch (error) { return paymentApiError(error) }
}
