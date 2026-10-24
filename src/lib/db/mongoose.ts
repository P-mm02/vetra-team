// src/lib/db/mongoose.ts
import mongoose from 'mongoose'

// 1) Global mongoose config (safe defaults)
mongoose.set('strictQuery', true) // prevent unknown query keys from behaving unexpectedly
mongoose.set('autoIndex', process.env.NODE_ENV !== 'production') // avoid index-build cost in prod cold starts

// 2) Extend Node global type for dev hot-reload caching
declare global {
  var __mongoose:
    | {
        conn: typeof mongoose | null // cached connected instance
        promise: Promise<typeof mongoose> | null // cached in-flight connection promise
      }
    | undefined
}

// 3) Create/get global cache container (prevents many connections in dev)
const cached =
  global.__mongoose ?? (global.__mongoose = { conn: null, promise: null })

// 4) Connect helper used by server routes/actions
export async function connectMongo(): Promise<typeof mongoose> {
  // Read the URI on connection, so importing a public page can show a controlled
  // unavailable state if deployment configuration is missing.
  const uri = process.env.MONGODB_URI
  if (!uri) throw new Error('Missing env: MONGODB_URI')

  // Return existing connection if available
  if (cached.conn) return cached.conn

  // Create a single shared connection promise if none exists
  if (!cached.promise) {
    cached.promise = mongoose
      .connect(uri, {
        maxPoolSize: 10, // limit concurrent sockets
        bufferCommands: false, // don’t queue ops when disconnected (fail fast)
        serverSelectionTimeoutMS: 8000, // bail quickly if DB is unreachable
        connectTimeoutMS: 8000, // fail quickly on slow connect
        appName: process.env.NEXT_PUBLIC_APP_NAME || 'vetra-cms', // helps identify connections in Mongo
      })
      .then((m) => m) // keep type as typeof mongoose
      .catch((err) => {
        cached.promise = null // allow retry on next call if connect failed
        throw err
      })
  }

  // Await the shared promise and store the resolved connection
  cached.conn = await cached.promise
  return cached.conn
}
