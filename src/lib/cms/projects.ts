import { connectMongo } from '@/lib/db/mongoose'
import { CmsState, MediaAsset, Project, Submission } from './models'
import { CmsError } from './http'
import legacy from '@/app/(site)/projects/Projects/projects.json'
import { localizeProject } from '@/app/(site)/projects/Projects/projectContent'
import { compareProjectsNewestFirst } from '@/app/(site)/projects/Projects/projectChronology'
import type { PortfolioInput, PortfolioRecord } from '@/lib/portfolio'
import type { ProjectItem } from '@/app/(site)/projects/Projects/Modal/Modal'
import seedMediaData from './project-seed-media.json'

const seedMedia: Array<{ publicId: string; src: string }> = seedMediaData

const categories: Record<string, PortfolioInput['category']> = {
  'p-005-electronic': 'commerce', 'p-007-furniture': 'commerce', 'p-012-manhwa-manhua-manga-2': 'webapp',
  'p-014-novel-2': 'webapp', 'p-018-pet-2': 'commerce', 'p-025-sgw-working': 'internal',
  'p-028-swipswap': 'webapp', 'p-029-underwear-3': 'commerce', 'p-030-weedex': 'webapp',
  'p-032-go-wallet': 'webapp', 'p-034-x-tribe': 'commerce',
}
export function legacyProjects(): PortfolioRecord[] {
  return [...legacy].sort(compareProjectsNewestFirst).map((p, index) => {
    const en = localizeProject(p as ProjectItem, 'en')
    return { ...p, hasDetail: !!p.hasDetail, slides: 'slides' in p ? p.slides : [], stack: 'stack' in p ? p.stack : [],
      highlights: 'highlights' in p ? p.highlights : [], category: categories[p.id] || 'business', sortOrder: index,
      english: { title: en.title, shortDesc: en.shortDesc, coverAlt: en.cover.alt, highlights: en.highlights || [], stack: en.stack || [], slideCaptions: en.slides?.map(s => s.caption || '') || [] },
      version: 0, updatedAt: '2026-07-20T07:03:20.000Z',
    } as PortfolioRecord
  })
}
export async function initializePortfolio() {
  await connectMongo()
  if ((await CmsState.findById('portfolio-v1').lean())?.ready) return
  if (seedMedia.length) {
    await MediaAsset.bulkWrite(seedMedia.map(({ publicId, src }) => ({ updateOne: {
      filter: { _id: publicId },
      update: { $setOnInsert: { src, userId: 'portfolio-seed', submissionId: 'portfolio-seed', status: 'ready', protectedUntil: new Date(0) } },
      upsert: true,
    } })))
    const rows = await MediaAsset.find({ _id: { $in: seedMedia.map(({ publicId }) => publicId) } }).lean()
    const byId = new Map(rows.map(row => [row._id, row]))
    if (seedMedia.some(({ publicId, src }) => byId.get(publicId)?.src !== src || byId.get(publicId)?.status !== 'ready')) {
      throw new Error('Seed image records do not match the portfolio images.')
    }
  }
  await Project.bulkWrite(legacyProjects().map(({ version, updatedAt, ...data }) => ({ updateOne: {
    filter: { _id: data.id }, update: { $setOnInsert: { data, version, updatedAt: new Date(updatedAt), deletedAt: null, purgeAt: null } }, upsert: true,
  } })))
  await CmsState.updateOne({ _id: 'portfolio-v1' }, { $set: { ready: true } }, { upsert: true })
}
export function toPortfolioRecord(doc: { data: PortfolioInput; version: number; updatedAt: Date }): PortfolioRecord {
  return { ...doc.data, version: doc.version, updatedAt: doc.updatedAt.toISOString() }
}
export async function getPortfolioRecords(): Promise<PortfolioRecord[]> {
  await initializePortfolio()
  return (await Project.find({ deletedAt: null }).sort({ 'data.sortOrder': 1, 'data.year': -1, _id: 1 }).lean()).map(toPortfolioRecord)
}
export async function getPublicProjects(): Promise<PortfolioRecord[]> {
  await connectMongo()
  // Before the first CMS visit, show the existing portfolio without writing to the database.
  if (!(await CmsState.findById('portfolio-v1').lean())?.ready) return legacyProjects()
  return (await Project.find({ deletedAt: null }).sort({ 'data.sortOrder': 1, 'data.year': -1, _id: 1 }).lean()).map(toPortfolioRecord)
}
export async function getPublicProjectsForPage(): Promise<PortfolioRecord[] | null> {
  try { return await getPublicProjects() }
  catch (error) {
    // Never substitute checked-in projects for CMS data after an outage: they
    // could include work that staff edited or moved to Trash.
    console.error('Public portfolio unavailable:', error)
    return null
  }
}
export async function getSubmission(id: string, actorId: string) {
  const receipt = await Submission.findOne({ _id: id, userId: actorId }).lean()
  if (!receipt) return { project: null, status: 'missing' }
  if (receipt.status === 'saved' && receipt.result) return { project: receipt.result, status: 'saved' }
  const project = await Project.findOne({ lastSubmissionId: id }).lean()
  if (project) {
    const result = toPortfolioRecord(project)
    await Submission.updateOne({ _id: id, userId: actorId }, { $set: { status: 'saved', result } })
    return { project: result, status: 'saved' }
  }
  return { project: null, status: receipt.status }
}
export async function moveProjectToTrash(id: string, version: number) {
  const now = new Date()
  const project = await Project.findOneAndUpdate({ _id: id, version, deletedAt: null }, {
    $set: { deletedAt: now, purgeAt: new Date(now.getTime() + 30 * 86400000), updatedAt: now }, $inc: { version: 1 },
  })
  if (!project) throw new CmsError('This project changed or is already in Trash. Reload before trying again.', 409)
}
export async function purgeExpiredProjects() {
  await connectMongo()
  const result = await Project.deleteMany({ purgeAt: { $lte: new Date() }, deletedAt: { $ne: null } })
  return result.deletedCount
}
