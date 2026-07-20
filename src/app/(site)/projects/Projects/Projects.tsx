// src/app/projects/Projects/Projects.tsx
'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import styles from './Projects.module.css'
import projectsData from './projects.json'

import Modal, { type ProjectItem } from './Modal/Modal'
import { type Locale } from '@/lib/i18n'
import { localizeProject, projectUiText } from './projectContent'

type FilterMode = 'example' | 'all'
type ProjectCategory = 'all' | 'business' | 'commerce' | 'webapp' | 'internal'

const PROJECT_CATEGORY_BY_ID: Partial<
  Record<ProjectItem['id'], Exclude<ProjectCategory, 'all'>>
> = {
  'p-005-electronic': 'commerce',
  'p-007-furniture': 'commerce',
  'p-012-manhwa-manhua-manga-2': 'webapp',
  'p-014-novel-2': 'webapp',
  'p-018-pet-2': 'commerce',
  'p-025-sgw-working': 'internal',
  'p-028-swipswap': 'webapp',
  'p-029-underwear-3': 'commerce',
  'p-030-weedex': 'webapp',
  'p-032-go-wallet': 'webapp',
  'p-034-x-tribe': 'commerce',
}

function getProjectCategory(
  project: ProjectItem,
): Exclude<ProjectCategory, 'all'> {
  return PROJECT_CATEGORY_BY_ID[project.id] ?? 'business'
}

export default function Projects({ locale = 'th' }: { locale?: Locale }) {
  const [mode, setMode] = useState<FilterMode>('example')
  const [category, setCategory] = useState<ProjectCategory>('all')
  const [active, setActive] = useState<ProjectItem | null>(null)
  const t = projectUiText[locale]
  const categoryOptions = useMemo<
    Array<{ value: ProjectCategory; label: string }>
  >(
    () => [
      { value: 'all', label: t.categoryAll },
      { value: 'business', label: t.categoryBusiness },
      { value: 'commerce', label: t.categoryCommerce },
      { value: 'webapp', label: t.categoryWebapp },
      { value: 'internal', label: t.categoryInternal },
    ],
    [t],
  )

  // ✅ search
  const [query, setQuery] = useState('')

  const allSorted = useMemo(() => {
    const list = (projectsData as ProjectItem[])
      .map((p) => localizeProject(p, locale))
      .slice()
    list.sort((a, b) => b.year - a.year)
    return list
  }, [locale])

  const filtered = useMemo(() => {
    const modeFiltered =
      mode === 'all' ? allSorted : allSorted.filter((p) => p.isExample)

    if (category === 'all') return modeFiltered
    return modeFiltered.filter((p) => getProjectCategory(p) === category)
  }, [mode, category, allSorted])

  const searched = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return filtered

    return filtered.filter((p) => {
      const searchableText = [
        p.title,
        p.shortDesc,
        p.year,
        p.cover?.alt,
        p.stack?.join(' '),
        p.highlights?.join(' '),
        categoryOptions.find(
          (option) => option.value === getProjectCategory(p),
        )?.label,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return searchableText.includes(q)
    })
  }, [filtered, query, categoryOptions])

  useEffect(() => {
    const syncProjectFromUrl = () => {
      const projectId = new URLSearchParams(window.location.search).get(
        'project',
      )
      const project = allSorted.find((item) => item.id === projectId)
      const nextActive = project?.hasDetail ? project : null

      setActive(nextActive)
      if (nextActive && !nextActive.isExample) setMode('all')
    }

    syncProjectFromUrl()
    window.addEventListener('popstate', syncProjectFromUrl)

    return () => window.removeEventListener('popstate', syncProjectFromUrl)
  }, [allSorted])

  const openModal = useCallback((p: ProjectItem) => {
    if (!p.hasDetail) return

    const url = new URL(window.location.href)
    url.searchParams.set('project', p.id)
    window.history.pushState({}, '', url)
    setActive(p)
  }, [])

  const closeModal = useCallback(() => {
    const url = new URL(window.location.href)
    url.searchParams.delete('project')
    window.history.replaceState({}, '', url)
    setActive(null)
  }, [])

  return (
    <div className={styles.wrap}>
      <div className={styles.topBar}>
        <div className={styles.filterControls}>
          <div
            className={styles.tabs}
            role="tablist"
            aria-label={t.filterLabel}
          >
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'example'}
              className={`${styles.tab} ${mode === 'example' ? styles.tabActive : ''}`}
              onClick={() => {
                setMode('example')
                setCategory('all')
              }}
            >
              {t.example}
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={mode === 'all'}
              className={`${styles.tab} ${mode === 'all' ? styles.tabActive : ''}`}
              onClick={() => setMode('all')}
            >
              {t.all}
            </button>
          </div>

          <div
            className={styles.categoryFilters}
            role="group"
            aria-label={t.categoryFilterLabel}
          >
            {categoryOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`${styles.categoryButton} ${
                  category === option.value ? styles.categoryButtonActive : ''
                }`}
                aria-pressed={category === option.value}
                onClick={() => {
                  setCategory(option.value)
                  if (option.value !== 'all') setMode('all')
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* ✅ Search */}
        <div className={styles.searchWrap}>
          <button
            type="button"
            className={styles.searchBtn}
            aria-label={t.searchButton}
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
            placeholder={t.searchPlaceholder}
            aria-label={t.searchLabel}
          />

          {query.trim() ? (
            <button
              type="button"
              className={styles.clearBtn}
              onClick={() => setQuery('')}
              aria-label={t.clearSearch}
              title={t.clearTitle}
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
        {searched.map((p, index) => (
          <article key={p.id} className={styles.card}>
            <div className={styles.cover}>
              <Image
                src={p.cover.src}
                alt={p.cover.alt}
                fill
                sizes="(max-width: 769px) 100vw, 33vw"
                className={styles.coverImg}
                priority={index < 2}
              />
            </div>

            <div className={styles.body}>
              <div className={styles.cardTop}>
                <span className={styles.categoryBadge}>
                  {
                    categoryOptions.find(
                      (option) =>
                        option.value === getProjectCategory(p),
                    )?.label
                  }
                </span>
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
                    {t.detail}
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

      {!searched.length ? <p className={styles.empty}>{t.empty}</p> : null}

      {/* ✅ Modal extracted */}
      {active && (
        <Modal project={active} onClose={closeModal} locale={locale} />
      )}
    </div>
  )
}
