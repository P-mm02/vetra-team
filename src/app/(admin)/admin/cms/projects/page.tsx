'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useCmsI18n } from '@/components/cms/CmsLanguageProvider'
import { portfolioText } from './_components/i18n'
import Image from 'next/image'
import { ArrowUpRight, Plus, Search, Trash2 } from 'lucide-react'
import { CATEGORY_LABELS, responseMessage, type PortfolioRecord, type ProjectCategory } from './_components/types'
import styles from './projects.module.css'

type ProjectListResponse = { projects: PortfolioRecord[]; canEdit: boolean; mediaConfigured: boolean }
type Filter = 'all' | 'featured' | ProjectCategory

export default function ProjectsPage() {
  const { locale, t, formatNumber } = useCmsI18n()
  const text = (message: string) => portfolioText(message, locale)
  const [projects, setProjects] = useState<PortfolioRecord[]>([])
  const [canEdit, setCanEdit] = useState(false)
  const [mediaConfigured, setMediaConfigured] = useState(true)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Filter>('all')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/projects', { cache: 'no-store' })
      if (!res.ok) throw new Error(await responseMessage(res))
      const data = (await res.json()) as ProjectListResponse
      setProjects(data.projects ?? [])
      setCanEdit(Boolean(data.canEdit))
      setMediaConfigured(Boolean(data.mediaConfigured))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not load projects.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  const visible = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase()
    return projects
      .filter((project) => {
        if (filter === 'featured' && !project.isExample) return false
        if (filter !== 'all' && filter !== 'featured' && project.category !== filter) return false
        if (!needle) return true
        return [project.title, project.english?.title, project.shortDesc, project.english?.shortDesc, project.id, project.year]
          .join(' ').toLocaleLowerCase().includes(needle)
      })
      .sort((a, b) => a.sortOrder - b.sortOrder || b.year - a.year || a.title.localeCompare(b.title))
  }, [projects, query, filter])

  return (
    <main className={styles.page}>
      <div className={styles.eyebrow}>{text("Portfolio / Content")}</div>
      <header className={styles.header}>
        <div><h1 className={styles.title}>{text("Projects")}</h1><p className={styles.intro}>{text("Keep the Thai and English portfolio, images, and featured order in one place.")}</p></div>
        <div className={styles.headerActions}>
          <Link className={styles.textButton} href="/admin/cms/trash"><Trash2 size={18} aria-hidden="true" />{text("Trash")}</Link>
          {canEdit && <Link className={styles.primaryButton} href="/admin/cms/projects/new"><Plus size={18} aria-hidden="true" />{text("Add project")}</Link>}
        </div>
      </header>
      {!mediaConfigured && !loading && <p className={styles.notice}>{text("Media storage is not configured. New images cannot be uploaded.")}</p>}
      {!canEdit && !loading && <p className={styles.notice}>{text("You have read-only access to this portfolio.")}</p>}
      <section className={styles.metrics} aria-label={text("Portfolio overview")}>
        <div className={styles.metric}><span>{text("Total projects")}</span><strong>{loading ? '—' : formatNumber(projects.length)}</strong></div>
        <div className={styles.metric}><span>{text("Featured")}</span><strong>{loading ? '—' : formatNumber(projects.filter((project) => project.isExample).length)}</strong></div>
        <div className={styles.metric}><span>{text("With details")}</span><strong>{loading ? '—' : formatNumber(projects.filter((project) => project.hasDetail).length)}</strong></div>
      </section>
      <section className={styles.collection} aria-label={text("Project list")}>
        <div className={styles.toolbar}>
          <div><h2>{text("Portfolio library")}</h2><p>{loading ? text("Loading…") : t(`${formatNumber(visible.length)} of ${formatNumber(projects.length)} projects`, `${formatNumber(visible.length)} จาก ${formatNumber(projects.length)} โปรเจกต์`)}</p></div>
          <label className={styles.search}><span className={styles.srOnly}>{text("Search projects")}</span><Search size={20} aria-hidden="true" /><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={text("Search title, ID, or year")} /></label>
        </div>
        <div className={styles.filters} role="group" aria-label={text("Filter projects")}>
          {(['all', 'featured', 'business', 'commerce', 'webapp', 'internal'] as Filter[]).map((value) => (
            <button key={value} type="button" className={`${styles.filterButton} ${filter === value ? styles.filterActive : ''}`} aria-pressed={filter === value} onClick={() => setFilter(value)}>{value === 'all' ? text("All") : value === 'featured' ? text("Featured") : text(CATEGORY_LABELS[value])}</button>
          ))}
        </div>
        {error && <div className={styles.state} role="alert"><strong>{text("Projects could not be loaded")}</strong><p>{text(error)}</p><button type="button" className={styles.textButton} onClick={() => void load()}>{text("Try again")}</button></div>}
        {!error && loading && <div className={styles.state} role="status">{text("Loading projects…")}</div>}
        {!error && !loading && visible.length === 0 && <div className={styles.state}><strong>{text("No matching projects")}</strong><p>{projects.length ? text("Try a different search or filter.") : text("Add the first project to start the portfolio.")}</p></div>}
        {!error && !loading && visible.length > 0 && <div className={styles.grid}>{visible.map((project) => (
          <Link key={project.id} href={`/admin/cms/projects/${encodeURIComponent(project.id)}`} className={styles.projectCard}>
            <div className={styles.imageWrap}><Image unoptimized src={project.cover.src} alt="" width={640} height={400} />{project.isExample && <span className={styles.featuredBadge}>{text("Featured")}</span>}</div>
            <div className={styles.cardBody}><div className={styles.cardTop}><span>{text(CATEGORY_LABELS[project.category] ?? "Project")}</span><span>{project.year}</span></div><h3>{locale === 'en' ? project.english?.title || project.title : project.title}</h3><p>{locale === 'en' ? project.english?.shortDesc || project.shortDesc : project.shortDesc}</p><div className={styles.cardFoot}><span>{project.id}</span><ArrowUpRight size={20} aria-hidden="true" /></div></div>
          </Link>
        ))}</div>}
      </section>
    </main>
  )
}
