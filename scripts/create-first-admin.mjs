/**
 * Provision the first CMS administrator in the database selected by .env.local.
 * This deliberately refuses to add an account after any user already exists.
 *
 * npm run admin:create-first -- --expected-db=vetra --username=admin --email=you@example.com
 */
import { randomBytes } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import nextEnv from '@next/env'
import mongoose from 'mongoose'

const root = fileURLToPath(new URL('..', import.meta.url))
nextEnv.loadEnvConfig(root)

const options = Object.fromEntries(process.argv.slice(2).map(argument => {
  const match = /^--(expected-db|username|email)=(.+)$/.exec(argument)
  if (!match) throw new Error(`Unexpected argument: ${argument}`)
  return [match[1], match[2]]
}))
const databaseName = options['expected-db']
const username = options.username?.trim().toLowerCase()
const email = options.email?.trim().toLowerCase()
if (!databaseName || !/^[a-zA-Z0-9_-]+$/.test(databaseName)) throw new Error('Pass --expected-db=<database>.')
if (!username || username.length < 3 || username.length > 30 ||
    !/^[a-z0-9](?:[a-z0-9_.]*[a-z0-9])?$/.test(username)) throw new Error('Pass a valid --username (3–30 characters).')
if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Pass a real --email address.')

const { connectMongo } = await import('../src/lib/db/mongoose.ts')
const { User } = await import('../src/models/User/User.ts')
const { ensureUserIdentityIndexes } = await import('../src/models/User/ensureIdentityIndexes.ts')
const { hashPassword, verifyPassword } = await import('../src/lib/auth/password.ts')

try {
  const mongo = await connectMongo()
  if (mongo.connection.db.databaseName !== databaseName) throw new Error('Database guard failed: the URI selects a different database.')
  if (await User.countDocuments({}) !== 0) throw new Error('Users already exist. Manage accounts through the CMS instead.')
  await ensureUserIdentityIndexes()
  const password = randomBytes(24).toString('base64url')
  const passwordHash = await hashPassword(password)
  const admin = await User.create({
    _id: new mongoose.Types.ObjectId('000000000000000000000001'),
    username, email, passwordHash, role: 'admin', isActive: true,
    passwordChangedAt: new Date(), loginAttempts: 0, lockUntil: null,
  })
  const saved = await User.findById(admin._id).select({ passwordHash: 1, role: 1, isActive: 1 }).lean()
  if (!saved || saved.role !== 'admin' || !saved.isActive || !await verifyPassword(password, saved.passwordHash)) {
    throw new Error('The new account could not be verified. Check the database before retrying.')
  }
  console.log(`Created first admin in database ${databaseName}.`)
  console.log(`Username: ${username}`)
  console.log(`Email: ${email}`)
  console.log(`Temporary password (shown once): ${password}`)
  console.log('Sign in and change this password in CMS → Users → your account.')
} finally {
  await mongoose.disconnect()
}
