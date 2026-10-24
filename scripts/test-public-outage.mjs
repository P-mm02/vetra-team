import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { createServer } from 'node:net'

const port = 43189
const base = `http://127.0.0.1:${port}`
const probe = createServer()
await new Promise((resolve, reject) => {
  probe.once('error', () => reject(new Error(`Port ${port} is already in use.`)))
  probe.listen(port, '127.0.0.1', () => probe.close(resolve))
})

const child = spawn(process.execPath, [
  'node_modules/next/dist/bin/next', 'start', '--hostname', '127.0.0.1', '--port', String(port),
], {
  env: { ...process.env, MONGODB_URI: '', AUTH_SECRET: 'isolated-public-outage-test-secret-2026' },
  stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true,
})
child.stdout.on('data', chunk => process.stdout.write(chunk))
child.stderr.on('data', chunk => process.stderr.write(chunk))

try {
  let ready = false
  for (let n = 0; n < 120; n++) {
    if (child.exitCode !== null) throw new Error('Test server stopped before startup')
    try { if ((await fetch(base + '/admin/login')).ok) { ready = true; break } } catch {}
    await new Promise(resolve => setTimeout(resolve, 500))
  }
  if (!ready) throw new Error('Test server did not start')

  for (const [path, expected] of [
    ['/', 'ยังโหลดผลงานไม่ได้'],
    ['/en', 'Projects are temporarily unavailable'],
    ['/projects', 'ยังโหลดผลงานไม่ได้'],
    ['/en/projects', 'Projects are temporarily unavailable'],
  ]) {
    const response = await fetch(base + path)
    const html = await response.text()
    assert.equal(response.status, 200, `${path} remains available without MongoDB`)
    assert.ok(html.includes(expected), `${path} shows a localized portfolio notice`)
    assert.ok(!html.includes('Application error'), `${path} does not show a framework error`)
    console.log(`PASS ${path} public outage fallback`)
  }
} finally {
  child.kill()
}
