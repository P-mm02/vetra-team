// src/app/(admin)/admin/cms/users/Loading.tsx
import styles from './page.module.css'

import Skeleton from '@/app/(admin)/admin/cms/_components/loading/Skeleton/Skeleton'
import CircleSpining from '@/app/(admin)/admin/cms/_components/loading/CircleSpining/CircleSpining'

export default function Loading() {
  return (
    <main className={styles.page} aria-label="Loading users">
      <header className={styles.header}>
        <div className={styles.headerText}>
          <h1 className={styles.h1}>Users</h1>
          <p className={styles.sub}>
            <Skeleton style={{ width: '26rem', height: '1em' }} />
          </p>
        </div>

        <div className={styles.headerActions}>
          <span
            style={{
              display: 'inline-flex',
              borderRadius: 999,
              overflow: 'hidden',
            }}
          >
            <Skeleton style={{ width: '8.8rem', height: '2.4rem' }} />
          </span>
        </div>
      </header>

      <section className={styles.panel} aria-label="User list loading">
        <div className={styles.tableWrap} aria-hidden="true">
          <table className={styles.table}>
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Created</th>
                <th>Last login</th>
              </tr>
            </thead>

            <tbody>
              {Array.from({ length: 10 }).map((_, i) => (
                <tr key={i}>
                  <td>
                    <Skeleton
                      style={{ width: i % 3 === 0 ? '9.5rem' : '7.8rem' }}
                    />
                  </td>
                  <td>
                    <Skeleton style={{ width: '15rem' }} />
                  </td>
                  <td>
                    <Skeleton style={{ width: '6rem' }} />
                  </td>
                  <td>
                    <Skeleton style={{ width: '6.5rem' }} />
                  </td>
                  <td>
                    <Skeleton style={{ width: '8.5rem' }} />
                  </td>
                  <td>
                    <Skeleton style={{ width: '8.5rem' }} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <footer className={styles.foot}>
          <span className={styles.footDot} aria-hidden="true" />
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              minWidth: 0,
            }}
          >
            <Skeleton style={{ width: '12rem', height: '1em' }} />
          </span>

          <span style={{ marginLeft: 'auto', display: 'inline-flex' }}>
            <CircleSpining size="2.6rem" hideLabel label="Loading users…" />
          </span>
        </footer>
      </section>
    </main>
  )
}
