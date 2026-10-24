import assert from 'node:assert/strict'
import { randomBytes, randomUUID, scryptSync } from 'node:crypto'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { createServer } from 'node:net'
import { mkdtemp, rm } from 'node:fs/promises'
import path from 'node:path'
import { MongoClient } from 'mongodb'
import { MongoMemoryServer } from 'mongodb-memory-server'

const port = 43188
const base = `http://127.0.0.1:${port}`

const probe = createServer()
await new Promise((resolve, reject) => {
  probe.once('error', () => reject(new Error(`Port ${port} is already in use. Stop the previous payment test server first.`)))
  probe.listen(port, '127.0.0.1', () => probe.close(resolve))
})

const dbPath = await mkdtemp(path.join(process.cwd(), '.payment-route-mongo-'))
let mongo
try {
  mongo = await MongoMemoryServer.create({ instance: { dbName: 'vetra_payment_route_test', dbPath } })
} catch (error) {
  if (path.dirname(path.resolve(dbPath)) === path.resolve(process.cwd())) {
    await rm(dbPath, { recursive: true, force: true })
  }
  throw error
}
const client = await MongoClient.connect(mongo.getUri())
const db = client.db('vetra_payment_route_test')
const salt = randomBytes(16)
const password = 'Test-payments-only-2026!'
const passwordHash = ['scrypt', 16384, 8, 1, salt.toString('base64url'), scryptSync(password, salt, 64).toString('base64url')].join(String.fromCharCode(36))
await db.collection('users').insertMany(['dev', 'admin', 'editor', 'viewer'].map(role => ({
  username: `payment${role}`, email: `payment${role}@example.invalid`, passwordHash,
  role, isActive: true, deletedAt: null, purgeAt: null, __v: 0,
  createdAt: new Date(), updatedAt: new Date(),
})))

const child = spawn(process.execPath, [
  'node_modules/next/dist/bin/next', 'dev', '--webpack', '--hostname', '127.0.0.1', '--port', String(port),
], { env: {
  ...process.env,
  CMS_ISOLATED_TEST: 'true',
  MONGODB_URI: mongo.getUri('vetra_payment_route_test'),
  AUTH_SECRET: 'isolated-payment-route-test-secret-2026',
  SESSION_COOKIE_NAME: 'vetra_payment_route_test_session',
  NEXT_PUBLIC_SITE_URL: base,
  PAYMENTS_ENABLED: 'false', STRIPE_MODE: 'test', STRIPE_SECRET_KEY: '', STRIPE_WEBHOOK_SECRET: '',
  CMS_BOOTSTRAP_TOKEN: '', CLOUDINARY_CLOUD_NAME: '', CLOUDINARY_API_KEY: '', CLOUDINARY_API_SECRET: '',
  NEXT_PUBLIC_GA_ID: '', GA4_PROPERTY_ID: '', GA4_CLIENT_EMAIL: '', GA4_PRIVATE_KEY: '',
}, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true })
child.stdout.on('data', chunk => process.stdout.write(chunk))
child.stderr.on('data', chunk => process.stderr.write(chunk))

let stopped = false
async function stop() {
  if (stopped) return
  stopped = true
  child.kill()
  await client.close()
  await mongo.stop()
  if (path.dirname(path.resolve(dbPath)) === path.resolve(process.cwd())) {
    await rm(dbPath, { recursive: true, force: true })
  }
}
process.on('SIGINT', async () => { await stop(); process.exit() })
process.on('SIGTERM', async () => { await stop(); process.exit() })

async function request(path, { cookie, method = 'GET', body, origin = base } = {}) {
  const response = await fetch(base + path, {
    method, redirect: 'manual',
    headers: {
      ...(cookie ? { cookie } : {}),
      ...(body ? { 'content-type': 'application/json' } : {}),
      origin,
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await response.text()
  let data
  try { data = JSON.parse(text) } catch { data = text }
  return { response, data }
}

async function testRoutes() {
  let checks = 0
  const check = (actual, expected, label) => {
    assert.deepEqual(actual, expected, label)
    checks++
    console.log(`PASS ${label}`)
  }
  const login = async role => {
    const { response } = await request('/api/auth/login', {
      method: 'POST', body: { username: `payment${role}`, password },
    })
    check(response.status, 200, `${role} test login succeeds`)
    return response.headers.get('set-cookie').split(';')[0]
  }

  check((await request('/api/admin/payments')).response.status, 401, 'Anonymous payment administration is rejected')
  const dev = await login('dev')
  const admin = await login('admin')
  const editor = await login('editor')
  const viewer = await login('viewer')
  const presetDetails = {
    gateway: 'stripe', kind: 'service', title: 'Website deposit',
    description: 'Deposit for a website project — disposable local fixture.', amount: '12500.00',
    customerName: 'Example customer', customerEmail: 'customer@example.invalid',
    reference: 'DEMO-WEB-001', internalNote: 'Sample information for isolated payment preset checks.', expiresInDays: 90,
  }
  const presetPayload = { idempotencyKey: randomUUID(), name: 'Website deposit', details: presetDetails }
  const requestCountBeforePresets = await db.collection('paymentrequests').countDocuments()
  const attemptCountBeforePresets = await db.collection('paymentattempts').countDocuments()
  check((await request('/api/admin/payment-presets')).response.status, 401, 'Anonymous users cannot read saved payment information')
  for (const [role, cookie] of [['editor', editor], ['viewer', viewer]]) {
    check((await request('/api/admin/payment-presets', { cookie })).response.status, 403, `${role} cannot list payment presets`)
    check((await request('/api/admin/payment-presets', { cookie, method: 'POST', body: presetPayload })).response.status, 403, `${role} cannot save payment presets`)
  }
  check((await request('/api/admin/payment-presets', {
    cookie: admin, method: 'POST', body: presetPayload, origin: 'https://untrusted.invalid',
  })).response.status, 403, 'Cross-origin preset creation is rejected')
  const savedPreset = await request('/api/admin/payment-presets', { cookie: admin, method: 'POST', body: presetPayload })
  check(savedPreset.response.status, 201, 'Administrator can save a payment preset')
  const preset = savedPreset.data.preset
  check(preset.name, presetPayload.name, 'Saved preset retains its name')
  for (const [field, value] of Object.entries(presetDetails)) {
    check(preset.details[field], value, `Saved preset retains ${field}`)
  }
  check(Number.isInteger(preset.version), true, 'Saved preset includes its concurrency version')
  check(Number.isNaN(Date.parse(preset.createdAt)), false, 'Saved preset includes its creation date')
  check(Number.isNaN(Date.parse(preset.updatedAt)), false, 'Saved preset includes its update date')
  const devPresets = await request('/api/admin/payment-presets', { cookie: dev })
  check(devPresets.response.status, 200, 'Developer can read shared payment presets')
  check(devPresets.data.presets.find(item => item.id === preset.id)?.name, preset.name, 'Developer sees the administrator saved preset')
  const replayedPreset = await request('/api/admin/payment-presets', { cookie: admin, method: 'POST', body: presetPayload })
  check(replayedPreset.response.status, 201, 'Retrying a preset save succeeds')
  check(replayedPreset.data.preset.id, preset.id, 'Retrying a preset save returns the same preset')
  const afterReplay = await request('/api/admin/payment-presets', { cookie: admin })
  check(afterReplay.data.presets.filter(item => item.id === preset.id).length, 1, 'Preset save retry does not duplicate the preset')
  const updatedDetails = { ...presetDetails, description: 'Updated deposit details.', amount: '15000.00', expiresInDays: 30 }
  const updatePayload = { expectedVersion: preset.version, name: 'Website deposit (updated)', details: updatedDetails }
  const presetPath = `/api/admin/payment-presets/${preset.id}`
  check((await request(presetPath, { method: 'PATCH', body: updatePayload })).response.status, 401, 'Anonymous users cannot update payment presets')
  for (const [role, cookie] of [['editor', editor], ['viewer', viewer]]) {
    check((await request(presetPath, { cookie, method: 'PATCH', body: updatePayload })).response.status, 403, `${role} cannot update payment presets`)
  }
  check((await request(presetPath, {
    cookie: admin, method: 'PATCH', body: updatePayload, origin: 'https://untrusted.invalid',
  })).response.status, 403, 'Cross-origin preset update is rejected')
  const updatedPreset = await request(presetPath, { cookie: dev, method: 'PATCH', body: updatePayload })
  check(updatedPreset.response.status, 200, 'Developer can update a shared payment preset')
  check(updatedPreset.data.preset.id, preset.id, 'Updating a preset retains its identity')
  check(updatedPreset.data.preset.name, updatePayload.name, 'Updating a preset saves its new name')
  check(updatedPreset.data.preset.version, preset.version + 1, 'Updating a preset advances its concurrency version')
  for (const [field, value] of Object.entries(updatedDetails)) {
    check(updatedPreset.data.preset.details[field], value, `Updated preset retains ${field}`)
  }
  check((await request(presetPath, { cookie: admin, method: 'PATCH', body: updatePayload })).response.status, 409, 'A stale preset update is rejected')
  check((await request('/api/admin/payment-presets', {
    cookie: admin, method: 'POST', body: { ...presetPayload, idempotencyKey: randomUUID(), details: { ...presetDetails, amount: '1.00' } },
  })).response.status, 400, 'Saving a preset with an invalid payment amount is rejected')
  check((await request(presetPath, {
    cookie: admin, method: 'PATCH', body: {
      ...updatePayload, expectedVersion: updatedPreset.data.preset.version, details: { ...updatedDetails, amount: '1e3' },
    },
  })).response.status, 400, 'Updating a preset with an invalid payment amount is rejected')
  const blankPresetDetails = {
    ...presetDetails, title: '', description: '', amount: '', customerName: '',
    customerEmail: '', reference: '', internalNote: '',
  }
  const blankPreset = await request('/api/admin/payment-presets', {
    cookie: admin, method: 'POST', body: {
      idempotencyKey: randomUUID(), name: '', details: blankPresetDetails,
    },
  })
  check(blankPreset.response.status, 201, 'A preset with empty payment fields can be saved')
  check(blankPreset.data.preset.name, `Preset ${blankPreset.data.preset.id.slice(0, 8)}`, 'An empty preset name gets a generated label')
  check(blankPreset.data.preset.details, blankPresetDetails, 'Empty payment fields round-trip through the API')
  const finalPresets = await request('/api/admin/payment-presets', { cookie: admin })
  const finalPreset = finalPresets.data.presets.find(item => item.id === preset.id)
  check(finalPresets.data.presets.find(item => item.id === blankPreset.data.preset.id)?.details,
    blankPresetDetails, 'A blank preset remains available to load')
  check(finalPreset.details.amount, updatedDetails.amount, 'Rejected updates preserve the saved preset amount')
  check(finalPreset.version, updatedPreset.data.preset.version, 'Rejected updates preserve the saved preset version')
  check(await db.collection('paymentrequests').countDocuments(), requestCountBeforePresets, 'Saving and updating presets creates no payment request')
  check(await db.collection('paymentattempts').countDocuments(), attemptCountBeforePresets, 'Saving and updating presets creates no payment attempt')

  if (process.argv.includes('--serve')) {
    const maintenance = await request('/api/admin/payment-presets', {
      cookie: admin, method: 'POST', body: {
        idempotencyKey: randomUUID(), name: 'Recurring maintenance', details: {
          ...presetDetails, title: 'Website maintenance', description: 'Monthly website maintenance — disposable local fixture.',
          amount: '2500.00', reference: 'DEMO-MAINT-001', expiresInDays: 14,
        },
      },
    })
    check(maintenance.response.status, 201, 'Manual UI review has a second disposable payment preset')
  }

  check((await request('/api/admin/payments', { cookie: editor })).response.status, 403, 'Editor cannot list financial records')
  check((await request('/api/admin/payments', { cookie: viewer })).response.status, 403, 'Viewer cannot list financial records')
  const list = await request('/api/admin/payments', { cookie: admin })
  check(list.response.status, 200, 'Administrator can list payment requests')
  check(list.data.configuration.gateways.find(gateway => gateway.id === 'stripe').ready, false, 'Checkout reports missing configuration')
  const payload = {
    idempotencyKey: randomUUID(), gateway: 'stripe', kind: 'service', title: 'Isolated route test request',
    amount: '250.00', description: 'Disposable test only', expiresInDays: 7,
  }
  check((await request('/api/admin/payments', { cookie: viewer, method: 'POST', body: payload })).response.status, 403, 'Viewer cannot create a payment request')
  check((await request('/api/admin/payments', { cookie: admin, method: 'POST', body: payload, origin: 'https://untrusted.invalid' })).response.status, 403, 'Cross-origin creation is rejected')
  check((await request('/api/admin/payments', { cookie: dev, method: 'POST', body: { ...payload, idempotencyKey: randomUUID(), title: '' } })).response.status, 400, 'Payment creation still requires a title')
  check((await request('/api/admin/payments', { cookie: dev, method: 'POST', body: { ...payload, idempotencyKey: randomUUID(), amount: '' } })).response.status, 400, 'Payment creation still requires an amount')
  const created = await request('/api/admin/payments', { cookie: dev, method: 'POST', body: payload })
  check(created.response.status, 201, 'Developer can create a request while checkout is disabled')
  const requestId = created.data.payment.id
  check((await db.collection('paymentrequests').countDocuments({ _id: requestId })), 1, 'Request is stored in isolated database')
  const record = await db.collection('paymentrequests').findOne({ _id: requestId })
  check((await request(`/api/payments/${record.shareToken}`)).response.status, 200, 'Public token can read safe request details')
  check((await request(`/api/admin/payment-presets?token=${record.shareToken}`)).response.status, 401, 'A public payment token cannot read saved payment information')
  const checkout = await request(`/api/payments/${record.shareToken}/checkout`, { method: 'POST', body: {} })
  check(checkout.response.status, 503, 'Checkout stays unavailable without Stripe configuration')
  check((await db.collection('paymentattempts').countDocuments({ requestId })), 0, 'Disabled checkout creates no payment attempt')
  console.log(`${checks} isolated payment route checks passed.`)
}

try {
  let ready = false
  for (let count = 0; count < 120; count++) {
    if (child.exitCode !== null) throw new Error('Payment test server stopped before startup')
    try {
      const response = await fetch(base + '/admin/login')
      if (response.ok) { ready = true; break }
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 500))
  }
  if (!ready) throw new Error('Payment test server did not start')
  await testRoutes()
  if (process.argv.includes('--serve')) {
    console.log(`Payment UI test server ready at ${base}. Temporary admin: paymentdev / ${password}`)
    await once(child, 'exit')
  }
} finally {
  await stop()
}
