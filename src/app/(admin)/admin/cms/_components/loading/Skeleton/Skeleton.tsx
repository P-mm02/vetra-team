// src/app/(admin)/admin/cms/_components/loading/Skeleton/Skeleton.tsx
import styles from './Skeleton.module.css'

type Props = {
  className?: string
  style?: React.CSSProperties
  lines?: number
}

/**
 * Skeleton loader (Vetra dark/glass).
 * - Default: 1 line (use style to control width/height)
 * - Optional: lines={n} renders n stacked bars
 */
export default function Skeleton({ className = '', style, lines = 1 }: Props) {
  if (lines > 1) {
    return (
      <div className={`${styles.stack} ${className}`} style={style}>
        {Array.from({ length: lines }).map((_, i) => (
          <span key={i} className={styles.line} />
        ))}
      </div>
    )
  }

  return <span className={`${styles.block} ${className}`} style={style} />
}
