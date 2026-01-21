// src/app/(site)/services/pageClient/function.ts
import servicesData from './services.json'

export type PriceRange = { min: number; max?: number | null }

export type BaseType = {
  id: string
  title: string
  subtitle: string
  price: PriceRange
  details: string[]
}

export type Addon = {
  id: string
  title: string
  desc: string
  price: PriceRange
  tag?: string
}

export type ServicesJSON = {
  baseTypes: BaseType[]
  addonsSmall: Addon[]
  addonsLarge: Addon[]
}

export const DATA = servicesData as ServicesJSON
export const LS_KEY = 'vetra_services_calc_v3'

export function formatTHB(n: number) {
  return new Intl.NumberFormat('th-TH').format(n)
}

export function formatRange(r: PriceRange) {
  const min = formatTHB(r.min)
  const max = r.max == null ? null : formatTHB(r.max)
  if (max == null) return `${min}+ บาท`
  if (r.min === r.max) return `${min} บาท`
  return `${min} – ${max} บาท`
}

export function addRanges(a: PriceRange, b: PriceRange): PriceRange {
  const min = a.min + b.min
  const max =
    a.max == null || b.max == null
      ? null
      : (a.max as number) + (b.max as number)
  return { min, max }
}

export function sumRanges(ranges: PriceRange[]) {
  return ranges.reduce<PriceRange>((acc, r) => addRanges(acc, r), {
    min: 0,
    max: 0,
  })
}

export function uniq(ids: string[]) {
  return Array.from(new Set(ids))
}

export function buildBreakdownText(args: {
  baseTitle: string
  basePrice: PriceRange
  selectedSmall: { title: string; price: PriceRange }[]
  selectedLarge: { title: string; price: PriceRange }[]
  total: PriceRange
}) {
  const { baseTitle, basePrice, selectedSmall, selectedLarge, total } = args

  const lines: string[] = []
  lines.push(`ประเภทเว็บไซต์: ${baseTitle} (${formatRange(basePrice)})`)

  if (selectedSmall.length) {
    lines.push('')
    lines.push('ฟังก์ชันเพิ่มเติม (เล็ก):')
    for (const a of selectedSmall)
      lines.push(`- ${a.title} (${formatRange(a.price)})`)
  }

  if (selectedLarge.length) {
    lines.push('')
    lines.push('ฟังก์ชันเพิ่มเติม (ใหญ่):')
    for (const a of selectedLarge)
      lines.push(`- ${a.title} (${formatRange(a.price)})`)
  }

  lines.push('')
  lines.push(`รวมโดยประมาณ: ${formatRange(total)}`)
  lines.push('')
  lines.push(
    'หมายเหตุ: เป็นราคาโดยประมาณเท่านั้น ราคาจริงจะมีหักส่วนลด และแถมฟังก์ชันให้ โดยคิดตามความยากง่ายของงาน',
  )

  return lines.join('\n')
}
