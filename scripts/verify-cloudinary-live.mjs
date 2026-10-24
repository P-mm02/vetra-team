import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import nextEnv from '@next/env'
import { MongoMemoryServer } from 'mongodb-memory-server'
import sharp from 'sharp'

nextEnv.loadEnvConfig(process.cwd())
for (const name of ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET']) {
  if (!process.env[name]?.trim()) throw new Error(`${name} is missing. Add it to .env.local before verification.`)
}

// The provider request is real. Every database write is isolated from the
// configured application database, and the generated image is disposable.
const mongo = await MongoMemoryServer.create({ instance: { dbName: 'vetra_cloudinary_verification' } })
process.env.MONGODB_URI = mongo.getUri('vetra_cloudinary_verification')
process.env.AUTH_SECRET = 'isolated-cloudinary-verification-secret-2026'

const { connectMongo } = await import('../src/lib/db/mongoose.ts')
const { MediaAsset } = await import('../src/lib/cms/models.ts')
const { uploadImage, cleanupMedia } = await import('../src/lib/cms/media.ts')
const mongoose = await connectMongo()
const actorId = randomUUID(), submissionId = randomUUID(), uploadKey = randomUUID()
const publicId = `vetra-team/cms/${actorId}/${submissionId}/${uploadKey}`
let cleaned = false

try {
  const bytes = await sharp({ create: { width: 32, height: 32, channels: 4, background: '#4e5cb4' } }).webp().toBuffer()
  const file = new File([bytes], 'vetra-verification.webp', { type: 'image/webp' })
  const uploaded = await uploadImage(file, submissionId, uploadKey, actorId)
  assert.equal(uploaded.publicId, publicId)
  assert.ok(uploaded.src.startsWith(`https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/`))
  assert.equal((await MediaAsset.findById(publicId).lean())?.status, 'ready')
  const served = await fetch(uploaded.src, { signal: AbortSignal.timeout(15000) })
  assert.equal(served.status, 200, 'Cloudinary serves the uploaded image')
  assert.match(served.headers.get('content-type') || '', /^image\//)

  const result = await cleanupMedia(actorId, submissionId)
  assert.deepEqual(result, { deleted: 1, failed: 0 }, 'disposable image must be removed from Cloudinary')
  cleaned = true
  console.log('Signed upload, image delivery, and confirmed cleanup succeeded. The application database was not used.')
} finally {
  if (!cleaned) {
    const asset = await MediaAsset.findById(publicId).lean().catch(() => null)
    if (asset?.status === 'ready') {
      const result = await cleanupMedia(actorId, submissionId).catch(() => null)
      cleaned = result?.deleted === 1
    }
    if (!cleaned && asset) console.error(`Verification asset needs review in Cloudinary: ${publicId}`)
  }
  await mongoose.disconnect()
  await mongo.stop()
}
