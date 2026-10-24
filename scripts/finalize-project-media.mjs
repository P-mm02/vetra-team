import { createHash, randomUUID } from 'node:crypto'
import { createReadStream } from 'node:fs'
import { lstat, readFile, readdir, rename, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import nextEnv from '@next/env'
import mongoose from 'mongoose'

const root = fileURLToPath(new URL('..', import.meta.url))
const manifestPath = path.join(root, 'scripts/project-media-migration.manifest.json')
const projectsPath = path.join(root, 'src/app/(site)/projects/Projects/projects.json')
const heroPath = path.join(root, 'src/app/(site)/HomeHero/HomeHero.tsx')
const seedPath = path.join(root, 'src/lib/cms/project-seed-media.json')
const projectImageDir = path.join(root, 'public/images/projects')
const textExtensions = new Set(['.css', '.html', '.js', '.jsx', '.json', '.mdx', '.mjs', '.scss', '.svg', '.ts', '.tsx'])
const modes = new Set(['--apply-source', '--cleanup-local'])

function usage() {
  console.log('Usage: node scripts/finalize-project-media.mjs [--apply-source | --cleanup-local]')
  console.log('No flag: dry-run. Run --apply-source first, then --cleanup-local after reviewing the source changes.')
}

const args = process.argv.slice(2)
if (args.includes('--help')) {
  usage()
  process.exit(0)
}
if (args.some(arg => !modes.has(arg)) || args.length > 1) {
  usage()
  process.exit(2)
}
const mode = args[0] || 'dry-run'

nextEnv.loadEnvConfig(root)

function isLocalProjectImage(src) {
  return typeof src === 'string' && src.startsWith('/images/projects/')
}

function imageRefs(project) {
  return [project?.cover?.src, ...(project?.slides || []).map(slide => slide?.src)].filter(Boolean)
}

function localFile(localPath) {
  const match = /^\/images\/projects\/([^/\\]+)$/.exec(localPath)
  if (!match || match[1] === '.' || match[1] === '..' || match[1].includes('\0')) {
    throw new Error(`Unsafe manifest localPath: ${localPath}`)
  }
  const absolute = path.resolve(projectImageDir, match[1])
  if (path.dirname(absolute) !== projectImageDir) throw new Error(`Unsafe manifest localPath: ${localPath}`)
  return absolute
}

function assertManifest(data) {
  if (!data || data.version !== 1 || !Array.isArray(data.entries) || !data.entries.length) {
    throw new Error('The migration manifest must have version 1 and a nonempty entries array.')
  }
  if (typeof data.cloudName !== 'string' || !data.cloudName || data.cloudName !== process.env.CLOUDINARY_CLOUD_NAME) {
    throw new Error('The manifest cloudName differs from CLOUDINARY_CLOUD_NAME in this environment.')
  }
  if (typeof data.databaseName !== 'string' || !data.databaseName || typeof data.planHash !== 'string' || !data.planHash) {
    throw new Error('The migration manifest is missing its databaseName or planHash.')
  }

  const paths = new Set()
  const ids = new Map()
  for (const entry of data.entries) {
    if (!entry || typeof entry.localPath !== 'string' || typeof entry.src !== 'string' ||
        typeof entry.publicId !== 'string' || !/^[a-f0-9]{64}$/.test(entry.sha256 || '')) {
      throw new Error('A manifest entry is incomplete or has an invalid SHA-256 hash.')
    }
    localFile(entry.localPath)
    if (paths.has(entry.localPath)) throw new Error(`Duplicate manifest localPath: ${entry.localPath}`)
    paths.add(entry.localPath)
    const previous = ids.get(entry.publicId)
    if (previous && (previous.src !== entry.src || previous.sha256 !== entry.sha256)) {
      throw new Error(`Conflicting manifest publicId: ${entry.publicId}`)
    }
    ids.set(entry.publicId, entry)

    let url
    try { url = new URL(entry.src) } catch { throw new Error(`Invalid Cloudinary URL for ${entry.localPath}`) }
    if (url.protocol !== 'https:' || url.hostname !== 'res.cloudinary.com' ||
        !url.pathname.startsWith(`/${data.cloudName}/image/upload/`) ||
        !url.pathname.includes(`/${entry.publicId}`) || url.username || url.password || url.search || url.hash) {
      throw new Error(`Unexpected Cloudinary URL for ${entry.localPath}`)
    }
  }
  return new Map(data.entries.map(entry => [entry.localPath, entry]))
}

function sourcePlan(jsonText, heroText, byPath) {
  const projects = JSON.parse(jsonText)
  if (!Array.isArray(projects) || !projects.length) throw new Error('Checked-in projects.json is empty or invalid.')
  const jsonRefs = projects.flatMap(imageRefs)
  const heroRefs = [...heroText.matchAll(/\bsrc="([^"]+)"/g)].map(match => match[1])
  const localRefs = [...jsonRefs, ...heroRefs].filter(isLocalProjectImage)
  const unmapped = [...new Set(localRefs.filter(src => !byPath.has(src)))]
  if (unmapped.length) throw new Error(`Source image paths missing from the manifest: ${unmapped.join(', ')}`)

  let nextJson = jsonText
  let nextHero = heroText
  for (const entry of byPath.values()) {
    const oldJson = JSON.stringify(entry.localPath)
    const expectedJsonCount = jsonRefs.filter(src => src === entry.localPath).length
    const actualJsonCount = jsonText.split(oldJson).length - 1
    if (actualJsonCount !== expectedJsonCount) {
      throw new Error(`Cannot safely replace JSON references for ${entry.localPath}: expected ${expectedJsonCount}, found ${actualJsonCount}.`)
    }
    nextJson = nextJson.replaceAll(oldJson, JSON.stringify(entry.src))

    const oldHero = `src="${entry.localPath}"`
    const expectedHeroCount = heroRefs.filter(src => src === entry.localPath).length
    const actualHeroCount = heroText.split(oldHero).length - 1
    if (actualHeroCount !== expectedHeroCount) {
      throw new Error(`Cannot safely replace HomeHero references for ${entry.localPath}: expected ${expectedHeroCount}, found ${actualHeroCount}.`)
    }
    nextHero = nextHero.replaceAll(oldHero, `src="${entry.src}"`)
  }

  const afterRefs = [...JSON.parse(nextJson).flatMap(imageRefs),
    ...[...nextHero.matchAll(/\bsrc="([^"]+)"/g)].map(match => match[1])]
  if (afterRefs.some(isLocalProjectImage)) throw new Error('The planned source rewrite still has local project image references.')

  const recognized = new Set([...jsonRefs, ...heroRefs, ...afterRefs])
  const absent = [...byPath.values()].filter(entry => !recognized.has(entry.localPath) && !recognized.has(entry.src))
  if (absent.length) throw new Error(`Manifest entries are absent from checked-in project sources: ${absent.map(entry => entry.localPath).join(', ')}`)

  return { nextJson, nextHero, localRefs: localRefs.length, projects: projects.length,
    changedJson: nextJson !== jsonText, changedHero: nextHero !== heroText }
}

function seedPlan(seedText, entries) {
  const existing = JSON.parse(seedText)
  if (!Array.isArray(existing)) throw new Error('project-seed-media.json must contain an array.')
  const unique = new Map(entries.map(entry => [entry.publicId, { publicId: entry.publicId, src: entry.src }]))
  const expected = [...unique.values()]
  const existingById = new Map(existing.map(entry => [entry?.publicId, entry?.src]))
  const matches = existing.length === expected.length && existingById.size === expected.length &&
    expected.every(entry => existingById.get(entry.publicId) === entry.src) &&
    existing.every(entry => entry && Object.keys(entry).sort().join(',') === 'publicId,src')
  if (existing.length && !matches) {
    throw new Error('Existing project seed media differs from the migration manifest; review it before finalizing.')
  }
  const nextSeed = matches ? seedText : `${JSON.stringify(expected, null, 2)}\n`
  return { nextSeed, changedSeed: nextSeed !== seedText, seedAssets: expected.length }
}

async function fileHash(absolute) {
  const hash = createHash('sha256')
  for await (const chunk of createReadStream(absolute)) hash.update(chunk)
  return hash.digest('hex')
}

async function verifyLocalFiles(entries) {
  const missing = []
  for (const entry of entries) {
    const absolute = localFile(entry.localPath)
    let info
    try { info = await lstat(absolute) }
    catch (error) {
      if (error?.code === 'ENOENT') { missing.push(entry.localPath); continue }
      throw error
    }
    if (!info.isFile() || info.isSymbolicLink()) throw new Error(`Local image is not a regular file: ${entry.localPath}`)
    if (await fileHash(absolute) !== entry.sha256) throw new Error(`Local image changed after migration: ${entry.localPath}`)
  }
  return missing
}

async function verifyDatabase(manifest) {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is missing.')
  await mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 8000, connectTimeoutMS: 8000, autoIndex: false,
  })
  const db = mongoose.connection.db
  if (db.databaseName !== manifest.databaseName) throw new Error('Connected MongoDB database differs from the migration manifest.')
  const state = await db.collection('cmsstates').findOne({ _id: 'portfolio-v1' }, { projection: { ready: 1 } })
  if (state?.ready !== true) throw new Error('MongoDB portfolio initialization is not complete.')
  const projects = await db.collection('portfolioprojects').find({}, { projection: { _id: 1, data: 1, deletedAt: 1 } }).toArray()
  if (!projects.length) throw new Error('MongoDB has no projects; check the target database before finalizing.')
  const remaining = projects.flatMap(project => imageRefs(project.data)
    .filter(isLocalProjectImage).map(src => `${project._id}: ${src}`))
  if (remaining.length) throw new Error(`MongoDB still references local images (including Trash): ${remaining.join(', ')}`)
  const submissions = await db.collection('cmssubmissions').find(
    { result: { $exists: true } }, { projection: { _id: 1, result: 1 } },
  ).toArray()
  const submissionRefs = submissions.flatMap(submission => imageRefs(submission.result)
    .filter(isLocalProjectImage).map(src => `${submission._id}: ${src}`))
  if (submissionRefs.length) {
    throw new Error(`MongoDB saved submission results still reference local images: ${submissionRefs.join(', ')}`)
  }

  const ids = [...new Set(manifest.entries.map(entry => entry.publicId))]
  const assets = await db.collection('cmsmedias').find({ _id: { $in: ids } }, { projection: { _id: 1, src: 1, status: 1 } }).toArray()
  const byId = new Map(assets.map(asset => [asset._id, asset]))
  const unready = manifest.entries.filter(entry => {
    const asset = byId.get(entry.publicId)
    return asset?.status !== 'ready' || asset.src !== entry.src
  })
  if (unready.length) throw new Error(`MongoDB media records are missing or unready: ${unready.map(entry => entry.localPath).join(', ')}`)
  return { databaseName: db.databaseName, projects: projects.length,
    trashedProjects: projects.filter(project => !!project.deletedAt).length,
    savedSubmissionsChecked: submissions.length, mediaAssets: assets.length }
}

async function assertNoNewDatabaseReference(localPath) {
  const db = mongoose.connection.db
  const [project, submission] = await Promise.all([
    db.collection('portfolioprojects').findOne({ $or: [
      { 'data.cover.src': localPath }, { 'data.slides.src': localPath },
    ] }, { projection: { _id: 1 } }),
    db.collection('cmssubmissions').findOne({ $or: [
      { 'result.cover.src': localPath }, { 'result.slides.src': localPath },
    ] }, { projection: { _id: 1 } }),
  ])
  if (project || submission) throw new Error(`MongoDB gained a local image reference during cleanup: ${localPath}`)
}

async function textFiles(directory) {
  const found = []
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name)
    if (entry.isDirectory()) found.push(...await textFiles(absolute))
    else if (entry.isFile() && textExtensions.has(path.extname(entry.name).toLowerCase())) found.push(absolute)
  }
  return found
}

async function runtimeReferences(byPath, replacements = new Map()) {
  const files = [...await textFiles(path.join(root, 'src')),
    ...await textFiles(path.join(root, 'public')), path.join(root, 'next.config.ts')]
  const hits = []
  for (const absolute of files) {
    let value = replacements.has(absolute) ? replacements.get(absolute) : await readFile(absolute, 'utf8')
    // This validation rule accepts existing checked-in images; it does not render one.
    if (absolute === path.join(root, 'src/lib/cms/media.ts')) {
      value = value.replaceAll("src.startsWith('/images/projects/')", '')
    }
    const remaining = [...byPath.keys()].filter(localPath => value.includes(localPath) || value.includes(encodeURI(localPath)))
    if (remaining.length || value.includes('/images/projects/')) {
      hits.push({ file: path.relative(root, absolute).replaceAll('\\', '/'), paths: remaining })
    }
  }
  return hits
}

async function atomicWrite(absolute, value) {
  const temporary = path.join(path.dirname(absolute), `.${path.basename(absolute)}.${process.pid}.${randomUUID()}.tmp`)
  try {
    await writeFile(temporary, value, { flag: 'wx' })
    await rename(temporary, absolute)
  } catch (error) {
    await unlink(temporary).catch(() => {})
    throw error
  }
}

function safeMessage(error) {
  const message = error instanceof Error ? error.message : String(error)
  return message.replace(/mongodb(?:\+srv)?:\/\/[^@\s]+@/gi, 'mongodb://[redacted]@')
}

try {
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'))
  const byPath = assertManifest(manifest)
  const [jsonText, heroText, seedText] = await Promise.all([
    readFile(projectsPath, 'utf8'), readFile(heroPath, 'utf8'), readFile(seedPath, 'utf8'),
  ])
  const plan = sourcePlan(jsonText, heroText, byPath)
  const seed = seedPlan(seedText, manifest.entries)
  const missing = await verifyLocalFiles(manifest.entries)
  const database = await verifyDatabase(manifest)
  const planned = new Map([[projectsPath, plan.nextJson], [heroPath, plan.nextHero], [seedPath, seed.nextSeed]])
  const remainingAfterRewrite = await runtimeReferences(byPath, planned)
  if (remainingAfterRewrite.length) {
    throw new Error(`Runtime files would still reference local project images: ${remainingAfterRewrite.map(hit => hit.file).join(', ')}`)
  }

  if (mode === '--cleanup-local' && (plan.changedJson || plan.changedHero || seed.changedSeed)) {
    throw new Error('Checked-in sources still need --apply-source before local image cleanup.')
  }
  if (missing.length && (plan.changedJson || plan.changedHero)) {
    throw new Error(`A still-referenced local image is missing: ${missing.join(', ')}`)
  }

  console.log(JSON.stringify({ mode, database, sourceProjects: plan.projects,
    manifestImages: manifest.entries.length, seedMediaAssets: seed.seedAssets,
    localReferencesToRewrite: plan.localRefs,
    sourceFilesToChange: [plan.changedJson && path.relative(root, projectsPath),
      plan.changedHero && path.relative(root, heroPath),
      seed.changedSeed && path.relative(root, seedPath)].filter(Boolean),
    localImagesPresent: manifest.entries.length - missing.length, localImagesAlreadyAbsent: missing.length,
  }, null, 2))

  if (mode === '--apply-source') {
    const changed = []
    try {
      if (plan.changedJson) { await atomicWrite(projectsPath, plan.nextJson); changed.push([projectsPath, jsonText]) }
      if (plan.changedHero) { await atomicWrite(heroPath, plan.nextHero); changed.push([heroPath, heroText]) }
      if (seed.changedSeed) { await atomicWrite(seedPath, seed.nextSeed); changed.push([seedPath, seedText]) }
      const remaining = await runtimeReferences(byPath)
      if (remaining.length) throw new Error(`Runtime references remain: ${remaining.map(hit => hit.file).join(', ')}`)
    } catch (error) {
      const rollbackErrors = []
      for (const [absolute, original] of changed.reverse()) {
        try { await atomicWrite(absolute, original) }
        catch (rollbackError) { rollbackErrors.push(`${absolute}: ${safeMessage(rollbackError)}`) }
      }
      throw new Error(`Source update failed: ${safeMessage(error)}${rollbackErrors.length ? `; rollback failed: ${rollbackErrors.join(', ')}` : ''}`)
    }
    console.log('Checked-in project image URLs now use the verified Cloudinary URLs. Review the diff before local cleanup.')
  } else if (mode === '--cleanup-local') {
    const remaining = await runtimeReferences(byPath)
    if (remaining.length) throw new Error(`Runtime references remain: ${remaining.map(hit => hit.file).join(', ')}`)
    let removed = 0
    for (const entry of manifest.entries) {
      if (missing.includes(entry.localPath)) continue
      const absolute = localFile(entry.localPath)
      const info = await lstat(absolute)
      if (!info.isFile() || info.isSymbolicLink() || await fileHash(absolute) !== entry.sha256) {
        throw new Error(`Local image changed during cleanup: ${entry.localPath}`)
      }
      await assertNoNewDatabaseReference(entry.localPath)
      await unlink(absolute)
      removed += 1
    }
    console.log(`Removed ${removed} verified, unreferenced local project images.`)
  } else {
    console.log('Dry-run only. No source, MongoDB, Cloudinary, or local image changes were made.')
  }
} catch (error) {
  console.error(`Project media finalization failed: ${safeMessage(error)}`)
  process.exitCode = 1
} finally {
  await mongoose.disconnect()
}
