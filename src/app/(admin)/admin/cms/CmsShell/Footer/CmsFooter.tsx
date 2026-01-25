import styles from './CmsFooter.module.css'

export default function CmsFooter() {

  return (
    <div className={styles.sideFoot}>

      <div className={styles.sideActions}>
        <a
          className={styles.ghostBtn}
          href="/"
          target="_blank"
          rel="noreferrer"
        >
          Open site ↗
        </a>

      </div>
    </div>
  )
}
