import { connectMongo } from '@/lib/db/mongoose'
import { User } from './User'

// Mongoose autoIndex is disabled in production. Every identity writer waits for
// these database constraints so concurrent requests cannot create duplicates.
let identityIndexes: Promise<void> | null = null

export async function ensureUserIdentityIndexes(): Promise<void> {
  await connectMongo()
  if (!identityIndexes) {
    identityIndexes = (async () => {
      await User.collection.createIndex({ email: 1 }, { unique: true, name: 'uniq_email' })
      await User.collection.createIndex(
        { username: 1 },
        { unique: true, name: 'uniq_username', partialFilterExpression: { username: { $type: 'string' } } },
      )
    })().catch((error: unknown) => {
      identityIndexes = null
      throw error
    })
  }
  await identityIndexes
}
