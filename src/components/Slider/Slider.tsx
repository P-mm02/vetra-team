// src/components/Slider/Slider.tsx
'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import Image from 'next/image'

import styles from './Slider.module.css'
import Modal from './modal/Modal'

import {
  type Slide,
  clampTrackIndex,
  getLoopSlides,
  getRealIndex,
  isInteractiveTarget,
} from './function'

type SliderProps = {
  slides: Slide[]
  ariaLabel?: string
  intervalMs?: number
}

export default function Slider({
  slides,
  ariaLabel = 'Image carousel',
  intervalMs = 3000,
}: SliderProps) {
  const total = slides.length
  const isLoop = total > 1

  const loopSlides = useMemo(() => getLoopSlides(slides), [slides])

  // track index (loop: 0..total+1, non-loop: 0..total-1)
  const [index, setIndex] = useState(isLoop ? 1 : 0)

  const [isHovering, setIsHovering] = useState(false)

  // drag
  const [isDragging, setIsDragging] = useState(false)
  const [dragPx, setDragPx] = useState(0)
  const [enableTransition, setEnableTransition] = useState(true)

  // modal
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalIndex, setModalIndex] = useState(0) // real index 0..total-1

  const rootRef = useRef<HTMLDivElement | null>(null)
  const viewportRef = useRef<HTMLDivElement | null>(null)

  // drag refs (no re-render)
  const pointerIdRef = useRef<number | null>(null)
  const startXRef = useRef(0)
  const lastXRef = useRef(0)
  const didDragRef = useRef(false)

  // keep latest values for visibility handler
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

  // ✅ FIX: prevent index from ever going out of valid range (loop bug)
  const next = useCallback(() => {
    if (total <= 1) return
    setIndex((v) => clampTrackIndex(v + 1, total, isLoop))
  }, [total, isLoop])

  const prev = useCallback(() => {
    if (total <= 1) return
    setIndex((v) => clampTrackIndex(v - 1, total, isLoop))
  }, [total, isLoop])

  const nextModal = useCallback(() => {
    if (total <= 1) return
    setModalIndex((v) => (v + 1) % total)
  }, [total])

  const prevModal = useCallback(() => {
    if (total <= 1) return
    setModalIndex((v) => (v - 1 + total) % total)
  }, [total])

  const openModal = useCallback(
    (realIdx: number) => {
      if (total <= 0) return
      setModalIndex(Math.min(Math.max(realIdx, 0), total - 1))
      setIsModalOpen(true)
    },
    [total],
  )

  const closeModal = useCallback(() => setIsModalOpen(false), [])

  // Reset index cleanly when slide set changes
  useEffect(() => {
    flushSync(() => {
      setEnableTransition(false)
      setIndex(isLoop ? 1 : 0)
      setDragPx(0)
      setIsDragging(false)
      didDragRef.current = false

      setModalIndex((v) => {
        if (total <= 0) return 0
        return Math.min(Math.max(v, 0), total - 1)
      })
    })

    requestAnimationFrame(() => {
      requestAnimationFrame(() => setEnableTransition(true))
    })
  }, [isLoop, total])

  // Keyboard for slider root
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

  // Normalize when tab becomes visible again
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) return

      const t = totalRef.current
      const loop = isLoopRef.current
      const current = indexRef.current

      flushSync(() => {
        setEnableTransition(false)
        setDragPx(0)
        setIsDragging(false)
        didDragRef.current = false

        if (t <= 1) {
          setIndex(0)
          return
        }

        // clamp to safe range so we never keep a huge number
        setIndex(clampTrackIndex(current, t, loop))
      })

      requestAnimationFrame(() => {
        requestAnimationFrame(() => setEnableTransition(true))
      })
    }

    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  // Autoplay (pause on hover/drag/modal/hidden)
  useEffect(() => {
    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches

    if (reduce) return
    if (total <= 1) return
    if (isHovering) return
    if (isDragging) return
    if (isModalOpen) return
    if (typeof document !== 'undefined' && document.hidden) return

    const id = window.setInterval(() => next(), intervalMs)
    return () => window.clearInterval(id)
  }, [isHovering, isDragging, isModalOpen, intervalMs, total, next])

  const onTransitionEnd = useCallback(() => {
    if (!isLoop) return
    if (total <= 1) return

    // ✅ handle boundary safely (>= / <=) so we never get stuck
    if (index <= 0) {
      flushSync(() => {
        setEnableTransition(false)
        setIndex(total)
      })
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setEnableTransition(true))
      })
    }

    if (index >= total + 1) {
      flushSync(() => {
        setEnableTransition(false)
        setIndex(1)
      })
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setEnableTransition(true))
      })
    }
  }, [index, isLoop, total])

  // --- Pointer drag handlers ---
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
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

    flushSync(() => {
      setIsDragging(true)
      setEnableTransition(false)
      setDragPx(0)
    })

    try {
      el.setPointerCapture(e.pointerId)
    } catch {}
  }

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return
    if (pointerIdRef.current !== e.pointerId) return

    const dx = e.clientX - startXRef.current
    lastXRef.current = e.clientX

    if (Math.abs(dx) > 6) didDragRef.current = true
    setDragPx(dx)
  }

  const endDrag = (pointerId?: number) => {
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

    flushSync(() => {
      setEnableTransition(true)
      setDragPx(0)
      setIsDragging(false)
    })

    if (goPrev) prev()
    if (goNext) next()

    pointerIdRef.current = null
  }

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return
    if (pointerIdRef.current !== e.pointerId) return
    endDrag(e.pointerId)
  }

  const onPointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return
    if (pointerIdRef.current !== e.pointerId) return
    endDrag(e.pointerId)
  }

  if (total === 0) return null

  const realIndex = getRealIndex(index, total, isLoop)
  const modalSlide = slides[modalIndex]

  return (
    <>
      <div
        ref={rootRef}
        className={styles.root}
        tabIndex={0}
        role="region"
        aria-roledescription="carousel"
        aria-label={ariaLabel}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <div
          ref={viewportRef}
          className={styles.viewport}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerCancel}
        >
          <div
            className={`${styles.track} ${
              enableTransition ? '' : styles.trackNoAnim
            }`}
            style={{
              transform: `translate3d(calc(${-index * 100}% + ${dragPx}px), 0, 0)`,
            }}
            onTransitionEnd={onTransitionEnd}
          >
            {loopSlides.map((s, i) => (
              <div className={styles.slide} key={`${s.src}-${i}`}>
                <figure className={styles.figure}>
                  <div className={styles.media}>
                    <Image
                      className={styles.img}
                      src={s.src}
                      alt={s.alt}
                      fill
                      sizes="(max-width: 768px) 92vw, 720px"
                      priority={Boolean(s.priority)}
                      draggable={false}
                    />
                  </div>

                  <figcaption className={styles.caption}>
                    <span>{s.caption}</span>
                  </figcaption>
                </figure>
              </div>
            ))}
          </div>

          <button
            type="button"
            className={`${styles.btn} ${styles.btnLeft}`}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation()
              prev()
            }}
            aria-label="Previous slide"
          >
            <svg viewBox="0 0 24 24" width="44" height="44" aria-hidden="true">
              <path
                d="M15 18l-6-6 6-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          <button
            type="button"
            className={`${styles.btn} ${styles.btnRight}`}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation()
              next()
            }}
            aria-label="Next slide"
          >
            <svg viewBox="0 0 24 24" width="44" height="44" aria-hidden="true">
              <path
                d="M9 6l6 6-6 6"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          <button
            type="button"
            className={styles.zoom}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation()
              if (didDragRef.current) return
              openModal(realIndex)
            }}
            aria-label="Zoom image"
          >
            <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
              <path
                d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M21 21l-4.2-4.2"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M10.5 7.8v5.4M7.8 10.5h5.4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        <div
          className={styles.dots}
          role="tablist"
          aria-label="Slide navigation"
        >
          {slides.map((s, i) => {
            const active = i === realIndex
            return (
              <button
                key={`dot-${i}`}
                type="button"
                className={`${styles.dot} ${active ? styles.dotActive : ''}`}
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => setIndex(isLoop ? i + 1 : i)}
                aria-label={`Go to slide ${i + 1}: ${s.caption}`}
                aria-current={active ? 'true' : undefined}
                role="tab"
              />
            )
          })}
        </div>

        <p className={styles.sr} aria-live="polite">
          Showing slide {realIndex + 1} of {total}
        </p>
      </div>

      <Modal
        isOpen={isModalOpen}
        slide={modalSlide}
        index={modalIndex}
        total={total}
        onClose={closeModal}
        onPrev={prevModal}
        onNext={nextModal}
      />
    </>
  )
}
