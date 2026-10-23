import { formatPaymentAmount, type PaymentStatus } from '@/lib/payments/types'

export const statusLabels: Record<PaymentStatus, string> = {
  pending: 'Pending',
  processing: 'Processing',
  paid: 'Paid',
  cancelled: 'Cancelled',
  expired: 'Expired',
  needs_review: 'Needs review',
}

export function money(amountMinor: number) {
  return formatPaymentAmount(amountMinor, 'en-GB')
}

export function dateTime(value: string | null | undefined) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    timeZone: 'Asia/Bangkok', timeZoneName: 'short',
  }).format(date)
}

export async function responseError(response: Response) {
  try {
    const body = await response.json() as { error?: string; message?: string }
    return body.error || body.message || `Request failed (${response.status}).`
  } catch { return `Request failed (${response.status}).` }
}
