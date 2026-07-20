// src/app/projects/Projects/Modal/Modal.tsx
'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import Slider from '@/components/Slider/Slider'
import { type Slide } from '@/components/Slider/function'
import styles from './Modal.module.css'
import { type Locale } from '@/lib/i18n'
import { projectModalText } from '../projectContent'

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
  locale?: Locale
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

export default function Modal({ project, onClose, locale = 'th' }: ModalProps) {
  const modalRef = useRef<HTMLDivElement | null>(null)
  const closeBtnRef = useRef<HTMLButtonElement | null>(null)
  const t = projectModalText[locale]
  const titleId = `project-title-${project.id}`
  const descriptionId = `project-description-${project.id}`

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null
    clampScrollLock(true)

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }

      if (e.key !== 'Tab') return

      const focusable = modalRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )
      if (!focusable?.length) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    window.addEventListener('keydown', onKeyDown)

    const t = window.setTimeout(() => closeBtnRef.current?.focus(), 0)

    return () => {
      window.clearTimeout(t)
      window.removeEventListener('keydown', onKeyDown)
      clampScrollLock(false)
      previouslyFocused?.focus()
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
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div ref={modalRef} className={styles.modal}>
        <div className={styles.modalCloseWrap}>
          <button
            ref={closeBtnRef}
            type="button"
            className={styles.modalClose}
            onClick={onClose}
            aria-label={t.closeModal}
          >
            <Image
              src="/icons/Utils/close-x.svg"
              alt=""
              width={40}
              height={40}
            />
          </button>
        </div>

        <div className={styles.modalHead}>
          <div className={styles.modalTitleWrap}>
            <p className={styles.modalKicker}>{t.details}</p>
            <h2 id={titleId} className={styles.modalTitle}>
              {project.title}
            </h2>
            <p id={descriptionId} className={styles.modalSub}>
              {project.shortDesc}
            </p>
          </div>
        </div>

        <div className={styles.modalGrid}>
          <div className={styles.modalMedia}>
            <Slider
              ariaLabel={`${t.imagesPrefix} ${project.title}`}
              intervalMs={4200}
              slides={slides}
              locale={locale}
            />
          </div>

          <div className={styles.modalBody}>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>{t.year}</span>
              <span className={styles.infoValue}>{project.year}</span>
            </div>

            {!!project.stack?.length && (
              <div className={styles.block}>
                <h4 className={styles.blockTitle}>{t.stack}</h4>
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
                <h4 className={styles.blockTitle}>{t.highlights}</h4>
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
                {t.close}
              </button>

              <span className={styles.footNote}>
                {t.tipPrefix} <kbd className={styles.kbd}>Esc</kbd>{' '}
                {t.tipSuffix}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
