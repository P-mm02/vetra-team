import { MongoMemoryServer } from 'mongodb-memory-server'
import { MongoClient } from 'mongodb'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { createServer } from 'node:net'
import { scryptSync, randomBytes } from 'node:crypto'
import { testCms } from './test-cms.mjs'

const port = 43187, base = `http://127.0.0.1:${port}`
// Fail before opening a test database if another process owns the preview port.
const probe = createServer()
await new Promise((resolve, reject) => {
  probe.once('error', () => reject(new Error(`Port ${port} is already in use. Stop the previous CMS test server first.`)))
  probe.listen(port, '127.0.0.1', () => probe.close(resolve))
})
const mongo = await MongoMemoryServer.create({ instance: { dbName: 'vetra_cms_isolated_test' } })
const client = await MongoClient.connect(mongo.getUri())
const db = client.db('vetra_cms_isolated_test')
const salt = randomBytes(16)
const passwordHash = ['scrypt',16384,8,1,salt.toString('base64url'),scryptSync('Test-cms-only-2026!',salt,64).toString('base64url')].join(String.fromCharCode(36))
await db.collection('users').insertMany(['dev', 'admin', 'editor', 'viewer'].map(role => ({ username: `test${role}`, email: `${role}@example.invalid`, passwordHash, role, isActive: true, deletedAt: null, purgeAt: null, __v: 0, createdAt: new Date(), updatedAt: new Date() })))
const child = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'dev', '--webpack', '--hostname', '127.0.0.1', '--port', String(port)], { env: {
  ...process.env, MONGODB_URI: mongo.getUri('vetra_cms_isolated_test'), AUTH_SECRET: 'isolated-test-secret-not-for-deployment-2026',
  SESSION_COOKIE_NAME: 'vetra_cms_test_session', NEXT_PUBLIC_SITE_URL: base, CMS_BOOTSTRAP_TOKEN: 'cms-test-bootstrap-token', CRON_SECRET: 'cms-test-cron-secret',
  CLOUDINARY_CLOUD_NAME: '', CLOUDINARY_API_KEY: '', CLOUDINARY_API_SECRET: '', NEXT_PUBLIC_GA_ID: '', GA4_PROPERTY_ID: '', GA4_CLIENT_EMAIL: '', GA4_PRIVATE_KEY: '',
  PAYMENTS_ENABLED: 'false', STRIPE_MODE: 'test', STRIPE_SECRET_KEY: '', STRIPE_WEBHOOK_SECRET: '',
  CMS_ISOLATED_TEST: 'true',
}, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true })
child.stdout.on('data', b => process.stdout.write(b)); child.stderr.on('data', b => process.stderr.write(b))
let stopped = false
async function stop() { if (stopped) return; stopped = true; child.kill(); await client.close(); await mongo.stop() }
process.on('SIGINT', async () => { await stop(); process.exit() })
process.on('SIGTERM', async () => { await stop(); process.exit() })
try {
  let ready = false
  for (let n = 0; n < 120; n++) {
    if (child.exitCode !== null) throw new Error('Test server stopped before startup')
    try { const response = await fetch(base + '/admin/login'); if (response.ok) { ready = true; break } } catch {}
    await new Promise(r => setTimeout(r, 500))
  }
  if (!ready) throw new Error('Test server did not start')
  await testCms(base, db)
  if (process.argv.includes('--serve')) {
    console.log(`UI test server ready at ${base}. Temporary account testdev / Test-cms-only-2026!`)
    await once(child, 'exit')
  }
} finally { await stop() }
