'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, FolderKanban, RefreshCw, RotateCcw, Sparkles, Trash2, UsersRound } from 'lucide-react'
import styles from './trash.module.css'

type TrashItem = {
  id: string
  kind: 'project' | 'user'
  title: string
  deletedAt: string
  purgeAt: string
  version: number
}

type TrashResponse = { items: TrashItem[]; canRestore: boolean }
type Filter = 'all' | 'project' | 'user'

function dateLabel(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Unknown date' : new Intl.DateTimeFormat('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Bangkok',
  }).format(date)
}

async function errorMessage(response: Response, fallback: string) {
  const body = await response.json().catch(() => null) as { error?: string; message?: string } | null
  return body?.error || body?.message || fallback
}

export default function TrashClient({ role }: { role: string }) {
  const [items, setItems] = useState<TrashItem[]>([])
  const [canRestore, setCanRestore] = useState(false)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [filter, setFilter] = useState<Filter>('all')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [cleanupBusy, setCleanupBusy] = useState(false)
  const [notice, setNotice] = useState<{ text: string; error: boolean } | null>(null)
  const canManageUsers = role === 'admin' || role === 'dev'
  const canEditPortfolio = canManageUsers || role === 'editor'

  const load = useCallback(async (signal?: AbortSignal) => {
    setStatus('loading')
    try {
      const response = await fetch('/api/admin/trash', { cache: 'no-store', signal })
      if (!response.ok) throw new Error(await errorMessage(response, 'Could not load Trash.'))
      const data = await response.json() as TrashResponse
      if (signal?.aborted) return
      setItems(Array.isArray(data.items) ? data.items : [])
      setCanRestore(Boolean(data.canRestore))
      setStatus('ready')
    } catch (error) {
      if (signal?.aborted) return
      setNotice({ text: error instanceof Error ? error.message : 'Could not load Trash.', error: true })
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    void load(controller.signal)
    return () => controller.abort()
  }, [load])

  const visibleItems = useMemo(() => items.filter(item => filter === 'all' || item.kind === filter), [items, filter])
  const projectCount = items.filter(item => item.kind === 'project').length
  const userCount = items.filter(item => item.kind === 'user').length

  async function restore(item: TrashItem) {
    if (busyId || !canRestore) return
    setBusyId(`${item.kind}:${item.id}`)
    setNotice(null)
    try {
      const response = await fetch('/api/admin/trash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: item.kind, id: item.id, version: item.version, action: 'restore' }),
      })
      if (!response.ok) throw new Error(await errorMessage(response, 'Could not restore this item.'))
      setNotice({ text: `Restored ${item.title}.`, error: false })
      await load()
    } catch (error) {
      setNotice({ text: error instanceof Error ? error.message : 'Could not restore this item.', error: true })
      await load()
    } finally {
      setBusyId(null)
    }
  }

  async function cleanup() {
    if (cleanupBusy) return
    setCleanupBusy(true)
    setNotice(null)
    try {
      const response = await fetch('/api/admin/media/cleanup', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}',
      })
      if (!response.ok) throw new Error(await errorMessage(response, 'Media cleanup failed.'))
      const result = await response.json() as { deleted: number; failed: number }
      setNotice({ text: `Cleanup finished: ${result.deleted} unused ${result.deleted === 1 ? 'upload' : 'uploads'} removed${result.failed ? `, ${result.failed} could not be removed` : ''}.`, error: result.failed > 0 })
    } catch (error) {
      setNotice({ text: error instanceof Error ? error.message : 'Media cleanup failed.', error: true })
    } finally {
      setCleanupBusy(false)
    }
  }

  return (
    <main className={styles.page}>
      <Link href="/admin/cms" className={styles.back}><ArrowLeft size={17} aria-hidden="true" /> Dashboard</Link>
      <header className={styles.header}>
        <div>
          <span className={styles.eyebrow}>CONTENT RECOVERY</span>
          <h1>Trash</h1>
          <p>Deleted projects and accounts can be restored for 30 days. After that, they are removed automatically.</p>
        </div>
        <button type="button" className={styles.refresh} onClick={() => void load()} disabled={status === 'loading'}>
          <RefreshCw size={18} aria-hidden="true" /> Refresh
        </button>
      </header>

      <div className={styles.summary}>
        <div className={styles.summaryIcon}><Trash2 size={21} aria-hidden="true" /></div>
        <div><strong>{status === 'ready' ? items.length : '—'} items in Trash</strong><span>Items stay recoverable until their expiry date.</span></div>
      </div>

      {notice && <p className={`${styles.notice} ${notice.error ? styles.noticeError : ''}`} role="status">{notice.text}</p>}

      <section className={styles.panel} aria-label="Deleted items">
        <div className={styles.panelHead}>
          <h2>Deleted items</h2>
          {status === 'ready' && <div className={styles.filters} role="group" aria-label="Filter Trash">
            <button type="button" aria-pressed={filter === 'all'} className={filter === 'all' ? styles.filterActive : ''} onClick={() => setFilter('all')}>All <span>{items.length}</span></button>
            <button type="button" aria-pressed={filter === 'project'} className={filter === 'project' ? styles.filterActive : ''} onClick={() => setFilter('project')}>Projects <span>{projectCount}</span></button>
            <button type="button" aria-pressed={filter === 'user'} className={filter === 'user' ? styles.filterActive : ''} onClick={() => setFilter('user')}>Users <span>{userCount}</span></button>
          </div>}
        </div>

        {status === 'loading' && <div className={styles.state} role="status">Loading Trash…</div>}
        {status === 'error' && <div className={styles.state} role="alert">Trash could not be loaded. Use Refresh to try again.</div>}
        {status === 'ready' && visibleItems.length === 0 && <div className={styles.empty}>
          <span className={styles.emptyIcon}><Trash2 size={28} aria-hidden="true" /></span>
          <h3>{filter === 'all' ? 'Trash is empty' : `No deleted ${filter === 'project' ? 'projects' : 'users'}`}</h3>
          <p>Deleted items will appear here during their 30-day recovery period.</p>
        </div>}
        {status === 'ready' && visibleItems.length > 0 && <ul className={styles.list}>
          {visibleItems.map(item => {
            const restoring = busyId === `${item.kind}:${item.id}`
            const allowed = canRestore && (item.kind === 'project' ? canEditPortfolio : canManageUsers)
            return <li key={`${item.kind}:${item.id}`} className={styles.item}>
              <span className={`${styles.itemIcon} ${item.kind === 'project' ? styles.projectIcon : styles.userIcon}`}>
                {item.kind === 'project' ? <FolderKanban size={20} aria-hidden="true" /> : <UsersRound size={20} aria-hidden="true" />}
              </span>
              <span className={styles.itemBody}><strong>{item.title}</strong><span>{item.kind === 'project' ? 'Portfolio project' : 'User account'} · Deleted {dateLabel(item.deletedAt)}</span></span>
              <span className={styles.expiry}>Expires {dateLabel(item.purgeAt)}</span>
              {allowed && <button type="button" className={styles.restore} disabled={Boolean(busyId)} onClick={() => void restore(item)}>
                <RotateCcw size={17} aria-hidden="true" /> {restoring ? 'Restoring…' : 'Restore'}
              </button>}
            </li>
          })}
        </ul>}
      </section>

      {canManageUsers && <section className={styles.cleanup} aria-labelledby="cleanup-title">
        <div className={styles.cleanupIcon}><Sparkles size={23} aria-hidden="true" /></div>
        <div className={styles.cleanupCopy}><h2 id="cleanup-title">Unused upload cleanup</h2><p>Remove leftover uploads that are confirmed unreferenced. Media used by published or recoverable items is protected.</p></div>
        <button type="button" className={styles.cleanupButton} disabled={cleanupBusy} onClick={() => void cleanup()}>{cleanupBusy ? 'Cleaning up…' : 'Run cleanup'}</button>
      </section>}
    </main>
  )
}
