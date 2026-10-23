'use client'

import { useRouter } from 'next/navigation'
import styles from './page.module.css'

type Row = {
  id: string
  username: string
  email: string
  role: string
  active: boolean
  created: string
  lastLogin: string
}

export default function UsersTableClient({ rows, emptyMessage }: { rows: Row[]; emptyMessage: string }) {
  const router = useRouter()

  function go(id: string) {
    router.push(`/admin/cms/users/${id}`)
  }

  return (
    <tbody>
      {rows.length === 0 ? (
        <tr>
          <td className={styles.empty} colSpan={6}>
            {emptyMessage}
          </td>
        </tr>
      ) : (
        rows.map((r) => (
          <tr
            key={r.id}
            className={styles.rowLink}
            role="link"
            tabIndex={0}
            onClick={() => go(r.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                go(r.id)
              }
            }}
            aria-label={`Open user ${r.username}`}
          >
            <td>
              <div className={styles.userLink}>
                <span className={styles.userName}>{r.username}</span>
              </div>
            </td>

            <td className={styles.mono}>{r.email}</td>

            <td>
              <span className={styles.rolePill}>{r.role}</span>
            </td>

            <td>
              <span
                className={`${styles.statusPill} ${
                  r.active ? styles.statusOn : styles.statusOff
                }`}
              >
                {r.active ? 'Active' : 'Disabled'}
              </span>
            </td>

            <td className={styles.mono}>{r.created}</td>
            <td className={styles.mono}>{r.lastLogin}</td>
          </tr>
        ))
      )}
    </tbody>
  )
}
