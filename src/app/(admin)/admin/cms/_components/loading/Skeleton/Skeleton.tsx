import styles from './Skeleton.module.css'

export default function DateCtrlSkeleton() {
  return (
    <div className={styles.skeleton}>
      <div className={`${styles.bar} ${styles.full}`} />
      <div className={`${styles.bar} ${styles.full}`} />
    </div>
  )
}
