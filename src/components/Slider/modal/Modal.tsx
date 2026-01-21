// src/components/Slider/modal/Modal.tsx
'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import styles from './Modal.module.css'
import type { Slide } from '../function'

type ModalProps = {
  isOpen: boolean
  slide: Slide
  index: number
  total: number
  onClose: () => void
  onPrev: () => void
  onNext: () => void
}

export default function Modal({
  isOpen,
  slide,
  index,
  total,
  onClose,
  onPrev,
  onNext,
}: ModalProps) {
  const closeBtnRef = useRef<HTMLButtonElement | null>(null)

  // lock scroll + focus close
  useEffect(() => {
    if (!isOpen) return

    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    requestAnimationFrame(() => closeBtnRef.current?.focus())

    return () => {
      document.body.style.overflow = prevOverflow
    }
  }, [isOpen])

  // keyboard controls
  useEffect(() => {
    if (!isOpen) return

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        onPrev()
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        onNext()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isOpen, onClose, onPrev, onNext])

  if (!isOpen) return null

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label="Image preview"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className={styles.card}>
        <button
          ref={closeBtnRef}
          type="button"
          className={styles.close}
          onClick={onClose}
          aria-label="Close"
        >
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
            <path
              d="M18 6L6 18M6 6l12 12"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <div className={styles.media}>
          <Image
            src={slide.src}
            alt={slide.alt}
            fill
            sizes="(max-width: 768px) 96vw, 1100px"
            className={styles.img}
            priority
            draggable={false}
          />
        </div>

        <div className={styles.bar}>
          <div className={styles.caption}>
            <div className={styles.title}>{slide.caption}</div>
            <div className={styles.meta}>
              {index + 1} / {total}
            </div>
          </div>

          <div className={styles.controls}>
            <button
              type="button"
              className={styles.nav}
              onClick={onPrev}
              aria-label="Previous image"
              disabled={total <= 1}
            >
              <svg
                viewBox="0 0 24 24"
                width="22"
                height="22"
                aria-hidden="true"
              >
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
              className={styles.nav}
              onClick={onNext}
              aria-label="Next image"
              disabled={total <= 1}
            >
              <svg
                viewBox="0 0 24 24"
                width="22"
                height="22"
                aria-hidden="true"
              >
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
          </div>
        </div>

        <div className={styles.hint}>
          Tip: Press <kbd>Esc</kbd> to close, <kbd>←</kbd>/<kbd>→</kbd> to
          navigate.
        </div>
      </div>
    </div>
  )
}
