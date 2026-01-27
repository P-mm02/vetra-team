// src/app/(admin)/admin/cms/users/[id]/loading.tsx
import Link from 'next/link'
import styles from './page.module.css'

import Skeleton from '@/app/(admin)/admin/cms/_components/loading/Skeleton/Skeleton'
import CircleSpining from '@/app/(admin)/admin/cms/_components/loading/CircleSpining/CircleSpining'

export default function Loading() {
  return (
    <main className={styles.page} aria-label="Loading user">
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <Link
            className={styles.back}
            href="/admin/cms/users"
            aria-disabled="true"
          >
            {'<'} Back to Users
          </Link>

          <h1 className={styles.h1}>
            Edit:{' '}
            <span style={{ display: 'inline-block', verticalAlign: 'middle' }}>
              <Skeleton style={{ width: '14rem', height: '1.1em' }} />
            </span>
          </h1>

          <p className={styles.sub}>
            <Skeleton style={{ width: '18rem', height: '1em' }} /> •{' '}
            <span className={styles.rolePill}>
              <Skeleton style={{ width: '4.5rem', height: '1em' }} />
            </span>{' '}
            <span className={styles.statusPill}>
              <Skeleton style={{ width: '6.5rem', height: '1em' }} />
            </span>
          </p>
        </div>

        <div className={styles.headerRight}>
          <button className={styles.ghostBtn} type="button" disabled>
            Reset password (soon)
          </button>
        </div>
      </header>

      {/* Meta grid */}
      <section className={styles.grid} aria-label="User meta loading">
        <article className={styles.card}>
          <div className={styles.k}>User ID</div>
          <div className={styles.vMono}>
            <Skeleton style={{ width: '100%', height: '1.15rem' }} />
          </div>
        </article>

        <article className={styles.card}>
          <div className={styles.k}>Created</div>
          <div className={styles.v}>
            <Skeleton style={{ width: '70%', height: '1.15rem' }} />
          </div>
        </article>

        <article className={styles.card}>
          <div className={styles.k}>Updated</div>
          <div className={styles.v}>
            <Skeleton style={{ width: '70%', height: '1.15rem' }} />
          </div>
        </article>

        <article className={styles.card}>
          <div className={styles.k}>Last login</div>
          <div className={styles.v}>
            <Skeleton style={{ width: '70%', height: '1.15rem' }} />
          </div>
        </article>
      </section>

      {/* Edit form panel */}
      <section className={styles.panel} aria-label="Edit form loading">
        {/* Notice placeholder */}
        <div
          style={{ display: 'grid', gap: '0.6rem', marginBottom: '0.85rem' }}
        >
          <Skeleton style={{ width: '100%', height: '3.2rem' }} />
        </div>

        {/* Form blocks (approx layout) */}
        <div style={{ display: 'grid', gap: '0.85rem' }} aria-hidden="true">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
              gap: '0.85rem',
            }}
          >
            <div>
              <Skeleton style={{ width: '8rem', height: '0.95rem' }} />
              <div style={{ height: '0.4rem' }} />
              <Skeleton style={{ width: '100%', height: '2.55rem' }} />
              <div style={{ height: '0.4rem' }} />
              <Skeleton style={{ width: '70%', height: '0.9rem' }} />
            </div>

            <div>
              <Skeleton style={{ width: '6rem', height: '0.95rem' }} />
              <div style={{ height: '0.4rem' }} />
              <Skeleton style={{ width: '100%', height: '2.55rem' }} />
              <div style={{ height: '0.4rem' }} />
              <Skeleton style={{ width: '66%', height: '0.9rem' }} />
            </div>

            <div>
              <Skeleton style={{ width: '5rem', height: '0.95rem' }} />
              <div style={{ height: '0.4rem' }} />
              <Skeleton style={{ width: '100%', height: '2.55rem' }} />
              <div style={{ height: '0.4rem' }} />
              <Skeleton style={{ width: '60%', height: '0.9rem' }} />
            </div>

            <div>
              <Skeleton style={{ width: '6rem', height: '0.95rem' }} />
              <div style={{ height: '0.4rem' }} />
              <Skeleton style={{ width: '100%', height: '2.55rem' }} />
              <div style={{ height: '0.4rem' }} />
              <Skeleton style={{ width: '78%', height: '0.9rem' }} />
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '0.8rem',
              marginTop: '0.4rem',
            }}
          >
            <Skeleton style={{ width: '8rem', height: '2.6rem' }} />
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.6rem',
              }}
            >
              <CircleSpining size="2.2rem" hideLabel label="Loading…" />
              <Skeleton style={{ width: '10rem', height: '2.6rem' }} />
            </span>
          </div>
        </div>
      </section>

      {/* Change password panel */}
      <section className={styles.panel} aria-label="Change password loading">
        <div
          style={{ display: 'grid', gap: '0.6rem', marginBottom: '0.85rem' }}
        >
          <Skeleton style={{ width: '100%', height: '3.2rem' }} />
        </div>

        <div style={{ display: 'grid', gap: '0.85rem' }} aria-hidden="true">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
              gap: '0.85rem',
            }}
          >
            <div>
              <Skeleton style={{ width: '10rem', height: '0.95rem' }} />
              <div style={{ height: '0.4rem' }} />
              <Skeleton style={{ width: '100%', height: '2.55rem' }} />
            </div>
            <div>
              <Skeleton style={{ width: '12rem', height: '0.95rem' }} />
              <div style={{ height: '0.4rem' }} />
              <Skeleton style={{ width: '100%', height: '2.55rem' }} />
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              gap: '0.75rem',
            }}
          >
            <Skeleton style={{ width: '6.5rem', height: '2.6rem' }} />
            <Skeleton style={{ width: '10rem', height: '2.6rem' }} />
          </div>
        </div>
      </section>

      {/* Danger zone */}
      <section aria-label="Danger zone loading">
        <div style={{ borderRadius: 26, padding: '1rem 1.05rem' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: '0.9rem',
            }}
          >
            <div style={{ minWidth: 0, flex: 1 }}>
              <Skeleton style={{ width: '10rem', height: '1.2rem' }} />
              <div style={{ height: '0.5rem' }} />
              <Skeleton style={{ width: '26rem', height: '0.95rem' }} />
            </div>
            <Skeleton style={{ width: '9rem', height: '2.6rem' }} />
          </div>
          <div style={{ height: '0.9rem' }} />
          <Skeleton style={{ width: '18rem', height: '0.95rem' }} />
        </div>
      </section>
    </main>
  )
}
