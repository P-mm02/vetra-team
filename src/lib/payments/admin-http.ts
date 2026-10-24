import { NextResponse } from 'next/server'
import { assertSameOriginStrict, getCurrentUser } from '@/lib/auth/session'
import { PaymentError } from './types'

const privateHeaders = {
  'Cache-Control': 'private, no-store, max-age=0',
  'Referrer-Policy': 'no-referrer',
  'X-Robots-Tag': 'noindex, nofollow',
}

export function paymentJson(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: privateHeaders })
}

export function paymentApiError(error: unknown) {
  if (error instanceof PaymentError) return paymentJson({ error: error.message, code: error.code }, error.status)
  console.error('Payment operation failed:', error instanceof Error ? error.name : 'Unknown error')
  return paymentJson({ error: 'The payment service could not confirm this operation. Refresh its status before trying again.', code: 'PAYMENT_UNCERTAIN' }, 503)
}

export function paymentPresetApiError(error: unknown) {
  if (error instanceof PaymentError) return paymentApiError(error)
  console.error('Payment preset operation failed:', error instanceof Error ? error.name : 'Unknown error')
  return paymentJson({ error: 'The saved payment could not be confirmed. Retry this same save.', code: 'PAYMENT_PRESET_UNCERTAIN' }, 503)
}

export async function readPaymentJson(request: Request) {
  if (Number(request.headers.get('content-length') || 0) > 15000) throw new PaymentError('The request is too large.', 413, 'INVALID_REQUEST')
  const text = await request.text()
  if (text.length > 15000) throw new PaymentError('The request is too large.', 413, 'INVALID_REQUEST')
  let parsed: unknown
  try { parsed = JSON.parse(text) }
  catch { throw new PaymentError('Invalid request body.', 400, 'INVALID_REQUEST') }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new PaymentError('Invalid request body.', 400, 'INVALID_REQUEST')
  return parsed as Record<string, unknown>
}

export async function requirePaymentOrigin() {
  await assertSameOriginStrict().catch(() => { throw new PaymentError('This request must come from this website.', 403, 'BAD_ORIGIN') })
}

export async function paymentAdminActor(write = false) {
  if (write) await requirePaymentOrigin()
  const actor = await getCurrentUser()
  if (!actor) throw new PaymentError('Please sign in again.', 401, 'SIGN_IN_REQUIRED')
  if (!['dev', 'admin'].includes(actor.role)) throw new PaymentError('You do not have permission to manage payments.', 403, 'PAYMENT_FORBIDDEN')
  return actor
}
