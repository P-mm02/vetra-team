// src/components/Slider/function.ts

export type Slide = {
  src: string
  alt: string
  caption: string
  priority?: boolean
}

export function clamp(n: number, min: number, max: number) {
  return Math.min(Math.max(n, min), max)
}

export function mod(n: number, m: number) {
  return ((n % m) + m) % m
}

export function getLoopSlides(slides: Slide[]) {
  const total = slides.length
  if (total <= 1) return slides
  return [slides[total - 1], ...slides, slides[0]]
}

/**
 * For loop mode, index is "track index" in range 0..total+1 (includes clones).
 * This returns the real slide index in range 0..total-1 safely.
 */
export function getRealIndex(index: number, total: number, isLoop: boolean) {
  if (total <= 0) return 0

  if (!isLoop) return clamp(index, 0, total - 1)

  const safe = clamp(index, 0, total + 1)
  if (safe === 0) return total - 1
  if (safe === total + 1) return 0
  return safe - 1
}

export function clampTrackIndex(index: number, total: number, isLoop: boolean) {
  if (total <= 0) return 0
  return isLoop ? clamp(index, 0, total + 1) : clamp(index, 0, total - 1)
}

export function isInteractiveTarget(t: EventTarget | null) {
  if (!(t instanceof HTMLElement)) return false
  return Boolean(
    t.closest('button, a, input, textarea, select, [role="button"]'),
  )
}
