import crypto from 'node:crypto'
import { portfolioSchema, submissionSchema, versionSchema } from '@/lib/portfolio'
import { Project, Submission } from './models'
import { CmsError } from './http'
import { ensureSubmission, protectProjectMedia } from './media'
import { initializePortfolio, toPortfolioRecord } from './projects'

export async function saveProject(body: Record<string, unknown>, actorId: string, routeId?: string) {
  const parsed = portfolioSchema.safeParse(body.project)
  const submission = submissionSchema.safeParse(body.submissionId)
  if (!parsed.success || !submission.success) throw new CmsError('Check the project fields and try again.')
  const project = parsed.data, submissionId = submission.data
  if (routeId && routeId !== project.id) throw new CmsError('A project ID cannot be changed.')
  const version = routeId ? versionSchema.safeParse(body.expectedVersion) : null
  if (version && !version.success) throw new CmsError('Reload the project before saving.', 409)
  await initializePortfolio()
  const receipt = await ensureSubmission(submissionId, actorId)
  const fingerprint = crypto.createHash('sha256').update(JSON.stringify({ project, version: body.expectedVersion })).digest('hex')
  if (receipt.fingerprint && receipt.fingerprint !== fingerprint) throw new CmsError('This save attempt has different content. Start a new save attempt.', 409)
  if (receipt.status === 'saved' && receipt.result) return receipt.result
  if (receipt.status === 'abandoned') throw new CmsError('This save attempt was closed. Reload before saving.', 409)
  const previous = await Project.findOne({ lastSubmissionId: submissionId }).lean()
  if (previous) {
    const result = toPortfolioRecord(previous)
    await Submission.updateOne({ _id: submissionId }, { $set: { status: 'saved', result } })
    return result
  }
  // Claim before media checks. Cleanup can only close uploading/failed receipts,
  // so no cleanup can race the validation and database write that follow.
  const claimed = await Submission.updateOne(
    {
      _id: submissionId,
      userId: actorId,
      $or: [
        { status: { $in: ['uploading', 'failed'] }, $or: [{ fingerprint: { $exists: false } }, { fingerprint }] },
        // A process may die after claiming a save. Replaying the exact same
        // content is safe: the project write has a unique ID/version guard,
        // and lastSubmissionId recovers a write that already committed.
        { status: 'saving', fingerprint },
      ],
    },
    { $set: { status: 'saving', fingerprint, projectId: project.id } },
  )
  if (!claimed.matchedCount) throw new CmsError('This save is already running or no longer available. Check its status before retrying.', 409)
  const now = new Date()
  let saved
  try {
    await protectProjectMedia(project, actorId, submissionId)
    if (routeId && version?.success) {
      saved = await Project.findOneAndUpdate({ _id: routeId, version: version.data, deletedAt: null }, { $set: { data: project, updatedAt: now, lastSubmissionId: submissionId }, $inc: { version: 1 } }, { returnDocument: 'after' }).lean()
      if (!saved) throw new CmsError('Someone changed this project. Reload and review their changes before saving.', 409)
    } else {
      saved = (await Project.create({ _id: project.id, data: project, version: 0, updatedAt: now, lastSubmissionId: submissionId })).toObject()
    }
  } catch (error) {
    // A failed response can follow a committed write. Recover by the stable submission ID.
    const committed = await Project.findOne({ lastSubmissionId: submissionId }).lean()
    if (committed) saved = committed
    else {
      if (error instanceof CmsError || (error as { code?: number }).code === 11000) {
        await Submission.updateOne({ _id: submissionId, status: 'saving', fingerprint }, { $set: { status: 'failed' } })
        if ((error as { code?: number }).code === 11000) throw new CmsError('This project ID is already used. Choose a different ID.', 409)
      }
      throw error
    }
  }
  const result = toPortfolioRecord(saved!)
  await Submission.updateOne({ _id: submissionId }, { $set: { status: 'saved', result } })
  return result
}
