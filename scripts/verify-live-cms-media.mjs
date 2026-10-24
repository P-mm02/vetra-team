import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import nextEnv from '@next/env'
import sharp from 'sharp'

nextEnv.loadEnvConfig(process.cwd())

const expectedDatabase = process.argv.find(argument => argument.startsWith('--expected-db='))?.slice('--expected-db='.length)
if (!process.argv.includes('--run') || !expectedDatabase) {
  throw new Error('This creates and removes a disposable project in the configured database. Run with --run --expected-db=<database>.')
}
for (const key of ['MONGODB_URI', 'CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET']) {
  if (!process.env[key]) throw new Error(`${key} is missing.`)
}

const { connectMongo } = await import('../src/lib/db/mongoose.ts')
const { CmsState, MediaAsset, Project } = await import('../src/lib/cms/models.ts')
const { uploadImage, cleanupMedia } = await import('../src/lib/cms/media.ts')
const { getPublicProjects } = await import('../src/lib/cms/projects.ts')
const { saveProject } = await import('../src/lib/cms/save-project.ts')
const { localizeProject } = await import('../src/app/(site)/projects/Projects/projectContent.ts')

const mongo = await connectMongo()
const database = mongo.connection.db.databaseName
if (database !== expectedDatabase) {
  await mongo.disconnect()
  throw new Error(`Database guard failed: connected to ${database}, expected ${expectedDatabase}.`)
}
if (!(await CmsState.findById('portfolio-v1').lean())?.ready) {
  await mongo.disconnect()
  throw new Error('Portfolio migration is not ready. Run this check only after the portfolio is populated.')
}

const nonce = randomUUID()
const actorId = `verification-${nonce}`
const submissionId = randomUUID()
const uploadKey = randomUUID()
const projectId = `media-check-${nonce}`
const publicId = `vetra-team/cms/${actorId}/${submissionId}/${uploadKey}`
let verified = false

try {
  const bytes = await sharp({ create: { width: 32, height: 32, channels: 4, background: '#4e5cb4' } }).webp().toBuffer()
  const file = new File([bytes], 'verification.webp', { type: 'image/webp' })
  const uploaded = await uploadImage(file, submissionId, uploadKey, actorId)
  assert.equal(uploaded.publicId, publicId)
  const project = {
    id: projectId, title: 'ทดสอบการเชื่อมต่อสื่อ', shortDesc: 'รายการทดสอบชั่วคราว',
    year: 2026, isExample: false, hasDetail: true, category: 'webapp', sortOrder: 100000,
    cover: { src: uploaded.src, alt: 'ภาพทดสอบ' },
    slides: [{ src: uploaded.src, alt: 'ภาพผลงานทดสอบ', caption: 'ภาพทดสอบ' }],
    stack: [], highlights: [],
    english: { title: 'Temporary media verification', shortDesc: 'Temporary verification record', coverAlt: 'Verification image', slideCaptions: ['Verification slide'], highlights: [], stack: [] },
  }
  const saved = await saveProject({ project, submissionId }, actorId)
  assert.equal(saved.id, projectId)
  assert.equal((await MediaAsset.findById(publicId).lean())?.status, 'ready')
  const publicProject = (await getPublicProjects()).find(item => item.id === projectId)
  assert.equal(publicProject?.cover.src, uploaded.src)
  assert.equal(publicProject?.title, project.title)
  assert.equal(localizeProject(publicProject, 'en').title, project.english.title)
  assert.deepEqual(await cleanupMedia(actorId, submissionId), { deleted: 0, failed: 0 })
  const image = await fetch(uploaded.src, { signal: AbortSignal.timeout(15000) })
  assert.equal(image.status, 200)
  assert.match(image.headers.get('content-type') || '', /^image\//)
  verified = true
} finally {
  const record = await Project.findById(projectId).lean().catch(() => null)
  if (record) {
    if (record.lastSubmissionId !== submissionId) throw new Error(`Refusing to remove a project that changed: ${projectId}`)
    await Project.deleteOne({ _id: projectId, lastSubmissionId: submissionId })
  }
  const asset = await MediaAsset.findById(publicId).lean().catch(() => null)
  if (asset) {
    const result = await cleanupMedia(actorId, submissionId).catch(() => null)
    if (result?.deleted !== 1) {
      console.error(`Disposable verification asset needs cleanup: ${publicId}`)
      process.exitCode = 1
    }
  }
  await mongo.disconnect()
}

if (verified && !process.exitCode) console.log(`Real Cloudinary upload, MongoDB save, Thai/English public reads, referenced-media protection, CDN delivery, and disposable cleanup passed in database ${database}.`)
