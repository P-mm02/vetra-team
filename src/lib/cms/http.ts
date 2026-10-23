import { NextResponse } from 'next/server'
import { assertSameOriginStrict, getCurrentUser } from '@/lib/auth/session'
import { canEditPortfolio } from '@/lib/portfolio'

export class CmsError extends Error { constructor(message: string, public status = 400) { super(message) } }
export async function cmsActor(write = false) {
  if (write) await assertSameOriginStrict().catch(() => { throw new CmsError('This request must come from this website.', 403) })
  const actor = await getCurrentUser()
  if (!actor) throw new CmsError('Please sign in again.', 401)
  if (write && !canEditPortfolio(actor.role)) throw new CmsError('You do not have permission to make changes.', 403)
  return actor
}
export function cmsError(error: unknown) {
  if (error instanceof CmsError) return NextResponse.json({ error: error.message }, { status: error.status })
  console.error('CMS operation failed:', error instanceof Error ? error.name : 'Unknown error')
  return NextResponse.json({ error: 'The service could not complete this request. Your input has been preserved. Please retry.' }, { status: 503 })
}
export async function readJson(req: Request) {
  if (Number(req.headers.get('content-length') || 0) > 150000) throw new CmsError('Request is too large.', 413)
  const body = await req.text()
  if (body.length > 150000) throw new CmsError('Request is too large.', 413)
  try {
    const parsed: unknown = JSON.parse(body)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Invalid body')
    return parsed as Record<string, unknown>
  } catch { throw new CmsError('Invalid request.') }
}
