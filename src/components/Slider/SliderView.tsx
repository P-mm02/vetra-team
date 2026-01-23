// src/components/Slider/SliderView.tsx
'use client'

import Image from 'next/image'
import Modal from './modal/Modal'
import type { Slide } from './function'

type Styles = Record<string, string>

type Props = {
  styles: Styles

  slides: Slide[]
  loopSlides: Slide[]
  total: number
  ariaLabel: string

  rootRef: React.RefObject<HTMLDivElement | null>
  viewportRef: React.RefObject<HTMLDivElement | null>

  index: number
  realIndex: number
  dragPx: number
  enableTransition: boolean

  isModalOpen: boolean
  modalIndex: number

  setIsHovering: (v: boolean) => void

  next: () => void
  prev: () => void
  goTo: (realIdx: number) => void

  onTransitionEnd: () => void

  onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void
  onPointerMove: (e: React.PointerEvent<HTMLDivElement>) => void
  onPointerUp: (e: React.PointerEvent<HTMLDivElement>) => void
  onPointerCancel: (e: React.PointerEvent<HTMLDivElement>) => void

  openModal: (realIdx: number) => void
  closeModal: () => void
  nextModal: () => void
  prevModal: () => void

  lastDragAtRef: React.RefObject<number>
}

export default function SliderView({
  styles,
  slides,
  loopSlides,
  total,
  ariaLabel,

  rootRef,
  viewportRef,

  index,
  realIndex,
  dragPx,
  enableTransition,

  isModalOpen,
  modalIndex,

  setIsHovering,

  next,
  prev,
  goTo,

  onTransitionEnd,

  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,

  openModal,
  closeModal,
  nextModal,
  prevModal,

  lastDragAtRef,
}: Props) {
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
            className={`${styles.track} ${enableTransition ? '' : styles.trackNoAnim}`}
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
              if (performance.now() - lastDragAtRef.current < 250) return
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
                onClick={() => goTo(i)}
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
