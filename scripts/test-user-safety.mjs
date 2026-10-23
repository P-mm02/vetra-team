import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import path from 'node:path'
import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'

const dbPath = await mkdtemp(path.join(process.cwd(), '.cms-test-mongo-'))
let mongo
try {
  mongo = await MongoMemoryServer.create({ instance: { dbName: 'vetra_user_safety_test', dbPath } })
} catch (error) {
  if (path.dirname(path.resolve(dbPath)) === path.resolve(process.cwd())) await rm(dbPath, { recursive: true, force: true })
  throw error
}
process.env.MONGODB_URI = mongo.getUri('vetra_user_safety_test')
process.env.AUTH_SECRET = 'isolated-user-safety-test-secret-2026'
process.env.NODE_ENV = 'production' // Exercise the explicit-index path.

let checks = 0
const check = (actual, expected, label) => {
  assert.equal(actual, expected, label)
  checks++
  console.log(`PASS ${label}`)
}

try {
  const { User } = await import('../src/models/User/User.ts')
  const { ensureUserIdentityIndexes } = await import('../src/models/User/ensureIdentityIndexes.ts')
  const { softDeleteUser, restoreTrashedUser, listTrashedUsers, permanentlyDeleteExpiredUser, purgeExpiredUsers } = await import('../src/lib/cms/user-trash.ts')
  await ensureUserIdentityIndexes()
  const indexes = await User.collection.indexes()
  check(indexes.some(index => index.name === 'uniq_email' && index.unique), true, 'Email uniqueness exists with production autoIndex disabled')
  check(indexes.some(index => index.name === 'uniq_username' && index.unique), true, 'Username uniqueness exists with production autoIndex disabled')

  const create = (username, role) => User.create({ username, email: `${username}@example.invalid`, passwordHash: 'x'.repeat(30), role, isActive: true })
  const dev = await create('dev1', 'dev')
  const admin = await create('admin1', 'admin')
  const viewer = await create('viewer1', 'viewer')
  const devActor = { id: String(dev._id), role: 'dev' }
  const adminActor = { id: String(admin._id), role: 'admin' }

  check((await softDeleteUser(String(dev._id), devActor, 0)).code, 'self_delete', 'Current user cannot delete their own account')
  check((await softDeleteUser(String(dev._id), adminActor, 0)).code, 'forbidden', 'Administrator cannot delete a developer')
  check((await softDeleteUser(String(admin._id), devActor, 0)).code, 'last_privileged', 'Last active administrator is protected')
  check((await softDeleteUser(String(dev._id), { id: String(viewer._id), role: 'dev' }, 0)).code, 'forbidden', 'Forged actor role is checked against database')

  const secondAdmin = await create('admin2', 'admin')
  check((await softDeleteUser(String(admin._id), devActor, 0)).ok, true, 'One of two administrators can move to Trash')
  check((await softDeleteUser(String(admin._id), devActor, 0)).code, 'not_found', 'Trashed account cannot be deleted twice')
  check((await restoreTrashedUser(String(admin._id), { id: String(secondAdmin._id), role: 'admin' }, 0)).code, 'conflict', 'Stale Trash restore version is rejected')
  check((await restoreTrashedUser(String(admin._id), { id: String(secondAdmin._id), role: 'admin' }, 1)).ok, true, 'Administrator restores account before expiry')

  const secondDev = await create('dev2', 'dev')
  check((await softDeleteUser(String(secondDev._id), devActor, 0)).ok, true, 'Developer can move another developer to Trash')
  check((await listTrashedUsers({ id: String(secondAdmin._id), role: 'admin' })).some(item => item.id === String(secondDev._id)), false, 'Administrator cannot see developer Trash records')
  check((await listTrashedUsers(devActor)).some(item => item.id === String(secondDev._id)), true, 'Developer can see developer Trash records')

  check((await permanentlyDeleteExpiredUser(String(secondDev._id), devActor, 1)).code, 'not_expired', 'Account cannot be permanently deleted before 30 days')
  await User.collection.updateOne({ _id: secondDev._id }, { $set: { purgeAt: new Date(Date.now() - 1000) } })
  check((await restoreTrashedUser(String(secondDev._id), devActor, 1)).code, 'expired', 'Expired account cannot be restored')
  check(await purgeExpiredUsers(), 1, 'Expiry job purges only expired account')
  check(await User.countDocuments({ _id: secondDev._id }), 0, 'Expired account is gone')
  console.log(`${checks} isolated account safety checks passed.`)
} finally {
  await mongoose.disconnect()
  await mongo.stop()
  if (path.dirname(path.resolve(dbPath)) === path.resolve(process.cwd())) await rm(dbPath, { recursive: true, force: true })
}
