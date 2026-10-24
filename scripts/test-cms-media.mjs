import assert from 'node:assert/strict'
import { createHash, randomUUID } from 'node:crypto'
import { MongoMemoryServer } from 'mongodb-memory-server'
import sharp from 'sharp'

const mongo = await MongoMemoryServer.create({ instance: { dbName: 'vetra_media_isolated_test' } })
process.env.MONGODB_URI = mongo.getUri('vetra_media_isolated_test')
process.env.AUTH_SECRET = 'isolated-media-test-secret-not-for-deployment'
process.env.CLOUDINARY_CLOUD_NAME = 'media-test-cloud'
process.env.CLOUDINARY_API_KEY = 'isolated-test-key'
process.env.CLOUDINARY_API_SECRET = 'isolated-test-secret'

const { connectMongo } = await import('../src/lib/db/mongoose.ts')
const { MediaAsset, Project, Submission } = await import('../src/lib/cms/models.ts')
const { uploadImage, cleanupMedia } = await import('../src/lib/cms/media.ts')
const { saveProject } = await import('../src/lib/cms/save-project.ts')
const { getPublicProjects, moveProjectToTrash, purgeExpiredProjects } = await import('../src/lib/cms/projects.ts')
const { localizeProject } = await import('../src/app/(site)/projects/Projects/projectContent.ts')
const mongoose = await connectMongo()
const originalFetch = globalThis.fetch
let providerResponse = 'success'
let destroyCalls = 0
let uploadCalls = 0

globalThis.fetch = async (url, options) => {
  assert.match(String(url), /^https:\/\/api\.cloudinary\.com\/v1_1\/media-test-cloud\/image\/(upload|destroy)$/)
  const form = options.body
  assert.equal(form.get('api_key'), 'isolated-test-key')
  const signed = [...form.entries()]
    .filter(([key]) => !['api_key', 'signature', 'file'].includes(key))
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`).join('&')
  const signature = createHash('sha256').update(signed + 'isolated-test-secret').digest('hex')
  assert.equal(form.get('signature'), signature, 'Cloudinary request is signed server-side')
  if (String(url).endsWith('/destroy')) {
    destroyCalls++
    return Response.json({ result: 'ok' })
  }
  uploadCalls++
  assert.ok(form.get('file') instanceof File)
  if (providerResponse === 'rejected') return Response.json({ error: { message: 'Invalid credentials' } }, { status: 401 })
  if (providerResponse === 'unknown') throw new Error('Simulated lost provider response')
  const publicId = form.get('public_id')
  return Response.json({
    public_id: publicId,
    resource_type: 'image',
    secure_url: `https://res.cloudinary.com/media-test-cloud/image/upload/v1/${publicId}.webp`,
  })
}

try {
  const actorId = randomUUID(), submissionId = randomUUID(), uploadKey = randomUUID()
  const bytes = await sharp({ create: { width: 32, height: 32, channels: 4, background: '#4e5cb4' } }).webp().toBuffer()
  const file = new File([bytes], 'project.webp', { type: 'image/webp' })

  delete process.env.CLOUDINARY_API_SECRET
  await assert.rejects(uploadImage(file, submissionId, uploadKey, actorId), /Cloudinary configuration/)
  assert.equal(await Submission.countDocuments({ _id: submissionId }), 0, 'missing credentials create no submission')
  assert.equal(await MediaAsset.countDocuments({}), 0, 'missing credentials reserve no asset')
  process.env.CLOUDINARY_API_SECRET = 'isolated-test-secret'

  providerResponse = 'rejected'
  await assert.rejects(uploadImage(file, submissionId, uploadKey, actorId), /rejected the storage credentials/)
  const publicId = `vetra-team/cms/${actorId}/${submissionId}/${uploadKey}`
  const rejected = await MediaAsset.findById(publicId).lean()
  assert.equal(rejected.status, 'ready', 'definite rejection releases the upload lease')
  assert.equal(rejected.src, '', 'rejected upload has no saved URL')

  providerResponse = 'success'
  const uploaded = await uploadImage(file, submissionId, uploadKey, actorId)
  assert.equal(uploaded.publicId, publicId)
  assert.equal((await MediaAsset.findById(publicId).lean()).status, 'ready')
  assert.equal(uploadCalls, 2, 'retry uploads only the failed image')

  const project = {
    id: 'cms-media-integration-test', title: 'ทดสอบสื่อ', shortDesc: 'ผลงานทดสอบ',
    year: 2026, isExample: false, hasDetail: true, category: 'webapp', sortOrder: 0,
    cover: { src: uploaded.src, alt: 'ภาพหน้าปก' },
    slides: [{ src: uploaded.src, alt: 'ภาพผลงาน', caption: 'คำบรรยาย' }], stack: [], highlights: [],
    english: { title: 'English media integration', shortDesc: 'English saved project', coverAlt: 'English cover', highlights: [], slideCaptions: ['English caption'], stack: [] },
  }
  const first = await saveProject({ project, submissionId }, actorId)
  const retried = await saveProject({ project, submissionId }, actorId)
  assert.equal(first.cover.src, uploaded.src, 'project saves the uploaded URL with its text')
  assert.equal(retried.id, first.id, 'replaying a save returns the same project')
  assert.equal(await Project.countDocuments({ _id: project.id }), 1, 'save retry creates no duplicate')
  assert.equal((await Submission.findById(submissionId).lean()).status, 'saved')
  const publicProject = (await getPublicProjects()).find((item) => item.id === project.id)
  assert.equal(publicProject.title, 'ทดสอบสื่อ', 'Thai portfolio reads the saved CMS title')
  assert.equal(publicProject.cover.src, uploaded.src, 'public portfolio reads the saved Cloudinary cover')
  assert.equal(publicProject.slides[0].src, uploaded.src, 'public portfolio reads the saved gallery URL')
  const englishProject = localizeProject(publicProject, 'en')
  assert.equal(englishProject.title, 'English media integration', 'English portfolio reads the CMS translation')
  assert.equal(englishProject.cover.alt, 'English cover', 'English cover description stays connected')
  assert.equal(englishProject.slides[0].caption, 'English caption', 'English gallery caption stays connected')
  assert.equal((await cleanupMedia(actorId, submissionId)).deleted, 0, 'cleanup protects referenced media')
  assert.equal(destroyCalls, 0)

  await moveProjectToTrash(project.id, first.version)
  assert.equal((await getPublicProjects()).some((item) => item.id === project.id), false, 'Trash hides the project from the public portfolio')
  await MediaAsset.updateOne({ _id: publicId }, { $set: { protectedUntil: new Date(0) } })
  assert.equal((await cleanupMedia(actorId)).deleted, 0, 'shared cleanup protects media in recoverable Trash')
  assert.equal((await cleanupMedia(actorId, submissionId)).deleted, 0, 'submission cleanup protects media in recoverable Trash')
  assert.equal(destroyCalls, 0)

  await Project.updateOne({ _id: project.id }, { $set: { purgeAt: new Date(0) } }) // Temporary database only.
  assert.equal(await purgeExpiredProjects(), 1, 'expired Trash item is purged')
  assert.equal((await cleanupMedia(actorId)).deleted, 1, 'media is removable after its final project reference expires')
  assert.equal(destroyCalls, 1)

  const unknownSubmission = randomUUID(), unknownKey = randomUUID()
  providerResponse = 'unknown'
  await assert.rejects(uploadImage(file, unknownSubmission, unknownKey, actorId), /Simulated lost provider response/)
  const uncertainId = `vetra-team/cms/${actorId}/${unknownSubmission}/${unknownKey}`
  assert.equal((await MediaAsset.findById(uncertainId).lean()).status, 'uploading', 'uncertain upload keeps its lease')
  await assert.rejects(uploadImage(file, unknownSubmission, unknownKey, actorId), /still uploading/)
  console.log('CMS media staging, save retry, Thai/English public data, Trash protection, and cleanup passed using an isolated database and provider stub.')
} finally {
  globalThis.fetch = originalFetch
  await mongoose.disconnect()
  await mongo.stop()
}
