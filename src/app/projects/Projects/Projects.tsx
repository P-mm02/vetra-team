// src/app/projects/Projects/Projects.tsx
'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import styles from './Projects.module.css'
import projectsData from './projects.json'

// ✅ add Slider
import Slider, { type Slide } from '@/components/Slider/Slider'

type ProjectItem = {
  id: string
  title: string
  shortDesc: string
  year: number
  isExample: boolean
  hasDetail?: boolean
  cover: { src: string; alt: string }

  // ✅ slider images for modal
  slides?: Slide[]

  stack?: string[]
  highlights?: string[]
}

type FilterMode = 'example' | 'all'

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

export default function Projects() {
  const [mode, setMode] = useState<FilterMode>('example')
  const [active, setActive] = useState<ProjectItem | null>(null)

  const closeBtnRef = useRef<HTMLButtonElement | null>(null)

  const allSorted = useMemo(() => {
    const list = (projectsData as ProjectItem[]).slice()
    list.sort((a, b) => b.year - a.year)
    return list
  }, [])

  const filtered = useMemo(() => {
    if (mode === 'all') return allSorted
    return allSorted.filter((p) => p.isExample)
  }, [mode, allSorted])

  const openModal = (p: ProjectItem) => {
    if (!p.hasDetail) return
    setActive(p)
  }

  const closeModal = () => setActive(null)

  useEffect(() => {
    const isOpen = Boolean(active)
    clampScrollLock(isOpen)

    if (!isOpen) return

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal()
    }

    window.addEventListener('keydown', onKeyDown)

    // focus close button on open
    const t = window.setTimeout(() => closeBtnRef.current?.focus(), 0)

    return () => {
      window.clearTimeout(t)
      window.removeEventListener('keydown', onKeyDown)
      clampScrollLock(false)
    }
  }, [active])

  return (
    <div className={styles.wrap}>
      <div className={styles.topBar}>
        <div
          className={styles.tabs}
          role="tablist"
          aria-label="Projects filter"
        >
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'example'}
            className={`${styles.tab} ${
              mode === 'example' ? styles.tabActive : ''
            }`}
            onClick={() => setMode('example')}
          >
            ตัวอย่าง
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={mode === 'all'}
            className={`${styles.tab} ${
              mode === 'all' ? styles.tabActive : ''
            }`}
            onClick={() => setMode('all')}
          >
            ทั้งหมด
          </button>
        </div>

        <div className={styles.meta}>
          <span className={styles.count}>{filtered.length} items</span>
          <span className={styles.dot} aria-hidden="true" />
          <span className={styles.sortHint}>
            Sorted by year (newest → oldest)
          </span>
        </div>
      </div>

      <div className={styles.grid}>
        {filtered.map((p) => (
          <article key={p.id} className={styles.card}>
            <div className={styles.cover}>
              <Image
                src={p.cover.src}
                alt={p.cover.alt}
                fill
                sizes="(max-width: 769px) 100vw, 33vw"
                className={styles.coverImg}
                priority={p.year >= allSorted[0]?.year}
              />
            </div>

            <div className={styles.body}>
              <div className={styles.cardTop}>
                <h3 className={styles.cardTitle}>{p.title}</h3>
                <p className={styles.cardDesc}>{p.shortDesc}</p>
              </div>

              <div className={styles.actions}>
                {p.hasDetail ? (
                  <button
                    type="button"
                    className={styles.btn}
                    onClick={() => openModal(p)}
                  >
                    รายละเอียด
                  </button>
                ) : (
                  <div className={'empty-div'} />
                )}
                <span className={styles.badgeYear}>{p.year}</span>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Modal */}
      {active && (
        <div
          className={styles.modalOverlay}
          role="dialog"
          aria-modal="true"
          aria-label={`รายละเอียด ${active.title}`}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeModal()
          }}
        >
          <div className={styles.modal}>
            <div className={styles.modalCloseWrap}>
              <button
                ref={closeBtnRef}
                type="button"
                className={styles.modalClose}
                onClick={closeModal}
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
                <h3 className={styles.modalTitle}>{active.title}</h3>
                <p className={styles.modalSub}>{active.shortDesc}</p>
              </div>
            </div>
            <div className={styles.modalGrid}>
              {/* ✅ Slider (fallback to cover if slides missing) */}
              <div className={styles.modalMedia}>
                <Slider
                  ariaLabel={`Project images: ${active.title}`}
                  intervalMs={4200}
                  slides={
                    active.slides?.length
                      ? active.slides
                      : [
                          {
                            src: active.cover.src,
                            alt: active.cover.alt,
                            caption: active.title,
                            priority: true,
                          },
                        ]
                  }
                />
              </div>

              <div className={styles.modalBody}>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Year</span>
                  <span className={styles.infoValue}>{active.year}</span>
                </div>

                {!!active.stack?.length && (
                  <div className={styles.block}>
                    <h4 className={styles.blockTitle}>Stack</h4>
                    <div className={styles.pills}>
                      {active.stack.map((s) => (
                        <span key={s} className={styles.pill}>
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {!!active.highlights?.length && (
                  <div className={styles.block}>
                    <h4 className={styles.blockTitle}>Highlights</h4>
                    <ul className={styles.list}>
                      {active.highlights.map((h, idx) => (
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
                    onClick={closeModal}
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
      )}
    </div>
  )
}
