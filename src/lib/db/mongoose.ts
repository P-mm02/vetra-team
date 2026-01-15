// src/lib/db/mongoose.ts
import mongoose from 'mongoose'

const _uri = process.env.MONGODB_URI
if (!_uri) {
  throw new Error('Missing env: MONGODB_URI')
}
const uri: string = _uri

declare global {
  // eslint-disable-next-line no-var
  var __mongoose:
    | { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null }
    | undefined
}

const cached =
  global.__mongoose || (global.__mongoose = { conn: null, promise: null })

export async function connectMongo(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(uri, {
        maxPoolSize: 10,
      })
      .then((m) => m)
  }

  cached.conn = await cached.promise
  return cached.conn
}
