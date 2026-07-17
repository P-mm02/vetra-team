// src/app/(site)/services/pageClient/usePageClient.ts
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  DATA_BY_LOCALE,
  LS_KEY,
  buildBreakdownText,
  formatRange,
  sumRanges,
  uniq,
  type PriceRange,
} from './function'
import type { Locale } from '@/lib/i18n'

export function usePageClient(locale: Locale = 'th') {
  const DATA = DATA_BY_LOCALE[locale]
  const storageKey = `${LS_KEY}_${locale}`
  const [baseId, setBaseId] = useState<string>(DATA.baseTypes[0]?.id ?? '')
  const [smallIds, setSmallIds] = useState<string[]>([])
  const [largeIds, setLargeIds] = useState<string[]>([])

  // ✅ open/close "more" state (per group)
  const [openBaseId, setOpenBaseId] = useState<string | null>(null)
  const [openSmallIds, setOpenSmallIds] = useState<string[]>([])
  const [openLargeIds, setOpenLargeIds] = useState<string[]>([])

  // ✅ copied feedback (for both copy buttons)
  const [copied, setCopied] = useState(false)
  const copyTimerRef = useRef<number | null>(null)

  function toggleOpenBase(id: string) {
    setOpenBaseId((prev) => (prev === id ? null : id))
  }
  function toggleOpenSmall(id: string) {
    setOpenSmallIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }
  function toggleOpenLarge(id: string) {
    setOpenLargeIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  function toggleSmall(id: string) {
    setSmallIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  function toggleLarge(id: string) {
    setLargeIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  function resetAll() {
    setBaseId(DATA.baseTypes[0]?.id ?? '')
    setSmallIds([])
    setLargeIds([])

    // optional: close all
    setOpenBaseId(null)
    setOpenSmallIds([])
    setOpenLargeIds([])
  }

  // restore
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey)
      if (!raw) return
      const parsed = JSON.parse(raw) as {
        baseId?: string
        smallIds?: string[]
        largeIds?: string[]
      }

      if (parsed.baseId && DATA.baseTypes.some((b) => b.id === parsed.baseId)) {
        setBaseId(parsed.baseId)
      }

      if (Array.isArray(parsed.smallIds)) {
        const ok = parsed.smallIds.filter((id) =>
          DATA.addonsSmall.some((a) => a.id === id),
        )
        setSmallIds(uniq(ok))
      }

      if (Array.isArray(parsed.largeIds)) {
        const ok = parsed.largeIds.filter((id) =>
          DATA.addonsLarge.some((a) => a.id === id),
        )
        setLargeIds(uniq(ok))
      }
    } catch {
      // ignore
    }
  }, [DATA.addonsLarge, DATA.addonsSmall, DATA.baseTypes, storageKey])

  // persist
  useEffect(() => {
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({ baseId, smallIds, largeIds }),
      )
    } catch {
      // ignore
    }
  }, [baseId, smallIds, largeIds, storageKey])

  // cleanup copy timer
  useEffect(() => {
    return () => {
      if (copyTimerRef.current) window.clearTimeout(copyTimerRef.current)
    }
  }, [])

  const base = useMemo(
    () => DATA.baseTypes.find((b) => b.id === baseId) ?? DATA.baseTypes[0],
    [DATA.baseTypes, baseId],
  )

  const selectedSmall = useMemo(
    () => DATA.addonsSmall.filter((a) => smallIds.includes(a.id)),
    [DATA.addonsSmall, smallIds],
  )

  const selectedLarge = useMemo(
    () => DATA.addonsLarge.filter((a) => largeIds.includes(a.id)),
    [DATA.addonsLarge, largeIds],
  )

  const total = useMemo(() => {
    const parts: PriceRange[] = []
    if (base?.price) parts.push(base.price)
    parts.push(...selectedSmall.map((x) => x.price))
    parts.push(...selectedLarge.map((x) => x.price))
    return sumRanges(parts)
  }, [base, selectedSmall, selectedLarge])

  const breakdownText = useMemo(() => {
    return buildBreakdownText({
      baseTitle: base?.title ?? '-',
      basePrice: base?.price ?? { min: 0, max: 0 },
      selectedSmall: selectedSmall.map((x) => ({
        title: x.title,
        price: x.price,
      })),
      selectedLarge: selectedLarge.map((x) => ({
        title: x.title,
        price: x.price,
      })),
      total,
    }, locale)
  }, [base, selectedSmall, selectedLarge, total, locale])

  async function copyBrief() {
    try {
      await navigator.clipboard.writeText(breakdownText)
      setCopied(true)
      if (copyTimerRef.current) window.clearTimeout(copyTimerRef.current)
      copyTimerRef.current = window.setTimeout(() => setCopied(false), 1200)
    } catch {
      // ignore
    }
  }

  return {
    DATA,

    // selections
    baseId,
    setBaseId,
    smallIds,
    largeIds,
    toggleSmall,
    toggleLarge,
    resetAll,

    // open states
    openBaseId,
    openSmallIds,
    openLargeIds,
    toggleOpenBase,
    toggleOpenSmall,
    toggleOpenLarge,

    // computed
    base,
    selectedSmall,
    selectedLarge,
    total,
    breakdownText,
    formatRange: (range: PriceRange) => formatRange(range, locale),

    // copied feedback
    copied,
    copyBrief,
  }
}
