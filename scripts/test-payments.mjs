import assert from 'node:assert/strict'
import { createHmac, randomUUID } from 'node:crypto'
import { mkdtemp, rm } from 'node:fs/promises'
import path from 'node:path'
import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'

let checks = 0
function check(actual, expected, label) {
  assert.equal(actual, expected, label)
  checks++
  console.log(`PASS ${label}`)
}
async function rejectsCode(run, code, label) {
  await assert.rejects(run, error => error?.code === code, label)
  checks++
  console.log(`PASS ${label}`)
}

const { parsePaymentAmount } = await import('../src/lib/payments/validation.ts')
const { normalizeStripeSession, verifyStripeWebhook } = await import('../src/lib/payments/providers/stripe.ts')

check(parsePaymentAmount('10'), 1000, 'Minimum THB amount parses as minor units')
check(parsePaymentAmount('10.5'), 1050, 'One decimal place parses exactly')
check(parsePaymentAmount('999999.99'), 99999999, 'Maximum THB amount parses exactly')
for (const invalid of ['9.99', '1000000', '10.001', '1e3', '-10', '10,00', 'NaN']) {
  await rejectsCode(() => Promise.resolve().then(() => parsePaymentAmount(invalid)), 'PAYMENT_ERROR', `Invalid THB amount ${invalid} is rejected`)
}

const nowSeconds = Math.floor(Date.now() / 1000)
const session = {
  id: 'cs_test_isolated', mode: 'payment', status: 'open', payment_status: 'unpaid',
  url: 'https://checkout.stripe.com/c/pay/isolated', amount_total: 1050, currency: 'thb',
  metadata: { orderId: randomUUID(), attemptId: randomUUID() }, client_reference_id: null,
  livemode: false, expires_at: nowSeconds + 3600, payment_intent: null,
}
check(normalizeStripeSession(session).checkoutUrl, session.url, 'Stripe hosted Checkout URL is accepted')
await rejectsCode(() => Promise.resolve().then(() => normalizeStripeSession({ ...session, url: 'https://checkout.stripe.com.evil.invalid/pay' })), 'PAYMENT_ERROR', 'Unexpected Checkout host is rejected')
await rejectsCode(() => Promise.resolve().then(() => normalizeStripeSession({ ...session, mode: 'setup' })), 'PAYMENT_MISMATCH', 'Unexpected Checkout mode is rejected')

const previousStripeKey = process.env.STRIPE_SECRET_KEY
const previousWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET
try {
  process.env.STRIPE_SECRET_KEY = 'sk_test_signature_check_only'
  process.env.STRIPE_WEBHOOK_SECRET = 'whsec_signature_check_only'
  const event = {
    id: 'evt_test_isolated', object: 'event', created: nowSeconds,
    type: 'checkout.session.completed', livemode: false,
    data: { object: session },
  }
  const payload = JSON.stringify(event)
  const signature = createHmac('sha256', process.env.STRIPE_WEBHOOK_SECRET)
    .update(`${nowSeconds}.${payload}`).digest('hex')
  const header = `t=${nowSeconds},v1=${signature}`
  check(verifyStripeWebhook(payload, header).id, event.id, 'Valid raw-body Stripe signature is verified')
  await rejectsCode(() => Promise.resolve().then(() => verifyStripeWebhook(`${payload} `, header)), 'INVALID_SIGNATURE', 'Tampered webhook body is rejected')
  await rejectsCode(() => Promise.resolve().then(() => verifyStripeWebhook(payload, 't=1,v1=invalid')), 'INVALID_SIGNATURE', 'Invalid webhook signature is rejected')
} finally {
  if (previousStripeKey === undefined) delete process.env.STRIPE_SECRET_KEY
  else process.env.STRIPE_SECRET_KEY = previousStripeKey
  if (previousWebhookSecret === undefined) delete process.env.STRIPE_WEBHOOK_SECRET
  else process.env.STRIPE_WEBHOOK_SECRET = previousWebhookSecret
}

// The service tests below use a disposable MongoDB and an injected provider.
// No Stripe credential or network request is used for service behavior.
let mongo
const dbPath = await mkdtemp(path.join(process.cwd(), '.payment-test-mongo-'))
try {
  mongo = await MongoMemoryServer.create({ instance: { dbName: 'vetra_payment_service_test', dbPath } })
  process.env.MONGODB_URI = mongo.getUri('vetra_payment_service_test')
  process.env.AUTH_SECRET = 'isolated-payment-service-test-secret-2026'
  process.env.NODE_ENV = 'production'
  process.env.PAYMENTS_ENABLED = 'false'
  process.env.STRIPE_MODE = 'test'
  process.env.STRIPE_SECRET_KEY = ''
  process.env.STRIPE_WEBHOOK_SECRET = ''
  process.env.NEXT_PUBLIC_SITE_URL = 'http://127.0.0.1:43188'

  const { User } = await import('../src/models/User/User.ts')
  const { connectMongo } = await import('../src/lib/db/mongoose.ts')
  const { PaymentRequest, PaymentAttempt } = await import('../src/lib/payments/models.ts')
  const { getPaymentConfiguration } = await import('../src/lib/payments/config.ts')
  const {
    createPaymentRequest, getAdminPaymentRequest, getPublicPaymentRequest,
    listPaymentRequests, startCheckout, reconcileProviderSession,
    refreshPaymentRequest, cancelPaymentRequest,
  } = await import('../src/lib/payments/service.ts')

  const disabled = getPaymentConfiguration()
  check(disabled.gateways.find(gateway => gateway.id === 'stripe').ready, false, 'Checkout is disabled without Stripe credentials')
  await connectMongo()
  const configured = {
    ...disabled, configurationIssues: [],
    gateways: disabled.gateways.map(gateway => gateway.id === 'stripe' ? { ...gateway, ready: true } : gateway),
  }
  const actors = {}
  for (const role of ['dev', 'admin', 'editor', 'viewer']) {
    const user = await User.create({
      username: `pay${role}`, email: `pay${role}@example.invalid`,
      passwordHash: 'test-hash'.repeat(5), role, isActive: true,
    })
    actors[role] = { id: String(user._id), role }
  }

  class StubProvider {
    id = 'stripe'
    sessions = new Map()
    byKey = new Map()
    createCalls = 0
    retrieveCalls = 0
    expireCalls = 0
    failCreateOnce = false
    failRetrieveOnce = false
    lastCreateInput = null

    async createSession(input) {
      this.createCalls++
      this.lastCreateInput = input
      if (this.failCreateOnce) {
        this.failCreateOnce = false
        throw new Error('Stubbed lost provider response')
      }
      if (this.byKey.has(input.idempotencyKey)) return this.byKey.get(input.idempotencyKey)
      const result = {
        id: `cs_test_${randomUUID()}`, checkoutUrl: `https://checkout.stripe.com/c/pay/${randomUUID()}`,
        status: 'open', paymentStatus: 'unpaid', amountMinor: input.amountMinor,
        currency: input.currency.toLowerCase(), orderId: input.orderId,
        attemptId: input.attemptId, clientReferenceId: input.orderId,
        livemode: false, expiresAt: input.expiresAt, paymentIntentId: null,
      }
      this.sessions.set(result.id, result)
      this.byKey.set(input.idempotencyKey, result)
      return result
    }
    async retrieveSession(id) {
      this.retrieveCalls++
      if (this.failRetrieveOnce) {
        this.failRetrieveOnce = false
        throw new Error('Stubbed provider lookup outage')
      }
      const session = this.sessions.get(id)
      if (!session) throw new Error('Unknown stubbed session')
      return session
    }
    async expireSession(id) {
      this.expireCalls++
      const session = await this.retrieveSession(id)
      const expired = { ...session, status: 'expired', paymentStatus: 'unpaid', checkoutUrl: null }
      this.sessions.set(id, expired)
      return expired
    }
  }
  const provider = new StubProvider()
  const options = { provider, configuration: configured }
  const input = (key = randomUUID(), overrides = {}) => ({
    idempotencyKey: key, gateway: 'stripe', kind: 'service', title: 'Isolated service payment',
    amount: '250.00', expiresInDays: 7, ...overrides,
  })
  const create = async overrides => {
    const result = await createPaymentRequest(actors.admin, input(randomUUID(), overrides), options)
    const stored = await PaymentRequest.findById(result.payment.id).lean()
    return { ...result, token: stored.shareToken }
  }

  await rejectsCode(() => createPaymentRequest(actors.viewer, input(), options), 'PAYMENT_FORBIDDEN', 'Viewer cannot create a payment request')
  await rejectsCode(() => listPaymentRequests(actors.editor, {}, options), 'PAYMENT_FORBIDDEN', 'Editor cannot read financial records')
  const firstKey = randomUUID()
  const firstInput = input(firstKey)
  const [first, replay] = await Promise.all([
    createPaymentRequest(actors.admin, firstInput, options),
    createPaymentRequest(actors.admin, firstInput, options),
  ])
  check(replay.payment.id, first.payment.id, 'Concurrent create retry returns the original request')
  check(await PaymentRequest.countDocuments({ createdBy: actors.admin.id, idempotencyKey: firstKey }), 1, 'Concurrent create stores exactly one request')
  await rejectsCode(() => createPaymentRequest(actors.admin, { ...firstInput, amount: '251.00' }, options), 'IDEMPOTENCY_CONFLICT', 'Create key cannot be reused for different amount')
  check((await getAdminPaymentRequest(actors.dev, first.payment.id, options)).payment.amountMinor, 25000, 'Developer can inspect a financial record')
  check((await listPaymentRequests(actors.admin, {}, options)).total, 1, 'Administrator can list financial records')
  await rejectsCode(() => getAdminPaymentRequest(actors.viewer, first.payment.id, options), 'PAYMENT_FORBIDDEN', 'Viewer cannot inspect a financial record')
  const firstRecord = await PaymentRequest.findById(first.payment.id).lean()
  check((await getPublicPaymentRequest(firstRecord.shareToken, { configuration: disabled })).payment.canPay, false, 'Public link cannot start checkout while configuration is missing')
  await rejectsCode(() => startCheckout(firstRecord.shareToken), 'PAYMENT_UNAVAILABLE', 'Unconfigured checkout is unavailable')
  check(await PaymentAttempt.countDocuments({ requestId: first.payment.id }), 0, 'Unavailable checkout creates no attempt')

  const firstCheckout = await startCheckout(firstRecord.shareToken, options)
  check(firstCheckout.url.startsWith('https://checkout.stripe.com/'), true, 'Checkout uses provider-hosted URL')
  check(await PaymentAttempt.countDocuments({ requestId: first.payment.id }), 1, 'First checkout creates one attempt')
  const sessionSpan = Date.parse(provider.lastCreateInput.expiresAt) - Date.now()
  check(sessionSpan > 30 * 60 * 1000 && sessionSpan <= 24 * 60 * 60 * 1000, true, 'Checkout Session expiry stays within Stripe limits')
  check((await startCheckout(firstRecord.shareToken, options)).url, firstCheckout.url, 'Repeat checkout reuses the open provider session')
  check(provider.createCalls, 1, 'Repeat checkout does not create a second provider session')

  const firstAttempt = await PaymentAttempt.findOne({ requestId: first.payment.id }).lean()
  const paidSession = { ...provider.sessions.get(firstAttempt.providerSessionId), status: 'complete', paymentStatus: 'paid' }
  provider.sessions.set(paidSession.id, paidSession)
  check((await reconcileProviderSession(paidSession, { eventId: randomUUID(), eventType: 'checkout.session.completed' })).status, 'paid', 'Verified provider result marks request paid')
  check((await reconcileProviderSession({ ...paidSession, status: 'expired', paymentStatus: 'unpaid' })).status, 'paid', 'Delayed expiry cannot reverse paid status')
  await rejectsCode(() => cancelPaymentRequest(actors.admin, first.payment.id, options), 'PAYMENT_PAID', 'Paid request cannot be cancelled')

  const mismatchCases = [
    ['order', session => ({ ...session, orderId: randomUUID() })],
    ['attempt', session => ({ ...session, attemptId: firstAttempt._id })],
    ['amount', session => ({ ...session, amountMinor: session.amountMinor + 1 })],
    ['currency', session => ({ ...session, currency: 'usd' })],
    ['mode', session => ({ ...session, livemode: true })],
  ]
  for (const [field, change] of mismatchCases) {
    const record = await create({ title: `Mismatch ${field}` })
    await startCheckout(record.token, options)
    const attempt = await PaymentAttempt.findOne({ requestId: record.payment.id }).lean()
    const liveSession = provider.sessions.get(attempt.providerSessionId)
    await rejectsCode(() => reconcileProviderSession(change(liveSession)), 'PAYMENT_MISMATCH', `${field} mismatch cannot mark a request paid`)
    check((await PaymentRequest.findById(record.payment.id).lean()).status, field === 'attempt' ? 'pending' : 'needs_review',
      field === 'attempt' ? 'Spoofed attempt cannot change an unrelated request' : `${field} mismatch moves request to review`)
  }

  const unknown = await create({ title: 'Unknown creation recovery' })
  provider.failCreateOnce = true
  await rejectsCode(() => startCheckout(unknown.token, options), 'PAYMENT_UNCERTAIN', 'Lost provider response reports unknown outcome')
  check((await PaymentRequest.findById(unknown.payment.id).lean()).status, 'needs_review', 'Unknown provider outcome does not become a fresh attempt')
  check(await PaymentAttempt.countDocuments({ requestId: unknown.payment.id }), 1, 'Unknown outcome retains one attempt')
  check((await startCheckout(unknown.token, options)).url.startsWith('https://checkout.stripe.com/'), true, 'Retry recovers same unknown attempt')
  check(await PaymentAttempt.countDocuments({ requestId: unknown.payment.id }), 1, 'Recovery does not allocate another attempt')

  const cancellable = await create({ title: 'Cancellation safety' })
  await startCheckout(cancellable.token, options)
  check((await cancelPaymentRequest(actors.admin, cancellable.payment.id, options)).payment.status, 'cancelled', 'Provider-confirmed expiry permits cancellation')
  await rejectsCode(() => startCheckout(cancellable.token, options), 'PAYMENT_CANCELLED', 'Cancelled link cannot restart checkout')

  const processing = await create({ title: 'Processing safety' })
  await startCheckout(processing.token, options)
  const processingAttempt = await PaymentAttempt.findOne({ requestId: processing.payment.id }).lean()
  const processingSession = { ...provider.sessions.get(processingAttempt.providerSessionId), status: 'complete', paymentStatus: 'unpaid' }
  provider.sessions.set(processingSession.id, processingSession)
  check((await reconcileProviderSession(processingSession)).status, 'processing', 'Completed but unpaid session remains processing')
  await rejectsCode(() => cancelPaymentRequest(actors.admin, processing.payment.id, options), 'PAYMENT_PROCESSING', 'Processing payment cannot be cancelled')

  const failedRetry = await create({ title: 'Confirmed async failure retry' })
  await startCheckout(failedRetry.token, options, 'en')
  const failedAttempt = await PaymentAttempt.findOne({ requestId: failedRetry.payment.id }).lean()
  check(failedAttempt.successUrl.includes('?lang=en&checkout=returned'), true, 'English checkout return URL is frozen on the attempt')
  check(failedAttempt.cancelUrl.includes('?lang=en'), true, 'English checkout cancel URL is frozen on the attempt')
  await startCheckout(failedRetry.token, options, 'th')
  check((await PaymentAttempt.findById(failedAttempt._id).lean()).cancelUrl, failedAttempt.cancelUrl, 'Reused checkout keeps its original language')
  const failedSession = { ...provider.sessions.get(failedAttempt.providerSessionId), status: 'complete', paymentStatus: 'unpaid' }
  provider.sessions.set(failedSession.id, failedSession)
  check((await reconcileProviderSession(failedSession, { eventType: 'checkout.session.async_payment_failed' })).status, 'pending', 'Confirmed async failure returns request to pending')
  check((await PaymentAttempt.findById(failedAttempt._id).lean()).status, 'failed', 'Confirmed async failure is durable on the attempt')
  check((await startCheckout(failedRetry.token, options)).url.startsWith('https://checkout.stripe.com/'), true, 'Confirmed async failure permits a fresh same-gateway checkout')
  check(await PaymentAttempt.countDocuments({ requestId: failedRetry.payment.id }), 2, 'Confirmed async failure creates exactly one fresh attempt')

  const failedCancel = await create({ title: 'Confirmed async failure cancellation' })
  await startCheckout(failedCancel.token, options)
  const cancelAttempt = await PaymentAttempt.findOne({ requestId: failedCancel.payment.id }).lean()
  const cancelSession = { ...provider.sessions.get(cancelAttempt.providerSessionId), status: 'complete', paymentStatus: 'unpaid' }
  provider.sessions.set(cancelSession.id, cancelSession)
  await reconcileProviderSession(cancelSession, { eventType: 'checkout.session.async_payment_failed' })
  check((await cancelPaymentRequest(actors.admin, failedCancel.payment.id, options)).payment.status, 'cancelled', 'Confirmed async failure permits cancellation')

  const raced = await create({ title: 'Overlapping provider events' })
  await startCheckout(raced.token, options)
  const racedAttempt = await PaymentAttempt.findOne({ requestId: raced.payment.id }).lean()
  const openSession = provider.sessions.get(racedAttempt.providerSessionId)
  await PaymentRequest.collection.updateOne({ _id: raced.payment.id }, { $set: { status: 'needs_review' } })
  const originalFindOneAndUpdate = PaymentRequest.findOneAndUpdate
  let enterOpenSync
  let releaseOpenSync
  const openSyncEntered = new Promise(resolve => { enterOpenSync = resolve })
  const openSyncReleased = new Promise(resolve => { releaseOpenSync = resolve })
  let delayed = false
  PaymentRequest.findOneAndUpdate = function (filter, update, updateOptions) {
    if (!delayed && filter?._id === raced.payment.id && filter.version !== undefined && update?.$set?.status === 'pending') {
      delayed = true
      return { lean: async () => {
        enterOpenSync()
        await openSyncReleased
        return originalFindOneAndUpdate.call(this, filter, update, updateOptions).lean()
      } }
    }
    return originalFindOneAndUpdate.call(this, filter, update, updateOptions)
  }
  try {
    const staleOpen = reconcileProviderSession(openSession)
    await openSyncEntered
    const pendingSession = { ...openSession, status: 'complete', paymentStatus: 'unpaid' }
    provider.sessions.set(pendingSession.id, pendingSession)
    await reconcileProviderSession(pendingSession)
    releaseOpenSync()
    await staleOpen
    check((await PaymentRequest.findById(raced.payment.id).lean()).status, 'processing', 'Older open event cannot regress a newer processing request')
    check((await PaymentAttempt.findById(racedAttempt._id).lean()).status, 'pending', 'Overlapping event keeps authoritative pending attempt')
  } finally {
    releaseOpenSync()
    PaymentRequest.findOneAndUpdate = originalFindOneAndUpdate
  }

  const expired = await create({ title: 'Expired link' })
  await PaymentRequest.collection.updateOne({ _id: expired.payment.id }, { $set: { expiresAt: new Date(Date.now() - 1000) } })
  await rejectsCode(() => startCheckout(expired.token, options), 'PAYMENT_EXPIRED', 'Expired request cannot start checkout')
  check((await refreshPaymentRequest(actors.admin, expired.payment.id, options)).payment.status, 'expired', 'Administrator sees expired status after refresh')

  console.log(`${checks} isolated payment service checks passed.`)
} finally {
  await mongoose.disconnect()
  await mongo?.stop()
  if (path.dirname(path.resolve(dbPath)) === path.resolve(process.cwd())) {
    await rm(dbPath, { recursive: true, force: true })
  }
}
