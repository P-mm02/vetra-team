import { useMemo } from 'react'
import styles from '../CmsShell.module.css'

export default function CmsTopbar({
  pathname,
  onOpenNav,
}: {
  pathname: string
  onOpenNav: () => void
}) {
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

  return (
    <header className={styles.topbar}>
      <button
        type="button"
        className={styles.menuBtn}
        onClick={onOpenNav}
        aria-label="Open menu"
      >
        ☰
      </button>

      <div className={styles.topbarTitle}>
        <span className={styles.topbarKicker}>Admin</span>
        <span className={styles.topbarPath}>{pathname}</span>
      </div>

      <div className={styles.topbarRight}>
        <span className={styles.timePill}>{nowLabel}</span>
      </div>
    </header>
  )
}
