export type ProjectCategory = 'business' | 'commerce' | 'webapp' | 'internal'

export type PortfolioInput = {
  id: string
  title: string
  shortDesc: string
  year: number
  isExample: boolean
  hasDetail: boolean
  category: ProjectCategory
  sortOrder: number
  cover: { src: string; alt: string }
  slides: Array<{ src: string; alt: string; caption?: string; priority?: boolean }>
  stack: string[]
  highlights: string[]
  english: {
    title: string
    shortDesc: string
    coverAlt: string
    highlights: string[]
    slideCaptions: string[]
    stack?: string[]
  }
}

export type PortfolioRecord = PortfolioInput & {
  version: number
  updatedAt: string
}

export type ProjectAsset = {
  key: string
  src: string
  alt: string
  caption: string
  englishCaption: string
  priority: boolean
  file?: File
  originalBytes?: number
  previewUrl?: string
  uploadedSrc?: string
}

export const CATEGORY_LABELS: Record<ProjectCategory, string> = {
  business: 'Business website',
  commerce: 'E-commerce',
  webapp: 'Web app / platform',
  internal: 'Internal system',
}

export function newSubmissionId() {
  return crypto.randomUUID()
}

export function emptyProject(): PortfolioInput {
  return {
    id: '',
    title: '',
    shortDesc: '',
    year: new Date().getFullYear(),
    isExample: true,
    hasDetail: true,
    category: 'business',
    sortOrder: 0,
    cover: { src: '', alt: '' },
    slides: [],
    stack: [],
    highlights: [],
    english: {
      title: '',
      shortDesc: '',
      coverAlt: '',
      highlights: [],
      slideCaptions: [],
      stack: [],
    },
  }
}

export function assetFromSaved(
  value: { src: string; alt: string; caption?: string; priority?: boolean },
  englishCaption = '',
): ProjectAsset {
  return {
    key: newSubmissionId(),
    src: value.src,
    alt: value.alt,
    caption: value.caption ?? '',
    englishCaption,
    priority: Boolean(value.priority),
  }
}

export function linesToArray(value: string) {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

export function arrayToLines(value: string[] | undefined) {
  return (value ?? []).join('\n')
}

export async function responseMessage(res: Response) {
  try {
    const data = (await res.json()) as { message?: string; error?: string }
    return data.message || data.error || `Request failed (${res.status})`
  } catch {
    return `Request failed (${res.status})`
  }
}
