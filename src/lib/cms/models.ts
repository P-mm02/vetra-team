import mongoose, { Schema } from 'mongoose'
import type { PortfolioInput } from '@/lib/portfolio'

type ProjectDoc = { _id: string; data: PortfolioInput; version: number; deletedAt: Date | null; purgeAt: Date | null; updatedAt: Date; lastSubmissionId?: string }
const projectSchema = new Schema<ProjectDoc>({
  _id: String, data: { type: Schema.Types.Mixed, required: true },
  version: { type: Number, default: 0 }, deletedAt: { type: Date, default: null },
  purgeAt: { type: Date, default: null }, updatedAt: { type: Date, default: Date.now }, lastSubmissionId: String,
}, { versionKey: false })
projectSchema.index({ purgeAt: 1 })
export const Project = (mongoose.models.PortfolioProject as mongoose.Model<ProjectDoc>) || mongoose.model<ProjectDoc>('PortfolioProject', projectSchema)

type StateDoc = { _id: string; ready: boolean }
export const CmsState = (mongoose.models.CmsState as mongoose.Model<StateDoc>) || mongoose.model<StateDoc>('CmsState', new Schema<StateDoc>({ _id: String, ready: Boolean }))

type SubmissionDoc = { _id: string; userId: string; status: string; projectId?: string; fingerprint?: string; result?: unknown; createdAt: Date; lastActivityAt?: Date }
export const Submission = (mongoose.models.CmsSubmission as mongoose.Model<SubmissionDoc>) || mongoose.model<SubmissionDoc>('CmsSubmission', new Schema<SubmissionDoc>({
  _id: String, userId: { type: String, required: true }, status: { type: String, default: 'uploading' }, projectId: String, fingerprint: String, result: Schema.Types.Mixed, createdAt: { type: Date, default: Date.now }, lastActivityAt: Date,
}))

type MediaDoc = { _id: string; src: string; userId: string; submissionId: string; status: string; protectedUntil: Date; createdAt: Date }
export const MediaAsset = (mongoose.models.CmsMedia as mongoose.Model<MediaDoc>) || mongoose.model<MediaDoc>('CmsMedia', new Schema<MediaDoc>({
  _id: String, src: { type: String, default: '' }, userId: String, submissionId: String,
  status: { type: String, default: 'ready' }, protectedUntil: { type: Date, default: Date.now }, createdAt: { type: Date, default: Date.now },
}))
