import { readFile } from 'node:fs/promises'
import nextEnv from '@next/env'
import mongoose from 'mongoose'

nextEnv.loadEnvConfig(process.cwd())

if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is missing')
const databaseOverride = process.argv.find(argument => argument.startsWith('--database='))?.slice('--database='.length)
if (databaseOverride && !/^[a-zA-Z0-9_-]+$/.test(databaseOverride)) throw new Error('Invalid database name')
const uri = new URL(process.env.MONGODB_URI)
if (databaseOverride) uri.pathname = `/${databaseOverride}`

const source = JSON.parse(await readFile(new URL('../src/app/(site)/projects/Projects/projects.json', import.meta.url), 'utf8'))
const sourceById = new Map(source.map(project => [project.id, project]))
const refs = data => [data?.cover?.src, ...(data?.slides || []).map(slide => slide.src)].filter(Boolean)
const local = value => typeof value === 'string' && value.startsWith('/images/projects/')

try {
  await mongoose.connect(uri.toString(), { serverSelectionTimeoutMS: 8000, connectTimeoutMS: 8000, autoIndex: false })
  const db = mongoose.connection.db
  const state = await db.collection('cmsstates').findOne({ _id: 'portfolio-v1' })
  const projects = await db.collection('portfolioprojects').find({}).project({ _id: 1, data: 1, version: 1, deletedAt: 1, purgeAt: 1, updatedAt: 1 }).toArray()
  const media = await db.collection('cmsmedias').find({}).project({ _id: 1, src: 1, status: 1 }).toArray()
  const dbIds = new Set(projects.map(project => project._id))
  const refSet = new Set(projects.flatMap(project => refs(project.data)))
  const mediaBySrc = new Map(media.map(asset => [asset.src, asset]))
  const localRefs = new Map()
  for (const project of projects) for (const src of refs(project.data).filter(local)) {
    const ids = localRefs.get(src) || new Set()
    ids.add(project._id)
    localRefs.set(src, ids)
  }
  const changedSourceIds = projects.filter(project => {
    const original = sourceById.get(project._id)
    return original && JSON.stringify(refs(project.data)) !== JSON.stringify(refs(original))
  }).map(project => project._id)
  console.log(JSON.stringify({
    database: db.databaseName,
    stateReady: state?.ready === true,
    sourceProjects: source.length,
    sourceLocalPaths: new Set(source.flatMap(project => refs(project)).filter(local)).size,
    mongoProjects: projects.length,
    mongoActive: projects.filter(project => !project.deletedAt).length,
    mongoTrash: projects.filter(project => !!project.deletedAt).length,
    sourceMissingInMongo: source.map(project => project.id).filter(id => !dbIds.has(id)),
    mongoOnly: projects.map(project => project._id).filter(id => !sourceById.has(id)),
    mongoVersionedEdits: projects.filter(project => project.version > 0).map(project => ({ id: project._id, version: project.version })),
    changedImageReferences: changedSourceIds,
    mongoLocalPaths: [...localRefs].map(([src, ids]) => ({ src, projects: [...ids] })),
    mongoCloudReferences: [...refSet].filter(src => src.startsWith('https://res.cloudinary.com/')).length,
    trackedMediaAssets: media.length,
    trackedCloudReferences: media.filter(asset => refSet.has(asset.src)).length,
    cloudReferencesMissingReadyMedia: [...refSet].filter(src => src.startsWith('https://res.cloudinary.com/') && mediaBySrc.get(src)?.status !== 'ready'),
  }, null, 2))
} catch (error) {
  console.error(`Storage audit failed: ${error instanceof Error ? error.message.replace(/mongodb(?:\+srv)?:\/\/[^@\s]+@/g, 'mongodb://[redacted]@') : 'unknown error'}`)
  process.exitCode = 1
} finally {
  await mongoose.disconnect()
}
