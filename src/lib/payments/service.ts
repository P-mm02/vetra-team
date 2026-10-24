import crypto from 'node:crypto'
import mongoose from 'mongoose'
import { connectMongo } from '@/lib/db/mongoose'
import { User } from '@/models/User/User'
import { getPaymentConfiguration } from './config'
import { PaymentAttempt, PaymentRequest, ensurePaymentIndexes, type PaymentAttemptDoc, type PaymentRequestDoc } from './models'
import { getPaymentProvider } from './providers'
import { createPaymentSchema, parsePaymentAmount, paymentIdSchema, paymentTokenPattern, type CreatePaymentInput } from './validation'
import { PaymentError, type PaymentConfiguration, type PaymentDetailResponse, type PaymentListResponse, type PaymentProvider, type PaymentStatus, type PaymentView, type ProviderSession, type PublicPaymentResponse, type PublicPaymentView } from './types'

export type PaymentActor = { id: string; role: string }
export type PaymentServiceOptions = { provider?: PaymentProvider; configuration?: PaymentConfiguration }
export type PaymentListQuery = { q?: string; status?: PaymentStatus; page?: number }

const ATTEMPT_REPLAY_MS = 23 * 60 * 60 * 1000
const CHECKOUT_SESSION_MS = 23 * 60 * 60 * 1000
const MIN_CHECKOUT_REMAINING_MS = 31 * 60 * 1000
const OPERATION_LEASE_MS = 2 * 60 * 1000

function configuration(options?: PaymentServiceOptions) { return options?.configuration || getPaymentConfiguration() }
function providerFor(request: PaymentRequestDoc, options?: PaymentServiceOptions) {
  const provider = options?.provider || getPaymentProvider(request.gateway)
  if (provider.id !== request.gateway) throw new PaymentError('The payment gateway does not match this request.', 409, 'PAYMENT_MISMATCH')
  return provider
}
function cleanText(value: string | undefined) { return value || '' }
function isDuplicate(error: unknown) { return (error as { code?: number })?.code === 11000 }
function notFound() { return new PaymentError('This payment request was not found.', 404, 'PAYMENT_NOT_FOUND') }
function escapeRegex(value: string) { return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') }

async function requireAdmin(actor: PaymentActor) {
  if (!mongoose.isValidObjectId(actor.id) || !['dev', 'admin'].includes(actor.role)) {
    throw new PaymentError('You do not have permission to manage payments.', 403, 'PAYMENT_FORBIDDEN')
  }
  await connectMongo()
  const active = await User.findOne({ _id: actor.id, isActive: true, deletedAt: null })
    .select({ role: 1 }).lean<{ role?: string } | null>()
  if (!active || !['dev', 'admin'].includes(String(active.role))) {
    throw new PaymentError('You do not have permission to manage payments.', 403, 'PAYMENT_FORBIDDEN')
  }
}

function displayStatus(request: PaymentRequestDoc, attempt?: PaymentAttemptDoc | null): PaymentStatus {
  if (attempt?.status === 'paid' && request.status !== 'paid') return 'needs_review'
  return request.status === 'pending' && request.expiresAt.getTime() <= Date.now() ? 'expired' : request.status
}
function shareUrl(request: PaymentRequestDoc, config: PaymentConfiguration) {
  return config.siteUrl ? `${config.siteUrl}/pay/${request.shareToken}?lang=th` : null
}
function readyForRequest(request: PaymentRequestDoc, config: PaymentConfiguration) {
  return request.mode === config.mode && !!config.gateways.find(gateway => gateway.id === request.gateway)?.ready
}
function canRecoverAttempt(attempt?: PaymentAttemptDoc | null) {
  return !!attempt && ['creating', 'unknown'].includes(attempt.status) && !attempt.providerSessionId && Date.now() - attempt.createdAt.getTime() < ATTEMPT_REPLAY_MS
}
function toPaymentView(request: PaymentRequestDoc, config: PaymentConfiguration, attempt?: PaymentAttemptDoc | null): PaymentView {
  const status = displayStatus(request, attempt)
  return {
    id: request._id, gateway: request.gateway, kind: request.kind,
    title: request.title, description: request.description, amountMinor: request.amountMinor,
    currency: 'THB', mode: request.mode, status,
    customerName: cleanText(request.customerName), customerEmail: cleanText(request.customerEmail),
    reference: cleanText(request.reference), internalNote: cleanText(request.internalNote),
    createdAt: request.createdAt.toISOString(), updatedAt: request.updatedAt.toISOString(),
    expiresAt: request.expiresAt.toISOString(), paidAt: request.paidAt?.toISOString() || null,
    shareUrl: shareUrl(request, config),
    canCancel: status === 'pending' && (!attempt || ['open', 'expired', 'failed'].includes(attempt.status)),
  }
}
function toPublicPaymentView(request: PaymentRequestDoc, config: PaymentConfiguration, attempt?: PaymentAttemptDoc | null): PublicPaymentView {
  const status = displayStatus(request, attempt)
  const gatewayReady = readyForRequest(request, config)
  return {
    id: request._id, gateway: request.gateway, kind: request.kind,
    title: request.title, description: request.description, amountMinor: request.amountMinor,
    currency: 'THB', mode: request.mode, status, reference: cleanText(request.reference),
    expiresAt: request.expiresAt.toISOString(), paidAt: request.paidAt?.toISOString() || null,
    gatewayReady,
    canPay: gatewayReady && (status === 'pending' || (status === 'needs_review' && canRecoverAttempt(attempt))),
  }
}
async function activeAttempt(request: PaymentRequestDoc) {
  return request.activeAttemptId ? PaymentAttempt.findById(request.activeAttemptId).lean<PaymentAttemptDoc | null>() : null
}
function canonicalFingerprint(input: CreatePaymentInput, amountMinor: number) {
  return crypto.createHash('sha256').update(JSON.stringify({ ...input, amount: amountMinor })).digest('hex')
}

export async function createPaymentRequest(actor: PaymentActor, rawInput: unknown, options?: PaymentServiceOptions): Promise<PaymentDetailResponse> {
  await requireAdmin(actor)
  const parsed = createPaymentSchema.safeParse(rawInput)
  if (!parsed.success) throw new PaymentError('Check the payment fields and try again.', 400, 'INVALID_PAYMENT_REQUEST')
  const input = parsed.data
  const amountMinor = parsePaymentAmount(input.amount)
  await ensurePaymentIndexes()
  const fingerprint = canonicalFingerprint(input, amountMinor)
  const config = configuration(options)
  const existing = await PaymentRequest.findOne({ createdBy: actor.id, idempotencyKey: input.idempotencyKey }).lean<PaymentRequestDoc | null>()
  if (existing) {
    if (existing.payloadFingerprint !== fingerprint) throw new PaymentError('This create request was already used with different details.', 409, 'IDEMPOTENCY_CONFLICT')
    return { payment: toPaymentView(existing, config, await activeAttempt(existing)), configuration: config }
  }
  const now = new Date()
  try {
    const created = await PaymentRequest.create({
      _id: crypto.randomUUID(), createdBy: actor.id, idempotencyKey: input.idempotencyKey,
      shareToken: crypto.randomBytes(32).toString('base64url'), payloadFingerprint: fingerprint,
      gateway: input.gateway, mode: config.mode, kind: input.kind,
      title: input.title, description: input.description, amountMinor, currency: 'THB',
      customerName: input.customerName, customerEmail: input.customerEmail,
      reference: input.reference, internalNote: input.internalNote,
      expiresAt: new Date(now.getTime() + input.expiresInDays * 86400000), status: 'pending',
    })
    return { payment: toPaymentView(created.toObject(), config), configuration: config }
  } catch (error) {
    if (!isDuplicate(error)) throw error
    const winner = await PaymentRequest.findOne({ createdBy: actor.id, idempotencyKey: input.idempotencyKey }).lean<PaymentRequestDoc | null>()
    if (!winner) throw new PaymentError('The payment request outcome is uncertain. Look it up by its request key before trying again.', 503, 'CREATE_UNCERTAIN')
    if (winner.payloadFingerprint !== fingerprint) throw new PaymentError('This create request was already used with different details.', 409, 'IDEMPOTENCY_CONFLICT')
    return { payment: toPaymentView(winner, config, await activeAttempt(winner)), configuration: config }
  }
}

export async function getPaymentRequestByIdempotencyKey(actor: PaymentActor, key: string, options?: PaymentServiceOptions): Promise<PaymentDetailResponse> {
  await requireAdmin(actor)
  if (!paymentIdSchema.safeParse(key).success) throw new PaymentError('Invalid payment request key.', 400, 'INVALID_IDEMPOTENCY_KEY')
  const request = await PaymentRequest.findOne({ createdBy: actor.id, idempotencyKey: key }).lean<PaymentRequestDoc | null>()
  if (!request) throw notFound()
  const config = configuration(options)
  return { payment: toPaymentView(request, config, await activeAttempt(request)), configuration: config }
}

export async function getAdminPaymentRequest(actor: PaymentActor, id: string, options?: PaymentServiceOptions): Promise<PaymentDetailResponse> {
  await requireAdmin(actor)
  if (!paymentIdSchema.safeParse(id).success) throw notFound()
  const request = await PaymentRequest.findById(id).lean<PaymentRequestDoc | null>()
  if (!request) throw notFound()
  const config = configuration(options)
  return { payment: toPaymentView(request, config, await activeAttempt(request)), configuration: config }
}

export async function listPaymentRequests(actor: PaymentActor, query: PaymentListQuery = {}, options?: PaymentServiceOptions): Promise<PaymentListResponse> {
  await requireAdmin(actor)
  const q = (query.q || '').trim().slice(0, 100)
  const page = Number.isSafeInteger(query.page) && Number(query.page) > 0 ? Math.min(Number(query.page), 100000) : 1
  const now = new Date()
  const filter: Record<string, unknown> = {}
  if (q) {
    const pattern = new RegExp(escapeRegex(q), 'i')
    filter.$or = [{ title: pattern }, { customerName: pattern }, { customerEmail: pattern }, { reference: pattern }]
  }
  if (query.status) {
    if (query.status === 'expired') filter.$and = [{ $or: [{ status: 'expired' }, { status: 'pending', expiresAt: { $lte: now } }] }]
    else if (query.status === 'pending') { filter.status = 'pending'; filter.expiresAt = { $gt: now } }
    else filter.status = query.status
  }
  const pageSize = 20
  const total = await PaymentRequest.countDocuments(filter)
  const actualPage = Math.min(page, Math.max(1, Math.ceil(total / pageSize)))
  const requests = await PaymentRequest.find(filter).sort({ createdAt: -1, _id: -1 }).skip((actualPage - 1) * pageSize).limit(pageSize).lean<PaymentRequestDoc[]>()
  const attemptIds = requests.map(request => request.activeAttemptId).filter((id): id is string => !!id)
  const attempts = await PaymentAttempt.find({ _id: { $in: attemptIds } }).lean<PaymentAttemptDoc[]>()
  const byId = new Map(attempts.map(attempt => [attempt._id, attempt]))
  const config = configuration(options)
  return { payments: requests.map(request => toPaymentView(request, config, request.activeAttemptId ? byId.get(request.activeAttemptId) : null)), configuration: config, total, page: actualPage, pageSize }
}

async function publicRequest(token: string) {
  if (!paymentTokenPattern.test(token)) throw notFound()
  await connectMongo()
  const request = await PaymentRequest.findOne({ shareToken: token }).lean<PaymentRequestDoc | null>()
  if (!request) throw notFound()
  return request
}

export async function getPublicPaymentRequest(token: string, options?: PaymentServiceOptions): Promise<PublicPaymentResponse> {
  const request = await publicRequest(token)
  return { payment: toPublicPaymentView(request, configuration(options), await activeAttempt(request)) }
}

async function withPaymentOperation<T>(id: string, work: () => Promise<T>): Promise<T> {
  const now = new Date()
  const owner = crypto.randomUUID()
  const locked = await PaymentRequest.findOneAndUpdate(
    { _id: id, $or: [{ operationExpiresAt: null }, { operationExpiresAt: { $lte: now } }] },
    { $set: { operationOwner: owner, operationExpiresAt: new Date(now.getTime() + OPERATION_LEASE_MS) } },
    { returnDocument: 'after' },
  ).lean<PaymentRequestDoc | null>()
  if (!locked) throw new PaymentError('Another payment operation is in progress. Please retry shortly.', 409, 'PAYMENT_IN_PROGRESS')
  try { return await work() }
  finally {
    await PaymentRequest.updateOne(
      { _id: id, operationOwner: owner },
      { $set: { operationOwner: null, operationExpiresAt: new Date(0) } },
    ).catch(() => undefined)
  }
}

type SessionOutcome = 'open' | 'processing' | 'paid' | 'expired' | 'failed'

function verifyProviderSession(session: ProviderSession, request: PaymentRequestDoc, attempt: PaymentAttemptDoc, eventType?: string): { outcome: SessionOutcome; expiresAt: Date } {
  if (!session.id || session.orderId !== request._id || session.attemptId !== attempt._id ||
      session.clientReferenceId !== request._id || session.amountMinor !== request.amountMinor ||
      session.currency?.toLowerCase() !== 'thb' || session.livemode !== (request.mode === 'live') ||
      (attempt.providerSessionId && attempt.providerSessionId !== session.id)) {
    throw new PaymentError('The gateway payment details do not match this request.', 409, 'PAYMENT_MISMATCH')
  }
  const expiresAt = new Date(session.expiresAt)
  if (!Number.isFinite(expiresAt.getTime())) throw new PaymentError('The gateway returned an invalid expiry.', 409, 'PAYMENT_MISMATCH')
  if (session.checkoutUrl) {
    let checkout: URL
    try { checkout = new URL(session.checkoutUrl) }
    catch { throw new PaymentError('The gateway returned an invalid checkout link.', 409, 'PAYMENT_MISMATCH') }
    if (checkout.protocol !== 'https:' || checkout.hostname !== 'checkout.stripe.com' || checkout.username || checkout.password) {
      throw new PaymentError('The gateway returned an invalid checkout link.', 409, 'PAYMENT_MISMATCH')
    }
  }
  if (session.paymentStatus === 'no_payment_required') {
    throw new PaymentError('A positive amount cannot be completed without payment.', 409, 'PAYMENT_MISMATCH')
  }
  if (session.status === 'complete' && session.paymentStatus === 'paid') return { outcome: 'paid', expiresAt }
  if (session.status === 'complete' && session.paymentStatus === 'unpaid') {
    return { outcome: eventType === 'checkout.session.async_payment_failed' ? 'failed' : 'processing', expiresAt }
  }
  if (session.status === 'expired' && session.paymentStatus === 'unpaid') return { outcome: 'expired', expiresAt }
  if (session.status === 'open' && session.paymentStatus === 'unpaid' && session.checkoutUrl) return { outcome: 'open', expiresAt }
  throw new PaymentError('The gateway returned an inconsistent checkout state.', 409, 'PAYMENT_MISMATCH')
}

async function markVerificationReview(request: PaymentRequestDoc, attempt: PaymentAttemptDoc) {
  await PaymentAttempt.updateOne(
    { _id: attempt._id, status: { $ne: 'paid' } },
    { $set: { status: 'unknown', failureCode: 'VERIFICATION_MISMATCH' } },
  )
  await PaymentRequest.updateOne(
    { _id: request._id, activeAttemptId: attempt._id, status: { $nin: ['paid', 'cancelled'] } },
    { $set: { status: 'needs_review' }, $inc: { version: 1 } },
  )
}

async function synchronizeNonPaidRequest(requestId: string, attemptId: string) {
  for (let tries = 0; tries < 8; tries++) {
    // Read the request first. A newer reconciliation that updates it after this
    // read changes its version and forces us to reread the attempt on retry.
    const currentRequest = await PaymentRequest.findById(requestId).lean<PaymentRequestDoc | null>()
    if (!currentRequest) throw notFound()
    if (currentRequest.activeAttemptId !== attemptId || ['paid', 'cancelled'].includes(currentRequest.status)) return currentRequest
    const currentAttempt = await PaymentAttempt.findById(attemptId).lean<PaymentAttemptDoc | null>()
    if (!currentAttempt) throw new PaymentError('The payment attempt was not found.', 404, 'PAYMENT_ATTEMPT_NOT_FOUND')
    // A paid reconciliation owns the paidAt and paidAttemptId transition.
    if (currentAttempt.status === 'paid') return currentRequest
    const nextStatus: PaymentStatus = currentAttempt.status === 'pending' ? 'processing'
      : currentAttempt.status === 'unknown' ? 'needs_review'
        : ['expired', 'failed'].includes(currentAttempt.status) && currentRequest.expiresAt.getTime() <= Date.now() ? 'expired'
          : 'pending'
    if (currentRequest.status === nextStatus) return currentRequest
    const changed = await PaymentRequest.findOneAndUpdate(
      { _id: requestId, activeAttemptId: attemptId, version: currentRequest.version,
        status: { $nin: ['paid', 'cancelled'] } },
      { $set: { status: nextStatus }, $inc: { version: 1 } },
      { returnDocument: 'after' },
    ).lean<PaymentRequestDoc | null>()
    if (changed) return changed
  }
  throw new PaymentError('The payment state changed during verification. Refresh it.', 409, 'PAYMENT_CONFLICT')
}

/** Used by the signed webhook and by server-side provider retrieval. */
export async function reconcileProviderSession(
  session: ProviderSession,
  event: { eventId?: string; eventType?: string } = {},
): Promise<PaymentView> {
  await connectMongo()
  const attempt = session.attemptId ? await PaymentAttempt.findById(session.attemptId).lean<PaymentAttemptDoc | null>() : null
  if (!attempt) throw new PaymentError('The payment attempt was not found.', 404, 'PAYMENT_ATTEMPT_NOT_FOUND')
  const request = await PaymentRequest.findById(attempt.requestId).lean<PaymentRequestDoc | null>()
  if (!request) throw notFound()
  let verified: { outcome: SessionOutcome; expiresAt: Date }
  try { verified = verifyProviderSession(session, request, attempt, event.eventType) }
  catch (error) { await markVerificationReview(request, attempt); throw error }

  // The provider may send overlapping or delayed events. CAS against the
  // current attempt state so an old open/expired response cannot overwrite a
  // concurrently confirmed paid or processing state.
  let bound: PaymentAttemptDoc | null = null
  for (let tries = 0; tries < 4 && !bound; tries++) {
    const current = await PaymentAttempt.findById(attempt._id).lean<PaymentAttemptDoc | null>()
    if (!current) throw new PaymentError('The payment attempt was not found.', 404, 'PAYMENT_ATTEMPT_NOT_FOUND')
    if (current.providerSessionId && current.providerSessionId !== session.id) {
      await markVerificationReview(request, current)
      throw new PaymentError('The gateway returned a different session for this attempt.', 409, 'PAYMENT_MISMATCH')
    }
    const incoming: PaymentAttemptDoc['status'] = verified.outcome === 'processing' ? 'pending' : verified.outcome
    const nextStatus: PaymentAttemptDoc['status'] = current.status === 'paid' || incoming === 'paid' ? 'paid'
      : ['failed', 'expired'].includes(current.status) ? current.status
        : current.status === 'pending' && incoming === 'open' ? 'pending' : incoming
    bound = await PaymentAttempt.findOneAndUpdate(
      { _id: attempt._id, status: current.status, providerSessionId: current.providerSessionId || null },
      { $set: {
        providerSessionId: session.id,
        providerUrl: session.checkoutUrl,
        providerExpiresAt: verified.expiresAt,
        providerPaymentIntentId: session.paymentIntentId,
        livemode: session.livemode,
        lastCheckedAt: new Date(),
        status: nextStatus,
        failureCode: null,
        ...(event.eventId ? { lastEventId: event.eventId } : {}),
        ...(event.eventType ? { lastEventType: event.eventType } : {}),
      } },
      { returnDocument: 'after' },
    ).lean<PaymentAttemptDoc | null>()
  }
  if (!bound) {
    await markVerificationReview(request, attempt)
    throw new PaymentError('The payment state changed during verification. Refresh it.', 409, 'PAYMENT_CONFLICT')
  }
  if (verified.outcome === 'paid') {
    const changed = await PaymentRequest.findOneAndUpdate(
      { _id: request._id, status: { $ne: 'paid' } },
      { $set: { status: 'paid', paidAt: new Date(), paidAttemptId: attempt._id }, $inc: { version: 1 } },
      { returnDocument: 'after' },
    ).lean<PaymentRequestDoc | null>()
    const latest = changed || await PaymentRequest.findById(request._id).lean<PaymentRequestDoc | null>()
    if (!latest) throw notFound()
    if (latest.paidAttemptId !== attempt._id) {
      console.error('A second verified payment exists for request', request._id)
      throw new PaymentError('This request has more than one verified payment and needs review.', 409, 'DUPLICATE_PAYMENT')
    }
    return toPaymentView(latest, getPaymentConfiguration(), bound)
  }
  const latest = await synchronizeNonPaidRequest(request._id, attempt._id)
  return toPaymentView(latest, getPaymentConfiguration(), bound)
}

async function markAttemptUnknown(request: PaymentRequestDoc, attempt: PaymentAttemptDoc, code: string) {
  const changed = await PaymentAttempt.updateOne(
    { _id: attempt._id, status: { $in: ['creating', 'open', 'unknown'] } },
    { $set: { status: 'unknown', createLeaseUntil: new Date(0), failureCode: code } },
  )
  if (!changed.matchedCount) return
  await PaymentRequest.updateOne(
    { _id: request._id, activeAttemptId: attempt._id, status: { $nin: ['paid', 'cancelled'] } },
    { $set: { status: 'needs_review' }, $inc: { version: 1 } },
  )
}

function attemptCreateInput(request: PaymentRequestDoc, attempt: PaymentAttemptDoc) {
  return {
    orderId: request._id, attemptId: attempt._id,
    amountMinor: request.amountMinor, currency: 'THB' as const,
    title: request.title, description: request.description,
    ...(request.customerEmail ? { customerEmail: request.customerEmail } : {}),
    successUrl: attempt.successUrl, cancelUrl: attempt.cancelUrl,
    expiresAt: attempt.checkoutExpiresAt.toISOString(),
    idempotencyKey: attempt.providerIdempotencyKey,
  }
}

async function createOrReplaySession(request: PaymentRequestDoc, attempt: PaymentAttemptDoc, provider: PaymentProvider) {
  if (Date.now() - attempt.createdAt.getTime() >= ATTEMPT_REPLAY_MS) {
    await markAttemptUnknown(request, attempt, 'IDEMPOTENCY_WINDOW_ENDED')
    throw new PaymentError('This checkout attempt needs manual review before another payment can start.', 409, 'PAYMENT_NEEDS_REVIEW')
  }
  const now = new Date()
  const claimed = await PaymentAttempt.updateOne(
    { _id: attempt._id, status: { $in: ['creating', 'unknown'] }, providerSessionId: null, createLeaseUntil: { $lte: now } },
    { $set: { status: 'creating', createLeaseUntil: new Date(now.getTime() + OPERATION_LEASE_MS) } },
  )
  if (!claimed.matchedCount) throw new PaymentError('Checkout is already being prepared. Please retry shortly.', 409, 'PAYMENT_IN_PROGRESS')
  let session: ProviderSession
  try { session = await provider.createSession(attemptCreateInput(request, attempt)) }
  catch {
    await markAttemptUnknown(request, attempt, 'CREATE_UNCERTAIN')
    throw new PaymentError('The checkout outcome is uncertain. Retry this same link to safely recover it.', 503, 'PAYMENT_UNCERTAIN')
  }
  await reconcileProviderSession(session)
  return session
}

async function retrieveOrRecoverSession(request: PaymentRequestDoc, attempt: PaymentAttemptDoc, provider: PaymentProvider) {
  if (!attempt.providerSessionId) {
    if (!['creating', 'unknown'].includes(attempt.status)) {
      await markAttemptUnknown(request, attempt, 'SESSION_ID_MISSING')
      throw new PaymentError('This checkout attempt needs manual review.', 409, 'PAYMENT_NEEDS_REVIEW')
    }
    return createOrReplaySession(request, attempt, provider)
  }
  let session: ProviderSession
  try { session = await provider.retrieveSession(attempt.providerSessionId) }
  catch {
    await markAttemptUnknown(request, attempt, 'RETRIEVE_UNCERTAIN')
    throw new PaymentError('The payment gateway could not confirm this checkout yet. Please retry refresh.', 503, 'PAYMENT_UNCERTAIN')
  }
  await reconcileProviderSession(session)
  return session
}

async function allocateAttempt(request: PaymentRequestDoc, config: PaymentConfiguration, locale: 'th' | 'en') {
  const now = new Date()
  if (request.expiresAt.getTime() - now.getTime() < MIN_CHECKOUT_REMAINING_MS) {
    throw new PaymentError('This payment link is too close to expiry to start checkout.', 410, 'PAYMENT_EXPIRED')
  }
  const siteUrl = config.siteUrl
  if (!siteUrl) throw new PaymentError('The payment website URL is not configured.', 503, 'PAYMENT_UNAVAILABLE')
  const attemptId = crypto.randomUUID()
  const checkoutExpiresAt = new Date(Math.floor(Math.min(request.expiresAt.getTime(), now.getTime() + CHECKOUT_SESSION_MS) / 1000) * 1000)
  const base = `${siteUrl}/pay/${request.shareToken}?lang=${locale}`
  const attempt = await PaymentAttempt.create({
    _id: attemptId, requestId: request._id, gateway: request.gateway, status: 'creating',
    providerIdempotencyKey: `payment-checkout-${attemptId}`,
    checkoutExpiresAt, successUrl: `${base}&checkout=returned`, cancelUrl: base,
    createLeaseUntil: new Date(0),
  })
  const currentActiveId = request.activeAttemptId || null
  const assigned = await PaymentRequest.updateOne(
    { _id: request._id, status: 'pending', activeAttemptId: currentActiveId, version: request.version, expiresAt: { $gt: now } },
    { $set: { activeAttemptId: attemptId }, $inc: { version: 1 } },
  )
  if (!assigned.matchedCount) {
    await PaymentAttempt.deleteOne({ _id: attemptId, status: 'creating', providerSessionId: null })
    throw new PaymentError('This payment changed while checkout was starting. Please refresh.', 409, 'PAYMENT_CONFLICT')
  }
  return attempt.toObject()
}

function assertCheckoutAvailable(request: PaymentRequestDoc) {
  if (request.status === 'paid') throw new PaymentError('This payment has already been completed.', 409, 'PAYMENT_PAID')
  if (request.status === 'cancelled') throw new PaymentError('This payment request was cancelled.', 410, 'PAYMENT_CANCELLED')
  if (request.expiresAt.getTime() <= Date.now() || request.status === 'expired') {
    throw new PaymentError('This payment link has expired.', 410, 'PAYMENT_EXPIRED')
  }
  if (request.status === 'processing') throw new PaymentError('A payment is still processing. Please refresh its status.', 409, 'PAYMENT_PROCESSING')
}

export async function startCheckout(token: string, options?: PaymentServiceOptions, locale: 'th' | 'en' = 'th'): Promise<{ url: string }> {
  const found = await publicRequest(token)
  return withPaymentOperation(found._id, async () => {
    let request = await PaymentRequest.findById(found._id).lean<PaymentRequestDoc | null>()
    if (!request) throw notFound()
    assertCheckoutAvailable(request)
    const config = configuration(options)
    if (!readyForRequest(request, config) && !options?.provider) {
      throw new PaymentError('Online payments are not available yet. Please contact VETRA.', 503, 'PAYMENT_UNAVAILABLE')
    }
    const provider = providerFor(request, options)
    let attempt = await activeAttempt(request)
    if (request.activeAttemptId && !attempt) {
      throw new PaymentError('This checkout attempt needs manual review.', 409, 'PAYMENT_NEEDS_REVIEW')
    }
    if (attempt?.status === 'paid') throw new PaymentError('A payment was already verified and is being reconciled.', 409, 'PAYMENT_PROCESSING')
    if (request.status === 'needs_review' && !canRecoverAttempt(attempt) && !attempt?.providerSessionId) {
      throw new PaymentError('This payment needs manual review before another checkout.', 409, 'PAYMENT_NEEDS_REVIEW')
    }
    if (attempt) {
      let session = await retrieveOrRecoverSession(request, attempt, provider)
      if (session.status === 'open' && Date.parse(session.expiresAt) <= Date.now()) {
        try { session = await provider.expireSession(session.id) }
        catch {
          try { session = await provider.retrieveSession(session.id) }
          catch {
            await markAttemptUnknown(request, attempt, 'EXPIRE_UNCERTAIN')
            throw new PaymentError('The previous checkout could not be confirmed expired. Retry later.', 503, 'PAYMENT_UNCERTAIN')
          }
        }
        await reconcileProviderSession(session)
      }
      request = await PaymentRequest.findById(found._id).lean<PaymentRequestDoc | null>()
      if (!request) throw notFound()
      assertCheckoutAvailable(request)
      attempt = await activeAttempt(request)
      if (attempt?.status === 'paid') throw new PaymentError('A payment was already verified and is being reconciled.', 409, 'PAYMENT_PROCESSING')
      if (session.status === 'open' && attempt?.status === 'open' && session.paymentStatus === 'unpaid' && session.checkoutUrl && Date.parse(session.expiresAt) > Date.now()) {
        return { url: session.checkoutUrl }
      }
      const confirmedExpired = session.status === 'expired' && session.paymentStatus === 'unpaid' && attempt?.status === 'expired'
      const confirmedFailed = session.status === 'complete' && session.paymentStatus === 'unpaid' && attempt?.status === 'failed'
      if (!confirmedExpired && !confirmedFailed) {
        throw new PaymentError('This payment is processing or needs review. Refresh its status.', 409, 'PAYMENT_PROCESSING')
      }
    }
    if (request.status !== 'pending') throw new PaymentError('This payment cannot start another checkout.', 409, 'PAYMENT_NEEDS_REVIEW')
    const created = await allocateAttempt(request, config, locale)
    const session = await createOrReplaySession(request, created, provider)
    const latest = await PaymentRequest.findById(request._id).lean<PaymentRequestDoc | null>()
    if (!latest) throw notFound()
    assertCheckoutAvailable(latest)
    if (session.status !== 'open' || session.paymentStatus !== 'unpaid' || !session.checkoutUrl || Date.parse(session.expiresAt) <= Date.now()) {
      throw new PaymentError('Checkout is not available for this payment state.', 409, 'PAYMENT_PROCESSING')
    }
    return { url: session.checkoutUrl }
  })
}

async function refreshStoredRequest(request: PaymentRequestDoc, options?: PaymentServiceOptions, recoverUnidentified = false) {
  if (request.status === 'paid' || request.status === 'cancelled' || !request.activeAttemptId) return
  const attempt = await activeAttempt(request)
  if (!attempt) throw new PaymentError('This payment attempt needs manual review.', 409, 'PAYMENT_NEEDS_REVIEW')
  if (!attempt.providerSessionId && !recoverUnidentified) return
  await retrieveOrRecoverSession(request, attempt, providerFor(request, options))
}

export async function refreshPaymentRequest(actor: PaymentActor, id: string, options?: PaymentServiceOptions): Promise<PaymentDetailResponse> {
  await requireAdmin(actor)
  if (!paymentIdSchema.safeParse(id).success) throw notFound()
  return withPaymentOperation(id, async () => {
    const request = await PaymentRequest.findById(id).lean<PaymentRequestDoc | null>()
    if (!request) throw notFound()
    await refreshStoredRequest(request, options, true)
    return getAdminPaymentRequest(actor, id, options)
  })
}

export async function refreshPublicPaymentRequest(token: string, options?: PaymentServiceOptions): Promise<PublicPaymentResponse> {
  const found = await publicRequest(token)
  return withPaymentOperation(found._id, async () => {
    const request = await PaymentRequest.findById(found._id).lean<PaymentRequestDoc | null>()
    if (!request) throw notFound()
    await refreshStoredRequest(request, options)
    return getPublicPaymentRequest(token, options)
  })
}

export async function cancelPaymentRequest(actor: PaymentActor, id: string, options?: PaymentServiceOptions): Promise<PaymentDetailResponse> {
  await requireAdmin(actor)
  if (!paymentIdSchema.safeParse(id).success) throw notFound()
  return withPaymentOperation(id, async () => {
    const request = await PaymentRequest.findById(id).lean<PaymentRequestDoc | null>()
    if (!request) throw notFound()
    if (request.status === 'paid') throw new PaymentError('A paid request cannot be cancelled.', 409, 'PAYMENT_PAID')
    if (request.status === 'cancelled') return getAdminPaymentRequest(actor, id, options)
    if (request.status === 'processing') throw new PaymentError('A payment is processing and cannot be cancelled.', 409, 'PAYMENT_PROCESSING')
    const attempt = await activeAttempt(request)
    if (request.activeAttemptId && !attempt) throw new PaymentError('This attempt needs manual review.', 409, 'PAYMENT_NEEDS_REVIEW')
    if (attempt?.status === 'paid') throw new PaymentError('A payment was already verified and cannot be cancelled.', 409, 'PAYMENT_PAID')
    if (attempt) {
      const provider = providerFor(request, options)
      let session = await retrieveOrRecoverSession(request, attempt, provider)
      if (session.status === 'complete' && session.paymentStatus === 'paid') {
        throw new PaymentError('This payment has already completed.', 409, 'PAYMENT_PAID')
      }
      if (session.status === 'complete' && attempt.status !== 'failed') {
        throw new PaymentError('A payment is processing and cannot be cancelled.', 409, 'PAYMENT_PROCESSING')
      }
      if (session.status === 'open') {
        try { session = await provider.expireSession(session.id) }
        catch {
          // An expire request can race with payment completion. Retrieve the
          // current provider state instead of assuming cancellation succeeded.
          try { session = await provider.retrieveSession(session.id) }
          catch {
            await markAttemptUnknown(request, attempt, 'EXPIRE_UNCERTAIN')
            throw new PaymentError('The gateway could not confirm cancellation. Refresh before trying again.', 503, 'PAYMENT_UNCERTAIN')
          }
        }
        await reconcileProviderSession(session)
      }
      if ((await activeAttempt(request))?.status === 'paid') {
        throw new PaymentError('A payment was already verified and cannot be cancelled.', 409, 'PAYMENT_PAID')
      }
      const confirmedExpired = session.status === 'expired' && session.paymentStatus === 'unpaid'
      const confirmedFailed = session.status === 'complete' && session.paymentStatus === 'unpaid' && (await activeAttempt(request))?.status === 'failed'
      if (!confirmedExpired && !confirmedFailed) {
        throw new PaymentError('The gateway did not confirm checkout expiry. This payment cannot be cancelled yet.', 409, 'PAYMENT_PROCESSING')
      }
    }
    const changed = await PaymentRequest.updateOne(
      { _id: id, status: { $in: ['pending', 'expired'] }, activeAttemptId: request.activeAttemptId || null },
      { $set: { status: 'cancelled', cancelledAt: new Date() }, $inc: { version: 1 } },
    )
    if (!changed.matchedCount) throw new PaymentError('This payment changed while cancellation was in progress. Refresh it.', 409, 'PAYMENT_CONFLICT')
    return getAdminPaymentRequest(actor, id, options)
  })
}
