import crypto from 'node:crypto'
import path from 'node:path'
import { stat } from 'node:fs/promises'
import sharp from 'sharp'
import { MediaAsset, Project, Submission } from './models'
import { CmsError } from './http'
import { portfolioImages, type PortfolioInput } from '@/lib/portfolio'

// The provider request times out after 45 seconds. Keep an uncertain upload
// reserved longer so a cleanup request cannot destroy it while it finishes.
const UPLOAD_LEASE_MS = 5 * 60 * 1000
const DELETE_LEASE_MS = 5 * 60 * 1000
const ABANDONED_SUBMISSION_MS = 24 * 60 * 60 * 1000

export function mediaConfigured() { return !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) }
async function cloudinary(action: string, form: FormData, params: Record<string, string>) {
  if (!mediaConfigured()) throw new CmsError('Image uploads need Cloudinary configuration. Existing images can still be used.', 503)
  params.timestamp = String(Math.floor(Date.now() / 1000))
  const value = Object.keys(params).sort().map(k => `${k}=${params[k]}`).join('&')
  form.set('signature', crypto.createHash('sha256').update(value + process.env.CLOUDINARY_API_SECRET).digest('hex'))
  form.set('api_key', process.env.CLOUDINARY_API_KEY!)
  for (const [key, val] of Object.entries(params)) form.set(key, val)
  const response = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(process.env.CLOUDINARY_CLOUD_NAME!)}/image/${action}`, { method: 'POST', body: form, signal: AbortSignal.timeout(45000) })
  if (!response.ok) throw new CmsError('The image service could not complete this request. Please retry.', 502)
  return response.json()
}
export async function ensureSubmission(id: string, actorId: string) {
  try { await Submission.updateOne({ _id: id }, { $setOnInsert: { userId: actorId, status: 'uploading' } }, { upsert: true }) }
  catch (e) { if ((e as { code?: number }).code !== 11000) throw e }
  const receipt = await Submission.findById(id).lean()
  if (!receipt || receipt.userId !== actorId) throw new CmsError('This submission belongs to another session.', 403)
  return receipt
}
export async function uploadImage(file: File, submissionId: string, uploadKey: string, actorId: string) {
  const receipt = await ensureSubmission(submissionId, actorId)
  if (receipt.status !== 'uploading') throw new CmsError('This submission has already been saved or closed. Reload the editor.', 409)
  // This CAS prevents a stale-submission cleanup from closing a receipt while
  // a newly started upload is being prepared.
  const touched = await Submission.updateOne(
    { _id: submissionId, userId: actorId, status: 'uploading' },
    { $set: { lastActivityAt: new Date() } },
  )
  if (!touched.matchedCount) throw new CmsError('This submission has already been saved or closed. Reload the editor.', 409)
  if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'].includes(file.type) || file.size > 4 * 1024 * 1024 || file.size === 0) throw new CmsError('Use a JPEG, PNG, WebP, GIF or AVIF image up to 4 MB.')
  const bytes = Buffer.from(await file.arrayBuffer())
  try {
    const info = await sharp(bytes, { limitInputPixels: 40000000 }).metadata()
    if (!info.width || !info.height || !['jpeg', 'png', 'webp', 'gif', 'avif', 'heif'].includes(info.format || '')) throw new Error('Invalid image')
  } catch { throw new CmsError('This file is not a supported image or is too large to process.') }
  // Stable identifiers make retries safe even when a provider response is lost.
  const publicId = `vetra-team/cms/${actorId}/${submissionId}/${uploadKey}`
  const old = await MediaAsset.findById(publicId).lean()
  if (old?.status === 'deleting') throw new CmsError('This upload is being cleaned up. Choose the image again.', 409)
  if (old?.src) return { src: old.src, publicId }
  const now = new Date()
  if (old?.status === 'uploading' && old.protectedUntil > now) throw new CmsError('This image is still uploading. Wait a moment before retrying.', 409)
  try {
    await MediaAsset.findOneAndUpdate(
      {
        _id: publicId,
        $or: [
          { status: 'ready', src: '' },
          { status: 'uploading', protectedUntil: { $lte: now } },
        ],
      },
      {
        $setOnInsert: { userId: actorId, submissionId },
        $set: { status: 'uploading', protectedUntil: new Date(now.getTime() + UPLOAD_LEASE_MS) },
      },
      { upsert: true },
    )
  } catch (error) {
    if ((error as { code?: number })?.code === 11000) throw new CmsError('This image is already uploading. Wait a moment before retrying.', 409)
    throw error
  }
  const form = new FormData(); form.set('file', file)
  const result = await cloudinary('upload', form, { public_id: publicId, overwrite: 'true' })
  const src = String(result.secure_url || '')
  if (!src.startsWith(`https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/`)) throw new CmsError('The image service returned an unexpected URL.', 502)
  const saved = await MediaAsset.updateOne(
    { _id: publicId, status: 'uploading', submissionId, userId: actorId },
    { $set: { src, status: 'ready', protectedUntil: new Date(Date.now() + 3600000) } },
  )
  if (saved.matchedCount !== 1) throw new CmsError('The upload state changed. Check its status before retrying.', 409)
  return { src, publicId }
}
export async function protectProjectMedia(project: PortfolioInput, actorId: string, submissionId: string) {
  for (const src of new Set(portfolioImages(project))) {
    if (src.startsWith('/images/projects/')) {
      const root = path.resolve('public', 'images', 'projects')
      const candidate = path.resolve('public', src.slice(1))
      if (!candidate.startsWith(root + path.sep) || !/\.(png|jpe?g|webp|gif|avif)$/i.test(candidate) || !(await stat(candidate).catch(() => null))?.isFile()) throw new CmsError('One of the selected local images could not be found.')
      continue
    }
    const asset = await MediaAsset.findOne({ src, status: 'ready' }).lean()
    if (!asset) throw new CmsError('An image is not available. Upload it again before saving.')
    const referenced = await Project.exists({ $or: [{ 'data.cover.src': src }, { 'data.slides.src': src }] })
    if (!referenced && asset.userId !== actorId) throw new CmsError('This image does not belong to your account.', 403)
    if (!referenced && asset.submissionId !== submissionId) {
      const previous = await Submission.findById(asset.submissionId).lean()
      if (previous?.status === 'saving') throw new CmsError('This image is part of an uncertain save. Resolve that save first.', 409)
    }
    // Transfer same-owner assets from an earlier failed attempt into this
    // submission. Old-submission cleanup then cannot claim them by ID.
    const locked = await MediaAsset.updateOne(
      { _id: asset._id, src, status: 'ready', submissionId: asset.submissionId },
      { $set: { submissionId: referenced ? asset.submissionId : submissionId, protectedUntil: new Date(Date.now() + 3600000) } },
    )
    if (!locked.matchedCount) throw new CmsError('An image is being cleaned up. Upload it again.', 409)
  }
}
export async function cleanupMedia(actorId: string, submissionId?: string) {
  if (submissionId) {
    const receipt = await Submission.findOne({ _id: submissionId, userId: actorId }).lean()
    if (!receipt) return { deleted: 0, failed: 0 }
    // Never delete media while a database save has an uncertain outcome.
    if (receipt.status === 'saving') {
      const committed = await Project.exists({ lastSubmissionId: submissionId })
      if (!committed) throw new CmsError('Save status is still uncertain. Resolve the save before cleaning these images.', 409)
      await Submission.updateOne({ _id: submissionId, userId: actorId, status: 'saving' }, { $set: { status: 'saved' } })
    }
    if (receipt.status === 'uploading' || receipt.status === 'failed') {
      const closed = await Submission.updateOne(
        { _id: submissionId, userId: actorId, status: receipt.status },
        { $set: { status: 'abandoned' } },
      )
      if (closed.matchedCount !== 1) throw new CmsError('Save status changed. Check it before cleanup.', 409)
    }
  }
  // Exclude media referenced by active or trashed projects before the batch
  // limit. Otherwise 100 old referenced assets can permanently starve later
  // orphaned uploads. The per-asset reference checks below still guard races.
  const referenced = submissionId ? [] : [
    ...await Project.distinct('data.cover.src'),
    ...await Project.distinct('data.slides.src'),
  ].filter((src): src is string => typeof src === 'string')
  const candidates = await MediaAsset.find(submissionId
    ? { submissionId, userId: actorId }
    : { protectedUntil: { $lte: new Date() }, src: { $nin: referenced } }).limit(100).lean()
  let deleted = 0, failed = 0
  for (const asset of candidates) {
    // A provider response may have been lost while its upload continues.
    if ((asset.status === 'uploading' || asset.status === 'deleting') && asset.protectedUntil > new Date()) { failed++; continue }
    if (await Project.exists({ $or: [{ 'data.cover.src': asset.src }, { 'data.slides.src': asset.src }] })) continue
    const receipt = await Submission.findById(asset.submissionId).lean()
    if (receipt?.status === 'saving') continue
    if (!submissionId && receipt?.status === 'uploading') {
      // A closed browser leaves an uploading receipt behind. Give active
      // editors a full day and wait for every upload/media lease to expire.
      const staleBefore = new Date(Date.now() - ABANDONED_SUBMISSION_MS)
      const liveAsset = await MediaAsset.exists({ submissionId: asset.submissionId, protectedUntil: { $gt: new Date() } })
      if (liveAsset) continue
      const closed = await Submission.updateOne(
        {
          _id: asset.submissionId,
          status: 'uploading',
          $or: [
            { lastActivityAt: { $lte: staleBefore } },
            { lastActivityAt: { $exists: false }, createdAt: { $lte: staleBefore } },
          ],
        },
        { $set: { status: 'abandoned' } },
      )
      if (!closed.matchedCount) continue
    }
    const locked = await MediaAsset.findOneAndUpdate(
      {
        _id: asset._id,
        submissionId: asset.submissionId,
        status: asset.status,
        ...(asset.status === 'uploading' || asset.status === 'deleting' || !submissionId ? { protectedUntil: { $lte: new Date() } } : {}),
      },
      { $set: { status: 'deleting', protectedUntil: new Date(Date.now() + DELETE_LEASE_MS) } },
    )
    if (!locked) continue
    // Recheck references after taking the lock; writers refuse deleting assets.
    if (await Project.exists({ $or: [{ 'data.cover.src': asset.src }, { 'data.slides.src': asset.src }] })) {
      await MediaAsset.updateOne({ _id: asset._id, status: 'deleting' }, { $set: { status: locked.status, protectedUntil: locked.protectedUntil } }); continue
    }
    const latestReceipt = await Submission.findById(asset.submissionId).lean()
    if (latestReceipt?.status === 'saving') {
      await MediaAsset.updateOne({ _id: asset._id, status: 'deleting' }, { $set: { status: locked.status, protectedUntil: locked.protectedUntil } })
      continue
    }
    try {
      const result = await cloudinary('destroy', new FormData(), { public_id: asset._id, invalidate: 'true' })
      if (!['ok', 'not found'].includes(result.result)) throw new Error('Deletion not confirmed')
      const removed = await MediaAsset.deleteOne({ _id: asset._id, status: 'deleting' })
      deleted += removed.deletedCount
    } catch {
      failed++
      await MediaAsset.updateOne({ _id: asset._id, status: 'deleting' }, { $set: { protectedUntil: new Date(0) } }).catch(() => undefined)
    }
  }
  return { deleted, failed }
}
