// src/components/Slider/useSlider.ts
'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Slide } from './function'
import {
  clampTrackIndex,
  getLoopSlides,
  getRealIndex,
  isInteractiveTarget,
} from './function'

type UseSliderArgs = {
  slides: Slide[]
  ariaLabel?: string
  intervalMs?: number
}

export function useSlider({
  slides,
  ariaLabel = 'Image carousel',
  intervalMs = 3000,
}: UseSliderArgs) {
  const total = slides.length
  const isLoop = total > 1
  const loopSlides = useMemo(() => getLoopSlides(slides), [slides])

  const [index, setIndex] = useState(isLoop ? 1 : 0)
  const [isHovering, setIsHovering] = useState(false)

  // drag
  const [isDragging, setIsDragging] = useState(false)
  const [dragPx, setDragPx] = useState(0)
  const [enableTransition, setEnableTransition] = useState(true)
  const lastDragAtRef = useRef<number>(-Infinity)


  // modal
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalIndex, setModalIndex] = useState(0)

  // refs
  const rootRef = useRef<HTMLDivElement | null>(null)
  const viewportRef = useRef<HTMLDivElement | null>(null)

  const pointerIdRef = useRef<number | null>(null)
  const startXRef = useRef(0)
  const lastXRef = useRef(0)
  const didDragRef = useRef(false)

  const indexRef = useRef(index)
  useEffect(() => {
    indexRef.current = index
  }, [index])

  const totalRef = useRef(total)
  useEffect(() => {
    totalRef.current = total
  }, [total])

  const isLoopRef = useRef(isLoop)
  useEffect(() => {
    isLoopRef.current = isLoop
  }, [isLoop])

  // basic nav (✅ clamp prevents runaway index)
  const next = useCallback(() => {
    if (total <= 1) return
    setIndex((v) => clampTrackIndex(v + 1, total, isLoop))
  }, [total, isLoop])

  const prev = useCallback(() => {
    if (total <= 1) return
    setIndex((v) => clampTrackIndex(v - 1, total, isLoop))
  }, [total, isLoop])

  // dots
  const goTo = useCallback(
    (realIdx: number) => {
      if (total <= 0) return
      setIndex(isLoop ? realIdx + 1 : realIdx)
    },
    [total, isLoop],
  )

  // modal nav
  const openModal = useCallback(
    (realIdx: number) => {
      if (total <= 0) return
      setModalIndex(Math.min(Math.max(realIdx, 0), total - 1))
      setIsModalOpen(true)
    },
    [total],
  )

  const closeModal = useCallback(() => setIsModalOpen(false), [])

  const nextModal = useCallback(() => {
    if (total <= 1) return
    setModalIndex((v) => (v + 1) % total)
  }, [total])

  const prevModal = useCallback(() => {
    if (total <= 1) return
    setModalIndex((v) => (v - 1 + total) % total)
  }, [total])

  // reset when slides change
  useEffect(() => {
      setEnableTransition(false)
      setIndex(isLoop ? 1 : 0)
      setDragPx(0)
      setIsDragging(false)
      didDragRef.current = false
      setModalIndex((v) =>
        total <= 0 ? 0 : Math.min(Math.max(v, 0), total - 1),
      )

    requestAnimationFrame(() => {
      requestAnimationFrame(() => setEnableTransition(true))
    })
  }, [isLoop, total])

  // keyboard for slider root
  useEffect(() => {
    const el = rootRef.current
    if (!el) return

    const onKeyDown = (e: KeyboardEvent) => {
      if (isModalOpen) return
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        prev()
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        next()
      }
    }

    el.addEventListener('keydown', onKeyDown)
    return () => el.removeEventListener('keydown', onKeyDown)
  }, [isModalOpen, next, prev])

  // tab visibility normalize
  useEffect(() => {
    const onVisibility = () => {
        if (document.hidden) return

        const t = totalRef.current
        const loop = isLoopRef.current
        const current = indexRef.current

        setEnableTransition(false)
        setDragPx(0)
        setIsDragging(false)
        didDragRef.current = false
        setIndex(clampTrackIndex(current, t, loop))

        requestAnimationFrame(() => {
            requestAnimationFrame(() => setEnableTransition(true))
        })
    }

    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  // autoplay
  useEffect(() => {
    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches

    if (reduce) return
    if (total <= 1) return
    if (isHovering || isDragging || isModalOpen) return
    if (typeof document !== 'undefined' && document.hidden) return

    const id = window.setInterval(() => next(), intervalMs)
    return () => window.clearInterval(id)
  }, [isHovering, isDragging, isModalOpen, intervalMs, total, next])

  // loop snap
  const onTransitionEnd = useCallback(() => {
    if (!isLoop || total <= 1) return

    if (index <= 0) {
        setEnableTransition(false)
        setIndex(total)
        requestAnimationFrame(() =>
            requestAnimationFrame(() => setEnableTransition(true)),
        )
    }

    if (index >= total + 1) {
        setEnableTransition(false)
        setIndex(1)
        requestAnimationFrame(() =>
            requestAnimationFrame(() => setEnableTransition(true)),
        )
    }
  }, [index, isLoop, total])

  // pointer drag handlers
  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (total <= 1) return
      if (isModalOpen) return
      if (isInteractiveTarget(e.target)) return
      if (e.button !== 0 && e.pointerType === 'mouse') return

      const el = viewportRef.current
      if (!el) return

      pointerIdRef.current = e.pointerId
      startXRef.current = e.clientX
      lastXRef.current = e.clientX
      didDragRef.current = false

        setIsDragging(true)
        setEnableTransition(false)
        setDragPx(0)

      try {
        el.setPointerCapture(e.pointerId)
      } catch {}
    },
    [total, isModalOpen],
  )

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDragging) return
      if (pointerIdRef.current !== e.pointerId) return

      const dx = e.clientX - startXRef.current
      lastXRef.current = e.clientX

      if (Math.abs(dx) > 6) didDragRef.current = true
      setDragPx(dx)
    },
    [isDragging],
  )

  const endDrag = useCallback(
    (pointerId?: number) => {
      const el = viewportRef.current
      if (pointerId != null && el) {
        try {
          el.releasePointerCapture(pointerId)
        } catch {}
      }

      const width = viewportRef.current?.clientWidth ?? 1
      const dx = lastXRef.current - startXRef.current
      const threshold = Math.max(44, Math.round(width * 0.18))

      const goPrev = dx > threshold
      const goNext = dx < -threshold

      // ✅ remember if we actually dragged in this gesture
      if (didDragRef.current) lastDragAtRef.current = performance.now()
      // ✅ reset so it doesn't block future zoom clicks
      didDragRef.current = false

      setEnableTransition(true)
      setDragPx(0)
      setIsDragging(false)

      if (goPrev) prev()
      if (goNext) next()

      pointerIdRef.current = null
    },
    [next, prev],
  )


  const onPointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDragging) return
      if (pointerIdRef.current !== e.pointerId) return
      endDrag(e.pointerId)
    },
    [isDragging, endDrag],
  )

  const onPointerCancel = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDragging) return
      if (pointerIdRef.current !== e.pointerId) return
      endDrag(e.pointerId)
    },
    [isDragging, endDrag],
  )

  if (total === 0) return null

  const realIndex = getRealIndex(index, total, isLoop)

  return {
    // data
    slides,
    loopSlides,
    total,
    isLoop,
    ariaLabel,

    // refs
    rootRef,
    viewportRef,

    // state
    index,
    realIndex,
    dragPx,
    enableTransition,

    isModalOpen,
    modalIndex,

    // setters for hover
    setIsHovering,

    // handlers
    next,
    prev,
    goTo,

    onTransitionEnd,

    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,

    // modal api
    openModal,
    closeModal,
    nextModal,
    prevModal,

    // drag flag
    lastDragAtRef,
  }
}
