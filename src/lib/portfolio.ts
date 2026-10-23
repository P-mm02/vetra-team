import { z } from 'zod'

const text = (max: number) => z.string().trim().max(max)
const image = z.object({ src: text(1000).min(1), alt: text(300) })
export const portfolioSchema = z.object({
  id: z.string().regex(/^[a-z0-9][a-z0-9-]{2,100}$/),
  title: text(160).min(1), shortDesc: text(2000).min(1),
  year: z.number().int().min(1900).max(2200),
  isExample: z.boolean(), hasDetail: z.boolean(),
  category: z.enum(['business', 'commerce', 'webapp', 'internal']),
  sortOrder: z.number().int().min(-100000).max(100000),
  cover: image,
  slides: z.array(image.extend({ caption: text(500).default(''), priority: z.boolean().optional() })).max(30),
  stack: z.array(text(100).min(1)).max(30),
  highlights: z.array(text(1000).min(1)).max(30),
  english: z.object({ title: text(160), shortDesc: text(2000), coverAlt: text(300),
    highlights: z.array(text(1000)).max(30), slideCaptions: z.array(text(500)).max(30),
    stack: z.array(text(100)).max(30).optional(),
  }),
})
export type PortfolioInput = z.infer<typeof portfolioSchema>
export type PortfolioRecord = PortfolioInput & { version: number; updatedAt: string }
export const submissionSchema = z.string().uuid()
export const versionSchema = z.number().int().nonnegative()
export function canEditPortfolio(role: string) { return ['dev', 'admin', 'editor'].includes(role) }
export function canManageUsers(role: string) { return ['dev', 'admin'].includes(role) }
export function portfolioImages(project: PortfolioInput) { return [project.cover.src, ...project.slides.map(s => s.src)] }
