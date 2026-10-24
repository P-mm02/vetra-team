import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

// Loaded only by the isolated migration test. Fail closed if a child process
// could otherwise use a configured Cloudinary account or the real network.
assert.equal(process.env.CLOUDINARY_CLOUD_NAME, 'migration-test-cloud')
assert.equal(process.env.CLOUDINARY_API_KEY, 'migration-test-key')
assert.equal(process.env.CLOUDINARY_API_SECRET, 'migration-test-secret')

const assets = new Map()
const uploadUrl = 'https://api.cloudinary.com/v1_1/migration-test-cloud/image/upload'
const deliveryPrefix = 'https://res.cloudinary.com/migration-test-cloud/image/upload/v1/'
const hash = (bytes, algorithm = 'sha256') => createHash(algorithm).update(bytes).digest('hex')

globalThis.fetch = async (input, options = {}) => {
  const url = String(input)
  if (url === uploadUrl) {
    assert.equal(options.method, 'POST')
    const form = options.body
    assert.equal(form.get('api_key'), 'migration-test-key')
    assert.equal(form.get('overwrite'), 'false')
    const params = [...form.entries()]
      .filter(([key]) => !['file', 'api_key', 'signature'].includes(key))
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`).join('&')
    assert.equal(form.get('signature'), hash(`${params}migration-test-secret`))

    const file = form.get('file')
    assert.ok(file instanceof Blob)
    const bytes = Buffer.from(await file.arrayBuffer())
    const publicId = String(form.get('public_id'))
    assert.match(publicId, /^vetra-team\/cms\/project-import\/[a-f0-9]{64}$/)
    assert.equal(publicId.split('/').at(-1), hash(bytes), 'public ID is content-derived')
    const previous = assets.get(publicId)
    if (previous) assert.deepEqual(previous.bytes, bytes, 'repeat upload uses identical bytes')
    else assets.set(publicId, { bytes, contentType: file.type })

    return Response.json({
      public_id: publicId,
      resource_type: 'image',
      type: 'upload',
      secure_url: `${deliveryPrefix}${publicId}`,
      bytes: bytes.length,
      etag: hash(bytes, 'md5'),
    })
  }

  if (url.startsWith(deliveryPrefix)) {
    const publicId = url.slice(deliveryPrefix.length)
    const asset = assets.get(publicId)
    assert.ok(asset, `delivery requires an uploaded asset: ${publicId}`)
    return new Response(asset.bytes, { status: 200, headers: { 'content-type': asset.contentType } })
  }

  throw new Error(`Unexpected network request in isolated migration test: ${url}`)
}
