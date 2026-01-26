import React from 'react'
import styles from './CircleSpining.module.css'

type Props = {
  /** Optional: specify size in px/rem/%/em. Default: 100% of container */
  size?: string
  /** Optional: color of the spinner + text */
  color?: string
  /** Optional: className for more customization */
  className?: string
}

export default function CircleSpining({
  size = '100%',
  color = '#60a5fa',
  className = '',
}: Props) {
  return (
    <div
      className={`${styles.wrapper} ${className}`}
      style={
        {
          width: size,
          height: size,
          ['--spinner-color' as any]: color,
        } as React.CSSProperties
      }
      aria-label="Loading"
    >
      <span className={styles.spinner} />
      <span className={styles.text}>Loading...</span>
    </div>
  )
}
