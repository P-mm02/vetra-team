// src/app/projects/Projects/Projects.tsx
'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import styles from './Projects.module.css'
import projectsData from './projects.json'

import Modal, { type ProjectItem } from './Modal/Modal'

type FilterMode = 'example' | 'all'

export default function Projects() {
  const [mode, setMode] = useState<FilterMode>('example')
  const [active, setActive] = useState<ProjectItem | null>(null)

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
                  <div className="empty-div" />
                )}
                <span className={styles.badgeYear}>{p.year}</span>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* ✅ Modal extracted */}
      {active && <Modal project={active} onClose={closeModal} />}
    </div>
  )
}
