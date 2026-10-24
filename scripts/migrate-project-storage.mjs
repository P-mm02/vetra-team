/**
 * Move the checked-in portfolio images to Cloudinary and bind their URLs to
 * MongoDB. Run with tsx so the existing TypeScript portfolio seed can be used.
 *
 * Dry run (no writes):
 *   npx tsx scripts/migrate-project-storage.mjs
 * Apply the reviewed plan to the explicitly named database:
 *   npx tsx scripts/migrate-project-storage.mjs --apply --expected-db=vetra --expected-plan=<hash>
 *
 * Cloudinary uploads use content-derived public IDs and overwrite=false. A
 * failed or interrupted run can be planned again and resumed safely. This
 * script never deletes local files or provider assets.
 */

import crypto from 'node:crypto'
import { readFile, readdir, rename, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import nextEnv from '@next/env'
import sharp from 'sharp'

nextEnv.loadEnvConfig(process.cwd())

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const imageDirectory = path.join(root, 'public', 'images', 'projects')
const sourceJson = path.join(root, 'src', 'app', '(site)', 'projects', 'Projects', 'projects.json')
const manifestPath = path.join(root, 'scripts', 'project-media-migration.manifest.json')
const localPrefix = '/images/projects/'
const publicIdPrefix = 'vetra-team/cms/project-import/'
const migrationActor = 'project-media-migration'
const migrationSubmission = 'project-media-migration-v1'
const mediaProtectionMs = 7 * 24 * 60 * 60 * 1000
const contentTypes = new Map([
  ['.jpg', 'image/jpeg'], ['.jpeg', 'image/jpeg'], ['.png', 'image/png'],
  ['.webp', 'image/webp'], ['.gif', 'image/gif'], ['.avif', 'image/avif'],
])

class MigrationError extends Error {}
let stage = 'startup'

function digest(value, algorithm = 'sha256') {
  return crypto.createHash(algorithm).update(value).digest('hex')
}

function sortByKey(a, b) {
  return a < b ? -1 : a > b ? 1 : 0
}

function parseArgs(args) {
  const options = { apply: false, expectedDb: '', expectedPlan: '' }
  for (const arg of args) {
    if (arg === '--apply') options.apply = true
    else if (arg === '--dry-run') options.apply = false
    else if (arg.startsWith('--expected-db=')) options.expectedDb = arg.slice('--expected-db='.length)
    else if (arg.startsWith('--expected-plan=')) options.expectedPlan = arg.slice('--expected-plan='.length)
    else throw new MigrationError(`Unknown argument: ${arg}`)
  }
  if (options.apply && (!options.expectedDb || !/^[a-zA-Z0-9_-]+$/.test(options.expectedDb) || !/^[a-f0-9]{64}$/.test(options.expectedPlan))) {
    throw new MigrationError('Apply requires --expected-db=<database> and --expected-plan=<64-character dry-run hash>.')
  }
  return options
}

function requiredConfig() {
  const names = ['MONGODB_URI', 'CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET']
  const missing = names.filter((name) => !process.env[name]?.trim())
  if (missing.length) throw new MigrationError(`Missing environment values: ${missing.join(', ')}.`)
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME.trim()
  if (!/^[a-zA-Z0-9_-]+$/.test(cloudName)) throw new MigrationError('The Cloudinary cloud name has an unexpected format.')
  return cloudName
}

async function inventoryFiles() {
  const entries = await readdir(imageDirectory, { withFileTypes: true })
  if (entries.some((entry) => !entry.isFile())) throw new MigrationError('The project image folder contains a subdirectory or symbolic link. Review it before migration.')
  const files = []
  for (const entry of entries.sort((a, b) => sortByKey(a.name, b.name))) {
    const extension = path.extname(entry.name).toLowerCase()
    const contentType = contentTypes.get(extension)
    if (!contentType) throw new MigrationError(`Unsupported project image type: ${entry.name}`)
    const filePath = path.join(imageDirectory, entry.name)
    const bytes = await readFile(filePath)
    const metadata = await sharp(bytes, { limitInputPixels: 40000000 }).metadata().catch(() => null)
    if (!metadata?.width || !metadata?.height) throw new MigrationError(`Invalid project image: ${entry.name}`)
    const sha256 = digest(bytes)
    files.push({
      localPath: `${localPrefix}${entry.name}`,
      filePath,
      filename: entry.name,
      contentType,
      byteLength: bytes.length,
      sha256,
      md5: digest(bytes, 'md5'),
      publicId: `${publicIdPrefix}${sha256}`,
    })
  }
  if (!files.length) throw new MigrationError('No local project images were found. They may already have been cleaned up.')
  return files
}

function mediaSources(data) {
  if (!data || typeof data !== 'object') throw new MigrationError('A project has invalid portfolio data.')
  const cover = data.cover?.src
  const slides = data.slides
  if (typeof cover !== 'string' || !Array.isArray(slides)) throw new MigrationError('A project has an invalid cover or gallery.')
  const sources = [{ key: 'data.cover.src', src: cover }]
  for (let index = 0; index < slides.length; index++) {
    if (typeof slides[index]?.src !== 'string') throw new MigrationError('A project gallery image has no URL.')
    sources.push({ key: `data.slides.${index}.src`, src: slides[index].src })
  }
  const knownLocalCount = sources.filter(({ src }) => src.startsWith(localPrefix)).length
  const serialized = JSON.stringify(data)
  const allLocalCount = serialized.split(localPrefix).length - 1
  if (allLocalCount !== knownLocalCount) throw new MigrationError('A project has local image references outside its cover or gallery. Review it before migration.')
  return sources
}

function validateReferences(records, filesByPath, getData = (record) => record.data) {
  let references = 0
  for (const record of records) {
    for (const { src } of mediaSources(getData(record))) {
      if (!src.startsWith(localPrefix)) continue
      if (!filesByPath.has(src)) throw new MigrationError(`A portfolio image has no matching local file: ${src}`)
      references++
    }
  }
  return references
}

function projectSnapshot(project) {
  return {
    id: String(project._id),
    version: project.version,
    dataHash: digest(JSON.stringify(project.data)),
    deletedAt: project.deletedAt?.toISOString?.() ?? null,
    purgeAt: project.purgeAt?.toISOString?.() ?? null,
    updatedAt: project.updatedAt?.toISOString?.() ?? null,
  }
}

function submissionSnapshot(submission) {
  return {
    id: String(submission._id),
    status: submission.status,
    resultHash: digest(JSON.stringify(submission.result)),
  }
}

async function readDatabase(Project, CmsState, Submission, session) {
  // MongoDB transactions must not execute operations on one session in parallel.
  const state = await CmsState.findById('portfolio-v1').session(session || null).lean()
  const projects = await Project.find({}).sort({ _id: 1 }).session(session || null).lean()
  const submissions = await Submission.find({ result: { $exists: true, $ne: null } }).sort({ _id: 1 }).session(session || null).lean()
  for (const project of projects) {
    if (!Number.isSafeInteger(project.version) || project.version < 0) throw new MigrationError(`Project ${project._id} has an invalid version.`)
  }
  return { ready: state?.ready === true, projects, submissions }
}

async function buildPlan({ Project, CmsState, Submission, databaseName, cloudName, seedRecords, session }) {
  const files = await inventoryFiles()
  const filesByPath = new Map(files.map((file) => [file.localPath, file]))
  const db = await readDatabase(Project, CmsState, Submission, session)
  const seed = seedRecords.map((data) => ({ data }))
  const currentReferences = validateReferences(db.projects, filesByPath)
  const seedReferences = validateReferences(seed, filesByPath)
  const submissionReferences = validateReferences(db.submissions, filesByPath, (record) => record.result)
  const sourceJsonHash = digest(await readFile(sourceJson))
  const seedDataHash = digest(JSON.stringify(seedRecords))
  const stable = {
    version: 1,
    databaseName,
    cloudName,
    ready: db.ready,
    sourceJsonHash,
    seedDataHash,
    files: files.map(({ localPath, sha256, byteLength, publicId }) => ({ localPath, sha256, byteLength, publicId })),
    projects: db.projects.map(projectSnapshot),
    submissions: db.submissions.map(submissionSnapshot),
  }
  const planHash = digest(JSON.stringify(stable))
  return {
    ...stable, planHash, files, projects: db.projects, submissions: db.submissions,
    currentReferences, seedReferences, submissionReferences,
    seedNeeded: !db.ready && db.projects.length === 0,
  }
}

function mappedData(data, imageUrls) {
  const coverSrc = imageUrls.get(data.cover.src) || data.cover.src
  const slides = data.slides.map((slide) => ({ ...slide, src: imageUrls.get(slide.src) || slide.src }))
  return { ...data, cover: { ...data.cover, src: coverSrc }, slides }
}

function expectedUrlPrefix(cloudName) {
  return `/${cloudName}/image/upload/`
}

async function uploadAndVerify(file, cloudName) {
  const bytes = await readFile(file.filePath)
  if (digest(bytes) !== file.sha256) throw new MigrationError(`Local image changed after planning: ${file.localPath}`)
  const params = { overwrite: 'false', public_id: file.publicId, timestamp: String(Math.floor(Date.now() / 1000)) }
  const signatureValue = Object.keys(params).sort().map((key) => `${key}=${params[key]}`).join('&')
  const signature = digest(signatureValue + process.env.CLOUDINARY_API_SECRET)
  const form = new FormData()
  form.set('file', new Blob([bytes], { type: file.contentType }), file.filename)
  form.set('api_key', process.env.CLOUDINARY_API_KEY)
  form.set('signature', signature)
  for (const [key, value] of Object.entries(params)) form.set(key, value)

  let response
  try {
    response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST', body: form, signal: AbortSignal.timeout(60000),
    })
  } catch {
    throw new MigrationError(`Cloudinary upload outcome is uncertain for ${file.localPath}. Run a new dry run before retrying.`)
  }
  if (!response.ok) throw new MigrationError(`Cloudinary rejected ${file.localPath} (HTTP ${response.status}). No Mongo changes were made.`)
  const result = await response.json().catch(() => null)
  if (!result || result.public_id !== file.publicId || result.resource_type !== 'image' || result.type !== 'upload') {
    throw new MigrationError(`Cloudinary returned an unexpected image identity for ${file.localPath}.`)
  }
  if (result.etag && result.etag.toLowerCase() !== file.md5) throw new MigrationError(`Cloudinary content checksum differs for ${file.localPath}.`)
  if (Number.isFinite(result.bytes) && result.bytes !== file.byteLength) throw new MigrationError(`Cloudinary image size differs for ${file.localPath}.`)
  let url
  try { url = new URL(result.secure_url) } catch { throw new MigrationError(`Cloudinary returned an invalid delivery URL for ${file.localPath}.`) }
  if (url.protocol !== 'https:' || url.hostname !== 'res.cloudinary.com' ||
    !url.pathname.startsWith(expectedUrlPrefix(cloudName)) || url.search || url.hash) {
    throw new MigrationError(`Cloudinary returned an unexpected delivery URL for ${file.localPath}.`)
  }
  const served = await fetch(url, { signal: AbortSignal.timeout(30000) }).catch(() => null)
  if (!served?.ok || !served.headers.get('content-type')?.startsWith('image/')) {
    throw new MigrationError(`Cloudinary did not deliver ${file.localPath}; no Mongo changes were made.`)
  }
  const delivered = Buffer.from(await served.arrayBuffer())
  if (digest(delivered) !== file.sha256) throw new MigrationError(`Cloudinary delivered different bytes for ${file.localPath}; no Mongo changes were made.`)
  return { localPath: file.localPath, sha256: file.sha256, publicId: file.publicId, src: url.toString() }
}

function updateForProject(project, imageUrls) {
  const changes = {}
  for (const { key, src } of mediaSources(project.data)) {
    if (!src.startsWith(localPrefix)) continue
    const replacement = imageUrls.get(src)
    if (!replacement) throw new MigrationError(`Missing upload for ${src}.`)
    changes[key] = replacement
  }
  return changes
}

function updateForSubmission(submission, imageUrls) {
  const changes = {}
  for (const { key, src } of mediaSources(submission.result)) {
    if (!src.startsWith(localPrefix)) continue
    const replacement = imageUrls.get(src)
    if (!replacement) throw new MigrationError(`Missing upload for ${src}.`)
    changes[key.replace(/^data\./, 'result.')] = replacement
  }
  return changes
}

async function writeManifest({ cloudName, databaseName, planHash, entries }) {
  const manifest = { version: 1, cloudName, databaseName, planHash, entries }
  const temporary = `${manifestPath}.${crypto.randomUUID()}.tmp`
  await writeFile(temporary, `${JSON.stringify(manifest, null, 2)}\n`, { flag: 'wx' })
  try { await rename(temporary, manifestPath) }
  catch {
    await unlink(temporary).catch(() => undefined)
    throw new MigrationError('The verified database migration completed, but the manifest could not be saved. Rerun a dry run and apply to recover it.')
  }
}

async function verifyDatabase({ Project, CmsState, Submission, MediaAsset, entries }) {
  const [state, projects, submissions, media] = await Promise.all([
    CmsState.findById('portfolio-v1').lean(),
    Project.find({}).lean(),
    Submission.find({ result: { $exists: true, $ne: null } }).lean(),
    MediaAsset.find({ _id: { $in: [...new Set(entries.map((entry) => entry.publicId))] } }).lean(),
  ])
  if (state?.ready !== true) throw new MigrationError('The portfolio initialization marker was not committed.')
  const remaining = projects.flatMap((project) => mediaSources(project.data).filter(({ src }) => src.startsWith(localPrefix)))
  if (remaining.length) throw new MigrationError(`Mongo still has ${remaining.length} local project image references.`)
  const staleReceipts = submissions.flatMap((submission) => mediaSources(submission.result).filter(({ src }) => src.startsWith(localPrefix)))
  if (staleReceipts.length) throw new MigrationError(`Mongo still has ${staleReceipts.length} local image references in submission receipts.`)
  const byId = new Map(media.map((asset) => [asset._id, asset]))
  for (const entry of entries) {
    const asset = byId.get(entry.publicId)
    if (!asset || asset.status !== 'ready' || asset.src !== entry.src) throw new MigrationError(`Mongo has no matching ready media record for ${entry.localPath}.`)
  }
  return projects.length
}

async function applyPlan({ plan, cloudName, databaseName, expectedDb, expectedPlan, Project, CmsState, Submission, MediaAsset, seedRecords, mongoose }) {
  if (databaseName !== expectedDb) throw new MigrationError(`Database guard failed: selected ${databaseName}, expected ${expectedDb}.`)
  if (plan.planHash !== expectedPlan) throw new MigrationError('The dry-run plan changed. Review a fresh dry run before applying.')
  if (!plan.ready && plan.projects.length) throw new MigrationError('Portfolio marker is not ready but Mongo already has projects. Review this partial initialization before applying.')
  if (plan.ready && !plan.projects.length) throw new MigrationError('Portfolio is initialized but contains no projects. Review the selected database before applying.')

  const uploadedByPublicId = new Map()
  const entries = []
  for (const [index, file] of plan.files.entries()) {
    let entry = uploadedByPublicId.get(file.publicId)
    if (!entry) {
      entry = await uploadAndVerify(file, cloudName)
      uploadedByPublicId.set(file.publicId, entry)
    }
    entries.push({ localPath: file.localPath, sha256: file.sha256, publicId: file.publicId, src: entry.src })
    console.log(`Verified Cloudinary image ${index + 1}/${plan.files.length}.`)
  }

  const refreshed = await buildPlan({ Project, CmsState, Submission, databaseName, cloudName, seedRecords })
  if (refreshed.planHash !== plan.planHash) throw new MigrationError('Source files or Mongo projects changed during upload. Review a fresh dry run; uploaded assets can be reused.')

  const imageUrls = new Map(entries.map(({ localPath, src }) => [localPath, src]))
  const session = await mongoose.startSession()
  try {
    await session.withTransaction(async () => {
      const current = await readDatabase(Project, CmsState, Submission, session)
      const fingerprint = digest(JSON.stringify({
        version: 1, databaseName, cloudName, ready: current.ready,
        sourceJsonHash: plan.sourceJsonHash,
        seedDataHash: plan.seedDataHash,
        files: plan.files.map(({ localPath, sha256, byteLength, publicId }) => ({ localPath, sha256, byteLength, publicId })),
        projects: current.projects.map(projectSnapshot),
        submissions: current.submissions.map(submissionSnapshot),
      }))
      if (fingerprint !== plan.planHash) throw new MigrationError('Mongo projects changed before the transaction. Review a fresh dry run.')

      const protectedUntil = new Date(Date.now() + mediaProtectionMs)
      const uniqueEntries = [...uploadedByPublicId.values()]
      const existingMedia = await MediaAsset.find({
        _id: { $in: uniqueEntries.map((entry) => entry.publicId) },
      }).session(session).lean()
      for (const existing of existingMedia) {
        const entry = uploadedByPublicId.get(existing._id)
        if (!entry || existing.status !== 'ready' || existing.src !== entry.src) {
          throw new MigrationError(`A media record conflicts with ${existing._id}; review it before applying.`)
        }
      }
      if (uniqueEntries.length) await MediaAsset.bulkWrite(uniqueEntries.map((entry) => ({
        updateOne: {
          filter: { _id: entry.publicId },
          update: {
            $setOnInsert: {
              src: entry.src, userId: migrationActor, submissionId: migrationSubmission,
              status: 'ready', createdAt: new Date(),
            },
            $max: { protectedUntil },
          },
          upsert: true,
        },
      })), { session, ordered: true })

      if (plan.seedNeeded) {
        const seeds = seedRecords.map(({ version, updatedAt, ...data }) => ({
          _id: data.id, data: mappedData(data, imageUrls), version,
          updatedAt: new Date(updatedAt), deletedAt: null, purgeAt: null,
        }))
        await Project.insertMany(seeds, { session, ordered: true })
      } else {
        const updates = []
        for (const project of current.projects) {
          const changes = updateForProject(project, imageUrls)
          if (!Object.keys(changes).length) continue
          changes.updatedAt = new Date()
          updates.push({ updateOne: {
            filter: { _id: project._id, version: project.version },
            update: { $set: changes, $inc: { version: 1 } },
          } })
        }
        if (updates.length) {
          const updated = await Project.bulkWrite(updates, { session, ordered: true })
          if (updated.matchedCount !== updates.length) throw new MigrationError('A project changed during migration. Rerun the dry run.')
        }
      }

      const submissionUpdates = []
      for (const submission of current.submissions) {
        const changes = updateForSubmission(submission, imageUrls)
        if (!Object.keys(changes).length) continue
        submissionUpdates.push({ updateOne: {
          filter: { _id: submission._id },
          update: { $set: changes },
        } })
      }
      if (submissionUpdates.length) {
        const updated = await Submission.bulkWrite(submissionUpdates, { session, ordered: true })
        if (updated.matchedCount !== submissionUpdates.length) throw new MigrationError('A submission changed during migration. Rerun the dry run.')
      }

      const records = await Project.find({}).session(session).lean()
      const remaining = records.flatMap((project) => mediaSources(project.data).filter(({ src }) => src.startsWith(localPrefix)))
      if (remaining.length) throw new MigrationError(`The transaction still has ${remaining.length} local project image references.`)
      const receipts = await Submission.find({ result: { $exists: true, $ne: null } }).session(session).lean()
      const staleReceipts = receipts.flatMap((submission) => mediaSources(submission.result).filter(({ src }) => src.startsWith(localPrefix)))
      if (staleReceipts.length) throw new MigrationError(`The transaction still has ${staleReceipts.length} local image references in submission receipts.`)
      await CmsState.updateOne({ _id: 'portfolio-v1' }, { $set: { ready: true } }, { upsert: true, session })
    }, { readConcern: { level: 'snapshot' }, writeConcern: { w: 'majority' } })
  } finally {
    await session.endSession()
  }

  const projectCount = await verifyDatabase({ Project, CmsState, Submission, MediaAsset, entries })
  await writeManifest({ cloudName, databaseName, planHash: plan.planHash, entries })
  console.log(JSON.stringify({ status: 'verified', databaseName, projectCount, imageCount: entries.length, manifestPath }))
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  const cloudName = requiredConfig()
  stage = 'loading application models'
  const [{ connectMongo }, { Project, CmsState, Submission, MediaAsset }, { legacyProjects }] = await Promise.all([
    import('../src/lib/db/mongoose.ts'),
    import('../src/lib/cms/models.ts'),
    import('../src/lib/cms/projects.ts'),
  ])
  stage = 'connecting to the selected Mongo database'
  const mongoose = await connectMongo()
  try {
    const databaseName = mongoose.connection.db?.databaseName
    if (!databaseName) throw new MigrationError('Mongo did not select a database.')
    const seedRecords = legacyProjects()
    stage = 'building a read-only plan'
    const plan = await buildPlan({ Project, CmsState, Submission, databaseName, cloudName, seedRecords })
    const summary = {
      mode: options.apply ? 'apply' : 'dry-run',
      databaseName,
      cloudName,
      initialized: plan.ready,
      projectDocuments: plan.projects.length,
      seedProjects: plan.seedNeeded ? seedRecords.length : 0,
      localMongoReferences: plan.currentReferences,
      localSubmissionReferences: plan.submissionReferences,
      localSeedReferences: plan.seedReferences,
      localImages: plan.files.length,
      localBytes: plan.files.reduce((sum, file) => sum + file.byteLength, 0),
      planHash: plan.planHash,
    }
    console.log(JSON.stringify(summary, null, 2))
    if (!options.apply) return
    stage = 'uploading and binding images'
    await applyPlan({
      plan, cloudName, databaseName, expectedDb: options.expectedDb,
      expectedPlan: options.expectedPlan, Project, CmsState, Submission, MediaAsset,
      seedRecords, mongoose,
    })
  } finally {
    await mongoose.disconnect()
  }
}

main().catch((error) => {
  // Do not print provider responses, URIs, stack traces, or credential values.
  const code = typeof error?.code === 'string' ? ` (${error.code})` : ''
  const location = String(error?.stack || '').match(/migrate-project-storage\.mjs:(\d+):(\d+)/)
  const site = location ? ` at script line ${location[1]}` : ''
  const message = error instanceof MigrationError
    ? error.message
    : `An unexpected ${error?.name || 'error'} occurred during ${stage}${code}${site}. Review configuration and retry from a fresh dry run.`
  console.error(message)
  process.exitCode = 1
})
