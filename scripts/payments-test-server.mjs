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
    assert.equal(actual, expected, label)
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
  const created = await request('/api/admin/payments', { cookie: dev, method: 'POST', body: payload })
  check(created.response.status, 201, 'Developer can create a request while checkout is disabled')
  const requestId = created.data.payment.id
  check((await db.collection('paymentrequests').countDocuments({ _id: requestId })), 1, 'Request is stored in isolated database')
  const record = await db.collection('paymentrequests').findOne({ _id: requestId })
  check((await request(`/api/payments/${record.shareToken}`)).response.status, 200, 'Public token can read safe request details')
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
