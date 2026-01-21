'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import styles from './page.module.css'

type ActionState = 'idle' | 'loading'

export default function CmsHomePage() {
  const [logoutState, setLogoutState] = useState<ActionState>('idle')
  const isLoggingOut = logoutState === 'loading'

  const nowLabel = useMemo(() => {
    try {
      return new Intl.DateTimeFormat('en-GB', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date())
    } catch {
      return ''
    }
  }, [])

  async function onLogout() {
    if (isLoggingOut) return
    setLogoutState('loading')

    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } finally {
      // Always redirect to login
      window.location.href = '/admin/login'
    }
  }

  return (
    <main className={styles.wrap}>
      <section className={styles.hero} aria-label="CMS dashboard">
        <div className={styles.heroGlow} aria-hidden="true" />

        <div className={styles.heroTop}>
          <div className={styles.brand}>
            <div className={styles.brandBadge} aria-hidden="true">
              CMS
            </div>
            <div className={styles.brandTitle}>Dashboard</div>
            <div className={styles.brandSub}>
              Manage content, projects, and settings across your websites.
            </div>
          </div>

          <div className={styles.heroActions}>
            <span className={styles.timePill} aria-label="Current time">
              {nowLabel}
            </span>

            <button
              type="button"
              className={styles.logoutBtn}
              onClick={onLogout}
              disabled={isLoggingOut}
            >
              {isLoggingOut ? 'Logging out…' : 'Logout'}
            </button>
          </div>
        </div>

        <div className={styles.kpiRow}>
          <article className={styles.kpiCard}>
            <div className={styles.kpiLabel}>Status</div>
            <div className={styles.kpiValue}>Online</div>
            <div className={styles.kpiHint}>Session active</div>
          </article>

          <article className={styles.kpiCard}>
            <div className={styles.kpiLabel}>Projects</div>
            <div className={styles.kpiValue}>—</div>
            <div className={styles.kpiHint}>Connect your data model</div>
          </article>

          <article className={styles.kpiCard}>
            <div className={styles.kpiLabel}>Pages</div>
            <div className={styles.kpiValue}>—</div>
            <div className={styles.kpiHint}>Add CMS modules</div>
          </article>
        </div>
      </section>

      <section className={styles.grid} aria-label="CMS modules">
        <Link className={styles.card} href="/admin/cms/content">
          <div className={styles.cardTop}>
            <div className={styles.cardIcon} aria-hidden="true">
              ✦
            </div>
            <div className={styles.cardTitle}>Content</div>
          </div>
          <p className={styles.cardDesc}>
            Manage pages, sections, and reusable text blocks.
          </p>
          <div className={styles.cardMeta}>/admin/cms/content</div>
        </Link>

        <Link className={styles.card} href="/admin/cms/projects">
          <div className={styles.cardTop}>
            <div className={styles.cardIcon} aria-hidden="true">
              ◈
            </div>
            <div className={styles.cardTitle}>Projects</div>
          </div>
          <p className={styles.cardDesc}>
            Add and update project portfolio items with images and highlights.
          </p>
          <div className={styles.cardMeta}>/admin/cms/projects</div>
        </Link>

        <Link className={styles.card} href="/admin/cms/media">
          <div className={styles.cardTop}>
            <div className={styles.cardIcon} aria-hidden="true">
              ⬡
            </div>
            <div className={styles.cardTitle}>Media</div>
          </div>
          <p className={styles.cardDesc}>
            Upload and organize images/files for your websites.
          </p>
          <div className={styles.cardMeta}>/admin/cms/media</div>
        </Link>

        <Link className={styles.card} href="/admin/cms/users">
          <div className={styles.cardTop}>
            <div className={styles.cardIcon} aria-hidden="true">
              ⦿
            </div>
            <div className={styles.cardTitle}>Users</div>
          </div>
          <p className={styles.cardDesc}>
            Manage admin accounts, roles, and permissions.
          </p>
          <div className={styles.cardMeta}>/admin/cms/users</div>
        </Link>

        <Link className={styles.card} href="/admin/cms/settings">
          <div className={styles.cardTop}>
            <div className={styles.cardIcon} aria-hidden="true">
              ⚙
            </div>
            <div className={styles.cardTitle}>Settings</div>
          </div>
          <p className={styles.cardDesc}>
            Configure site identity, SEO, and feature toggles.
          </p>
          <div className={styles.cardMeta}>/admin/cms/settings</div>
        </Link>

        <a
          className={styles.card}
          href="/"
          target="_blank"
          rel="noreferrer"
          aria-label="Open public website"
        >
          <div className={styles.cardTop}>
            <div className={styles.cardIcon} aria-hidden="true">
              ↗
            </div>
            <div className={styles.cardTitle}>Open Site</div>
          </div>
          <p className={styles.cardDesc}>
            View the public website in a new tab.
          </p>
          <div className={styles.cardMeta}>/</div>
        </a>
      </section>

      <section className={styles.note} aria-label="CMS notes">
        <div className={styles.noteInner}>
          <div className={styles.noteTitle}>Next steps</div>
          <ul className={styles.noteList}>
            <li>
              Create the first module route: <code>/admin/cms/content</code>
            </li>
            <li>Add role checks (admin/editor/viewer) in CMS layouts</li>
            <li>Add login rate limiting + audit logs for security</li>
          </ul>
        </div>
      </section>
    </main>
  )
}
