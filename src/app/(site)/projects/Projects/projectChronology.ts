import type { ProjectItem } from './Modal/Modal'

// Project repositories completed in 2026, ordered from oldest to newest.
// `p-032-go-wallet` is the portfolio entry for the jeebtest project.
const PROJECT_ORDER_2026 = [
  'p-002-aree-fruit',
  'p-036-english-with-amol',
  'p-037-toilet-by-nakin',
  'p-032-go-wallet',
  'p-034-x-tribe',
  'p-035-phataree-thailand',
  'p-033-unix-peak-travel',
] as const

const PROJECT_RANK_2026 = new Map<string, number>(
  PROJECT_ORDER_2026.map((id, index) => [id, index]),
)

function projectNumber(id: string) {
  const match = id.match(/^p-(\d+)/)
  return match ? Number(match[1]) : 0
}

export function compareProjectsNewestFirst(
  a: ProjectItem,
  b: ProjectItem,
) {
  const yearDifference = b.year - a.year
  if (yearDifference !== 0) return yearDifference

  if (a.year === 2026) {
    const aRank = PROJECT_RANK_2026.get(a.id)
    const bRank = PROJECT_RANK_2026.get(b.id)

    if (aRank !== undefined && bRank !== undefined) return bRank - aRank
    if (aRank !== undefined) return -1
    if (bRank !== undefined) return 1
  }

  return projectNumber(b.id) - projectNumber(a.id)
}
