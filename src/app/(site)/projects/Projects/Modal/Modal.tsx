// src/app/projects/Projects/Modal/Modal.tsx
'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import Slider from '@/components/Slider/Slider'
import { type Slide } from '@/components/Slider/function'
import styles from './Modal.module.css'

export type ProjectItem = {
  id: string
  title: string
  shortDesc: string
  year: number
  isExample: boolean
  hasDetail?: boolean
  cover: { src: string; alt: string }
  slides?: Slide[]
  stack?: string[]
  highlights?: string[]
}

type ModalProps = {
  project: ProjectItem
  onClose: () => void
}

function clampScrollLock(lock: boolean) {
  const body = document.body
  if (!body) return
  if (lock) {
    body.dataset.scrollLock = '1'
    body.style.overflow = 'hidden'
  } else {
    delete body.dataset.scrollLock
    body.style.overflow = ''
  }
}

export default function Modal({ project, onClose }: ModalProps) {
  const closeBtnRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    clampScrollLock(true)

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)

    const t = window.setTimeout(() => closeBtnRef.current?.focus(), 0)

    return () => {
      window.clearTimeout(t)
      window.removeEventListener('keydown', onKeyDown)
      clampScrollLock(false)
    }
  }, [onClose])

  const slides = project.slides?.length
    ? project.slides
    : [
        {
          src: project.cover.src,
          alt: project.cover.alt,
          caption: project.title,
          priority: true,
        },
      ]

  return (
    <div
      className={styles.modalOverlay}
      role="dialog"
      aria-modal="true"
      aria-label={`รายละเอียด ${project.title}`}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className={styles.modal}>
        <div className={styles.modalCloseWrap}>
          <button
            ref={closeBtnRef}
            type="button"
            className={styles.modalClose}
            onClick={onClose}
            aria-label="Close modal"
          >
            <Image
              src="/icons/Utils/close-x.svg"
              alt="Close"
              width={40}
              height={40}
            />
          </button>
        </div>

        <div className={styles.modalHead}>
          <div className={styles.modalTitleWrap}>
            <p className={styles.modalKicker}>Project details</p>
            <h3 className={styles.modalTitle}>{project.title}</h3>
            <p className={styles.modalSub}>{project.shortDesc}</p>
          </div>
        </div>

        <div className={styles.modalGrid}>
          <div className={styles.modalMedia}>
            <Slider
              ariaLabel={`Project images: ${project.title}`}
              intervalMs={4200}
              slides={slides}
            />
          </div>

          <div className={styles.modalBody}>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Year</span>
              <span className={styles.infoValue}>{project.year}</span>
            </div>

            {!!project.stack?.length && (
              <div className={styles.block}>
                <h4 className={styles.blockTitle}>Stack</h4>
                <div className={styles.pills}>
                  {project.stack.map((s) => (
                    <span key={s} className={styles.pill}>
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {!!project.highlights?.length && (
              <div className={styles.block}>
                <h4 className={styles.blockTitle}>Highlights</h4>
                <ul className={styles.list}>
                  {project.highlights.map((h, idx) => (
                    <li key={`${idx}-${h}`} className={styles.li}>
                      <span className={styles.bullet} aria-hidden="true" />
                      <span className={styles.liText}>{h}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className={styles.modalFoot}>
              <button
                type="button"
                className={styles.btnGhost}
                onClick={onClose}
              >
                Close
              </button>

              <span className={styles.footNote}>
                Tip: press <kbd className={styles.kbd}>Esc</kbd> to close.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
