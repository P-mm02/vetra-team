'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowUpRight, Plus, Search, Trash2 } from 'lucide-react'
import { CATEGORY_LABELS, responseMessage, type PortfolioRecord, type ProjectCategory } from './_components/types'
import styles from './projects.module.css'

type ProjectListResponse = { projects: PortfolioRecord[]; canEdit: boolean; mediaConfigured: boolean }
type Filter = 'all' | 'featured' | ProjectCategory

export default function ProjectsPage() {
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
        return [project.title, project.english?.title, project.shortDesc, project.id, project.year]
          .join(' ').toLocaleLowerCase().includes(needle)
      })
      .sort((a, b) => a.sortOrder - b.sortOrder || b.year - a.year || a.title.localeCompare(b.title))
  }, [projects, query, filter])

  return (
    <main className={styles.page}>
      <div className={styles.eyebrow}>Portfolio / Content</div>
      <header className={styles.header}>
        <div><h1 className={styles.title}>Projects</h1><p className={styles.intro}>Keep the Thai and English portfolio, images, and featured order in one place.</p></div>
        <div className={styles.headerActions}>
          <Link className={styles.textButton} href="/admin/cms/trash"><Trash2 size={18} aria-hidden="true" />Trash</Link>
          {canEdit && <Link className={styles.primaryButton} href="/admin/cms/projects/new"><Plus size={18} aria-hidden="true" />Add project</Link>}
        </div>
      </header>
      {!mediaConfigured && !loading && <p className={styles.notice}>Media storage is not configured. New images cannot be uploaded.</p>}
      {!canEdit && !loading && <p className={styles.notice}>You have read-only access to this portfolio.</p>}
      <section className={styles.metrics} aria-label="Portfolio overview">
        <div className={styles.metric}><span>Total projects</span><strong>{loading ? '—' : projects.length}</strong></div>
        <div className={styles.metric}><span>Featured</span><strong>{loading ? '—' : projects.filter((project) => project.isExample).length}</strong></div>
        <div className={styles.metric}><span>With details</span><strong>{loading ? '—' : projects.filter((project) => project.hasDetail).length}</strong></div>
      </section>
      <section className={styles.collection} aria-label="Project list">
        <div className={styles.toolbar}>
          <div><h2>Portfolio library</h2><p>{loading ? 'Loading…' : `${visible.length} of ${projects.length} projects`}</p></div>
          <label className={styles.search}><span className={styles.srOnly}>Search projects</span><Search size={20} aria-hidden="true" /><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search title, ID, or year" /></label>
        </div>
        <div className={styles.filters} role="group" aria-label="Filter projects">
          {(['all', 'featured', 'business', 'commerce', 'webapp', 'internal'] as Filter[]).map((value) => (
            <button key={value} type="button" className={`${styles.filterButton} ${filter === value ? styles.filterActive : ''}`} aria-pressed={filter === value} onClick={() => setFilter(value)}>{value === 'all' ? 'All' : value === 'featured' ? 'Featured' : CATEGORY_LABELS[value]}</button>
          ))}
        </div>
        {error && <div className={styles.state} role="alert"><strong>Projects could not be loaded</strong><p>{error}</p><button type="button" className={styles.textButton} onClick={() => void load()}>Try again</button></div>}
        {!error && loading && <div className={styles.state} role="status">Loading projects…</div>}
        {!error && !loading && visible.length === 0 && <div className={styles.state}><strong>No matching projects</strong><p>{projects.length ? 'Try a different search or filter.' : 'Add the first project to start the portfolio.'}</p></div>}
        {!error && !loading && visible.length > 0 && <div className={styles.grid}>{visible.map((project) => (
          <Link key={project.id} href={`/admin/cms/projects/${encodeURIComponent(project.id)}`} className={styles.projectCard}>
            <div className={styles.imageWrap}><Image unoptimized src={project.cover.src} alt="" width={640} height={400} />{project.isExample && <span className={styles.featuredBadge}>Featured</span>}</div>
            <div className={styles.cardBody}><div className={styles.cardTop}><span>{CATEGORY_LABELS[project.category] ?? 'Project'}</span><span>{project.year}</span></div><h3>{project.title}</h3><p>{project.shortDesc}</p><div className={styles.cardFoot}><span>{project.id}</span><ArrowUpRight size={20} aria-hidden="true" /></div></div>
          </Link>
        ))}</div>}
      </section>
    </main>
  )
}
