import crypto from 'node:crypto'
import mongoose, { Schema } from 'mongoose'
import { connectMongo } from '@/lib/db/mongoose'

type LockDoc = { _id: string; owner?: string; expiresAt: Date }
const UserSafetyLock =
  (mongoose.models.UserSafetyLock as mongoose.Model<LockDoc>) ||
  mongoose.model<LockDoc>(
    'UserSafetyLock',
    new Schema<LockDoc>({ _id: String, owner: String, expiresAt: { type: Date, required: true } }),
  )

export class UserSafetyBusyError extends Error {}

/** Serialize account removals and role/status changes across app instances. */
export async function withUserSafetyLock<T>(work: () => Promise<T>): Promise<T> {
  await connectMongo()
  const owner = crypto.randomUUID()
  const now = new Date()
  let acquired = false
  try {
    const lock = await UserSafetyLock.findOneAndUpdate(
      { _id: 'privileged-users', expiresAt: { $lte: now } },
      { $set: { owner, expiresAt: new Date(now.getTime() + 120000) } },
      { upsert: true, returnDocument: 'after' },
    ).lean<LockDoc | null>()
    acquired = lock?.owner === owner
  } catch (error) {
    // A simultaneous upsert against the same _id means another request owns it.
    if ((error as { code?: number })?.code !== 11000) throw error
  }
  if (!acquired) throw new UserSafetyBusyError('Another account change is in progress.')

  try {
    return await work()
  } finally {
    // A crashed process leaves only a short lease; a release failure must not
    // turn a completed account change into an apparent failure.
    await UserSafetyLock.updateOne(
      { _id: 'privileged-users', owner },
      { $set: { expiresAt: new Date(0) }, $unset: { owner: 1 } },
    ).catch(() => undefined)
  }
}
