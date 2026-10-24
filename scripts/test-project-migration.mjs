import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { cp, mkdir, mkdtemp, readFile, realpath, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { MongoMemoryReplSet } from 'mongodb-memory-server'
import sharp from 'sharp'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const fixture = await mkdtemp(path.join(root, '.project-migration-test-'))
const databaseName = `vetra_migration_test_${randomUUID().replaceAll('-', '')}`
const preload = path.join(root, 'scripts', 'test-project-migration-fetch.mjs')
let mongo
let mongoose

function childEnvironment(uri) {
  // The fixture has no .env files. Override every credential this script can
  // read, even if the parent shell happens to hold a real configuration.
  return {
    ...process.env,
    NODE_OPTIONS: '',
    MONGODB_URI: uri,
    AUTH_SECRET: 'isolated-migration-test-secret',
    CLOUDINARY_CLOUD_NAME: 'migration-test-cloud',
    CLOUDINARY_API_KEY: 'migration-test-key',
    CLOUDINARY_API_SECRET: 'migration-test-secret',
  }
}

async function runMigration(uri, args = []) {
  const script = path.join(fixture, 'scripts', 'migrate-project-storage.mjs')
  const child = spawn(process.execPath, ['--import', 'tsx', '--import', pathToFileURL(preload).href, script, ...args], {
    cwd: fixture,
    env: childEnvironment(uri),
    windowsHide: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  let stdout = '', stderr = ''
  child.stdout.setEncoding('utf8')
  child.stderr.setEncoding('utf8')
  child.stdout.on('data', (chunk) => { stdout += chunk })
  child.stderr.on('data', (chunk) => { stderr += chunk })
  const code = await new Promise((resolve, reject) => {
    child.on('error', reject)
    child.on('close', resolve)
  })
  return { code, stdout, stderr }
}

function summaryOf(run) {
  assert.equal(run.code, 0, `Migration child failed:\n${run.stdout}\n${run.stderr}`)
  const open = run.stdout.indexOf('{')
  const close = run.stdout.indexOf('}', open)
  assert.ok(open >= 0 && close > open, `No dry-run summary:\n${run.stdout}`)
  return JSON.parse(run.stdout.slice(open, close + 1))
}

try {
  await mkdir(path.join(fixture, 'scripts'), { recursive: true })
  const imageDirectory = path.join(fixture, 'public', 'images', 'projects')
  await mkdir(imageDirectory, { recursive: true })
  await Promise.all([
    cp(path.join(root, 'scripts', 'migrate-project-storage.mjs'), path.join(fixture, 'scripts', 'migrate-project-storage.mjs')),
    cp(path.join(root, 'src'), path.join(fixture, 'src'), { recursive: true }),
    cp(path.join(root, 'package.json'), path.join(fixture, 'package.json')),
    cp(path.join(root, 'tsconfig.json'), path.join(fixture, 'tsconfig.json')),
  ])

  const imageSpecs = [
    { name: 'fixture-cover.webp', color: '#526ca6', format: 'webp' },
    { name: 'fixture-gallery.png', color: '#ae5839', format: 'png' },
    { name: 'fixture-second.jpg', color: '#3a8a70', format: 'jpeg' },
  ]
  await Promise.all(imageSpecs.map(async ({ name, color, format }) => {
    const bytes = await sharp({ create: { width: 32, height: 24, channels: 4, background: color } }).toFormat(format).toBuffer()
    await writeFile(path.join(imageDirectory, name), bytes)
  }))
  const local = (name) => `/images/projects/${name}`
  const source = [
    {
      id: 'p-100-migration-one', title: 'ภาพผลงานหนึ่ง', shortDesc: 'เว็บไซต์ทดลองการย้ายข้อมูล',
      year: 2025, isExample: true, hasDetail: true,
      cover: { src: local('fixture-cover.webp'), alt: 'หน้าปกหนึ่ง' },
      slides: [
        { src: local('fixture-gallery.png'), alt: 'ภาพแกลเลอรี', caption: 'รายละเอียดภาพ', priority: true },
        { src: local('fixture-cover.webp'), alt: 'ภาพหน้าปกอีกครั้ง', caption: 'ภาพซ้ำ' },
      ],
      stack: ['Next.js', 'MongoDB'], highlights: ['ข้อมูลเดิมต้องอยู่ครบ'],
    },
    {
      id: 'p-101-migration-two', title: 'Second project', shortDesc: 'A second test project',
      year: 2026, isExample: false, hasDetail: true,
      cover: { src: local('fixture-second.jpg'), alt: 'Second cover' },
      slides: [{ src: local('fixture-gallery.png'), alt: 'Shared gallery', caption: 'Shared image' }],
      stack: ['Cloudinary'], highlights: ['Shared media is mapped once'],
    },
  ]
  await writeFile(path.join(fixture, 'src', 'app', '(site)', 'projects', 'Projects', 'projects.json'), `${JSON.stringify(source, null, 2)}\n`)
  await writeFile(path.join(fixture, 'src', 'lib', 'cms', 'project-seed-media.json'), '[]\n')

  mongo = await MongoMemoryReplSet.create({ replSet: { count: 1, storageEngine: 'wiredTiger' } })
  const uri = mongo.getUri(databaseName)
  process.env.MONGODB_URI = uri
  process.env.AUTH_SECRET = 'isolated-migration-test-secret'
  const [{ connectMongo }, { Project, CmsState, MediaAsset, Submission }, { getPublicProjects }] = await Promise.all([
    import('../src/lib/db/mongoose.ts'),
    import('../src/lib/cms/models.ts'),
    import('../src/lib/cms/projects.ts'),
  ])
  mongoose = await connectMongo()

  const firstDryRun = summaryOf(await runMigration(uri))
  assert.equal(firstDryRun.mode, 'dry-run')
  assert.equal(firstDryRun.databaseName, databaseName)
  assert.equal(firstDryRun.projectDocuments, 0)
  assert.equal(firstDryRun.seedProjects, source.length)
  assert.equal(firstDryRun.localImages, imageSpecs.length)
  assert.equal(firstDryRun.localSeedReferences, 5, 'shared images appear as five references across two projects')
  assert.match(firstDryRun.planHash, /^[a-f0-9]{64}$/)
  assert.equal(await Project.countDocuments({}), 0, 'dry run leaves Mongo untouched')
  assert.equal(await MediaAsset.countDocuments({}), 0, 'dry run uploads no media records')

  const secondDryRun = summaryOf(await runMigration(uri))
  assert.equal(secondDryRun.planHash, firstDryRun.planHash, 'unchanged inputs yield the same plan hash')
  const wrongHash = '0'.repeat(64) === firstDryRun.planHash ? '1'.repeat(64) : '0'.repeat(64)
  const rejected = await runMigration(uri, ['--apply', `--expected-db=${databaseName}`, `--expected-plan=${wrongHash}`])
  assert.equal(rejected.code, 1, 'apply refuses a stale or incorrect plan hash')
  assert.match(rejected.stderr, /dry-run plan changed/i)
  assert.equal(await Project.countDocuments({}), 0, 'rejected apply leaves Mongo untouched')

  const applied = await runMigration(uri, ['--apply', `--expected-db=${databaseName}`, `--expected-plan=${firstDryRun.planHash}`])
  const appliedSummary = summaryOf(applied)
  assert.equal(appliedSummary.mode, 'apply')
  const result = JSON.parse(applied.stdout.trim().split(/\r?\n/).at(-1))
  assert.equal(result.status, 'verified')
  assert.equal(result.projectCount, source.length)
  assert.equal(result.imageCount, imageSpecs.length)
  const manifest = JSON.parse(await readFile(path.join(fixture, 'scripts', 'project-media-migration.manifest.json'), 'utf8'))
  assert.equal(manifest.entries.length, imageSpecs.length)
  assert.equal(manifest.planHash, firstDryRun.planHash)
  const urls = new Map(manifest.entries.map((entry) => [entry.localPath, entry.src]))
  assert.equal(urls.size, imageSpecs.length)
  assert.ok([...urls.values()].every((src) => src.startsWith('https://res.cloudinary.com/migration-test-cloud/image/upload/')))

  assert.equal((await CmsState.findById('portfolio-v1').lean())?.ready, true)
  assert.equal(await Project.countDocuments({}), source.length)
  assert.equal(await Submission.countDocuments({}), 0)
  const expectedMediaCount = new Set(manifest.entries.map((entry) => entry.publicId)).size
  assert.equal(await MediaAsset.countDocuments({}), expectedMediaCount)
  for (const entry of manifest.entries) {
    const asset = await MediaAsset.findById(entry.publicId).lean()
    assert.equal(asset.status, 'ready')
    assert.equal(asset.src, entry.src)
    assert.equal(asset.userId, 'project-media-migration')
  }
  for (const record of source) {
    const project = await Project.findById(record.id).lean()
    assert.ok(project, `seeded project exists: ${record.id}`)
    assert.equal(project.data.title, record.title, `title preserved for ${record.id}`)
    assert.equal(project.data.shortDesc, record.shortDesc, `description preserved for ${record.id}`)
    assert.equal(project.data.year, record.year, `year preserved for ${record.id}`)
    assert.equal(project.data.isExample, record.isExample, `featured status preserved for ${record.id}`)
    assert.equal(project.data.hasDetail, record.hasDetail, `detail status preserved for ${record.id}`)
    assert.deepEqual(project.data.stack, record.stack, `technology stack preserved for ${record.id}`)
    assert.deepEqual(project.data.highlights, record.highlights, `highlights preserved for ${record.id}`)
    assert.equal(project.data.cover.alt, record.cover.alt, `cover description preserved for ${record.id}`)
    assert.equal(project.data.cover.src, urls.get(record.cover.src), `cover image migrated for ${record.id}`)
    assert.deepEqual(project.data.slides, record.slides.map((slide) => ({ ...slide, src: urls.get(slide.src) })), `gallery metadata and order preserved for ${record.id}`)
    assert.equal(project.data.english.title, record.title, `English fallback is present for ${record.id}`)
    assert.equal(project.version, 0, `version preserved for ${record.id}`)
    assert.equal(project.updatedAt.toISOString(), '2026-07-20T07:03:20.000Z', `timestamp preserved for ${record.id}`)
  }
  const publicProjects = await getPublicProjects()
  assert.equal(publicProjects.length, source.length, 'frontend portfolio service reads all migrated projects')
  assert.ok(publicProjects.every((record) => record.cover.src.startsWith('https://res.cloudinary.com/migration-test-cloud/')))
  const beforeRerun = await Project.find({}).sort({ _id: 1 }).lean()

  const rerunPlan = summaryOf(await runMigration(uri))
  assert.equal(rerunPlan.seedProjects, 0)
  assert.equal(rerunPlan.projectDocuments, source.length)
  assert.equal(rerunPlan.localMongoReferences, 0)
  assert.notEqual(rerunPlan.planHash, firstDryRun.planHash, 'the plan reflects the committed database state')
  const rerun = await runMigration(uri, ['--apply', `--expected-db=${databaseName}`, `--expected-plan=${rerunPlan.planHash}`])
  assert.equal(summaryOf(rerun).mode, 'apply')
  assert.deepEqual(await Project.find({}).sort({ _id: 1 }).lean(), beforeRerun, 'rerun preserves project data, versions, and timestamps')
  assert.equal(await MediaAsset.countDocuments({}), expectedMediaCount, 'rerun creates no duplicate media records')

  console.log('Isolated migration dry run, guarded apply, synthetic projects/images, frontend data, and idempotent rerun passed.')
} finally {
  if (mongoose) await mongoose.disconnect()
  if (mongo) await mongo.stop()
  const realRoot = await realpath(root)
  const realFixture = await realpath(fixture)
  if (path.dirname(realFixture) !== realRoot || !path.basename(realFixture).startsWith('.project-migration-test-')) {
    throw new Error('Refusing to remove a migration test fixture outside the workspace.')
  }
  await rm(realFixture, { recursive: true, force: true })
}
