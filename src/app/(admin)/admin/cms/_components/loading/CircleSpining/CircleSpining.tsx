// src/app/(admin)/admin/cms/_components/loading/CircleSpining/CircleSpining.tsx
import React from 'react'
import styles from './CircleSpining.module.css'

type Props = {
  /** Spinner size (px/rem/em). Default: 3rem */
  size?: string
  /** Optional label text */
  label?: string
  /** Hide label visually but keep for screen readers */
  hideLabel?: boolean
  /** Optional ring color (falls back to Vetra accent) */
  color?: string
  /** Optional className */
  className?: string
}

export default function CircleSpining({
  size = '10rem',
  label = 'Loading…',
  hideLabel = false,
  color,
  className = '',
}: Props) {
  return (
    <div
      className={`${styles.wrap} ${className}`}
      style={
        {
          ['--size' as any]: size,
          ...(color ? ({ ['--ring' as any]: color } as any) : null),
        } as React.CSSProperties
      }
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <span className={styles.ring} aria-hidden="true" />
      <span className={styles.glow} aria-hidden="true" />
      <span className={`${styles.text} ${hideLabel ? styles.srOnly : ''}`}>
        {label}
      </span>
    </div>
  )
}
