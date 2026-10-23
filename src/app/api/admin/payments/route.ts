import { NextRequest } from 'next/server'
import { paymentAdminActor, paymentApiError, paymentJson, readPaymentJson } from '@/lib/payments/admin-http'
import { createPaymentRequest, getPaymentRequestByIdempotencyKey, listPaymentRequests } from '@/lib/payments/service'
import { PaymentError, type PaymentStatus } from '@/lib/payments/types'

export const dynamic = 'force-dynamic'
const statuses: PaymentStatus[] = ['pending', 'processing', 'paid', 'cancelled', 'expired', 'needs_review']

export async function GET(request: NextRequest) {
  try {
    const actor = await paymentAdminActor()
    const key = request.nextUrl.searchParams.get('idempotencyKey')
    if (key !== null) return paymentJson(await getPaymentRequestByIdempotencyKey(actor, key))
    const q = request.nextUrl.searchParams.get('q') || ''
    const statusRaw = request.nextUrl.searchParams.get('status') || ''
    if (statusRaw && !statuses.includes(statusRaw as PaymentStatus)) throw new PaymentError('Unknown payment status filter.', 400, 'INVALID_FILTER')
    const pageRaw = request.nextUrl.searchParams.get('page') || '1'
    if (!/^\d{1,9}$/.test(pageRaw)) throw new PaymentError('Invalid page.', 400, 'INVALID_FILTER')
    return paymentJson(await listPaymentRequests(actor, { q, status: statusRaw as PaymentStatus || undefined, page: Number(pageRaw) }))
  } catch (error) { return paymentApiError(error) }
}

export async function POST(request: Request) {
  try {
    const actor = await paymentAdminActor(true)
    const body = await readPaymentJson(request)
    return paymentJson(await createPaymentRequest(actor, body), 201)
  } catch (error) { return paymentApiError(error) }
}
