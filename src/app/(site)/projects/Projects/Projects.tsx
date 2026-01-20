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

  // ✅ search
  const [query, setQuery] = useState('')

  const allSorted = useMemo(() => {
    const list = (projectsData as ProjectItem[]).slice()
    list.sort((a, b) => b.year - a.year)
    return list
  }, [])

  const filtered = useMemo(() => {
    if (mode === 'all') return allSorted
    return allSorted.filter((p) => p.isExample)
  }, [mode, allSorted])

  // ✅ searchable string builder (safe on optional fields)
  const searchableText = (p: ProjectItem) => {
    const bits: Array<string | number | undefined> = [
      p.title,
      p.shortDesc,
      p.year,
      p.cover?.alt,
      p.stack?.join(' '),
      p.highlights?.join(' '),

      // if you add more fields later, drop them here:
      // p.client,
      // p.role,
    ]
    return bits.filter(Boolean).join(' ').toLowerCase()
  }

  const searched = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return filtered
    return filtered.filter((p) => searchableText(p).includes(q))
  }, [filtered, query])

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
            className={`${styles.tab} ${mode === 'example' ? styles.tabActive : ''}`}
            onClick={() => setMode('example')}
          >
            ตัวอย่าง
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={mode === 'all'}
            className={`${styles.tab} ${mode === 'all' ? styles.tabActive : ''}`}
            onClick={() => setMode('all')}
          >
            ทั้งหมด
          </button>
        </div>

        {/* ✅ Search */}
        <div className={styles.searchWrap}>
          <button
            type="button"
            className={styles.searchBtn}
            aria-label="Search projects"
            onClick={() => {
              const el = document.getElementById(
                'projects-search',
              ) as HTMLInputElement | null
              el?.focus()
            }}
          >
            {/* inline icon (no deps) */}
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path
                d="M10.5 3a7.5 7.5 0 105.2 12.9l3.2 3.2a1 1 0 001.4-1.4l-3.2-3.2A7.5 7.5 0 0010.5 3zm0 2a5.5 5.5 0 110 11 5.5 5.5 0 010-11z"
                fill="currentColor"
              />
            </svg>
          </button>

          <input
            id="projects-search"
            className={styles.searchInput}
            value={query}
            onChange={(e) => {
              const v = e.target.value
              setQuery(v)

              // ✅ if user is searching, show all
              if (v.trim()) setMode('all')
            }}
            placeholder="ค้นหา: ชื่อ / รายละเอียด / ปี / stack ..."
            aria-label="Search by title, description, year, stack, highlights"
          />

          {query.trim() ? (
            <button
              type="button"
              className={styles.clearBtn}
              onClick={() => setQuery('')}
              aria-label="Clear search"
              title="Clear"
            >
              ✕
            </button>
          ) : null}

          <span className={styles.count} aria-live="polite">
            {searched.length}/{filtered.length}
          </span>
        </div>
      </div>

      <div className={styles.grid}>
        {searched.map((p) => (
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
