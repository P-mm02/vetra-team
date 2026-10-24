import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { fileURLToPath } from 'node:url'
import { MongoClient } from 'mongodb'
import { MongoMemoryServer } from 'mongodb-memory-server'

const root = fileURLToPath(new URL('..', import.meta.url))
const mongo = await MongoMemoryServer.create({ instance: { dbName: 'vetra_auth_test' } })
const client = new MongoClient(mongo.getUri('vetra_auth_test'))
const args = ['--username=firstadmin', '--email=firstadmin@example.invalid']

async function runSetup(expectedDb) {
  const child = spawn(process.execPath,
    ['--import', 'tsx', 'scripts/create-first-admin.mjs', `--expected-db=${expectedDb}`, ...args],
    { cwd: root, env: { ...process.env, MONGODB_URI: mongo.getUri('vetra_auth_test') }, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] })
  let stdout = '', stderr = ''
  child.stdout.on('data', chunk => { stdout += chunk })
  child.stderr.on('data', chunk => { stderr += chunk })
  const [code] = await once(child, 'exit')
  return { code, stdout, stderr }
}

try {
  await client.connect()
  const collection = client.db('vetra_auth_test').collection('users')
  const wrong = await runSetup('another_database')
  assert.notEqual(wrong.code, 0, 'Wrong database name must be rejected')
  assert.equal(await collection.countDocuments({}), 0)

  const first = await runSetup('vetra_auth_test')
  assert.equal(first.code, 0, first.stderr)
  assert.match(first.stdout, /Temporary password \(shown once\): [A-Za-z0-9_-]{32}/)
  const user = await collection.findOne({ username: 'firstadmin' })
  assert.equal(user?.role, 'admin')
  assert.equal(user?.isActive, true)
  assert.match(user?.passwordHash || '', /^scrypt\$/)

  const repeated = await runSetup('vetra_auth_test')
  assert.notEqual(repeated.code, 0, 'A second first-admin setup must be rejected')
  assert.equal(await collection.countDocuments({}), 1)
  console.log('First-admin database guard, account creation, password hashing, and duplicate protection passed in an isolated database.')
} finally {
  await client.close()
  await mongo.stop()
}
