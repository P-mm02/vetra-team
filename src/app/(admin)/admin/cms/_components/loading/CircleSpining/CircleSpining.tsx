'use client'
import React from 'react'
import styles from './CircleSpining.module.css'
import { useCmsI18n } from '@/components/cms/CmsLanguageProvider'

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
  label,
  hideLabel = false,
  color,
  className = '',
}: Props) {
  const { t } = useCmsI18n()
  const loadingLabel = label ?? t('Loading…', 'กำลังโหลด…')
  return (
    <div
      className={`${styles.wrap} ${className}`}
      style={{ '--size': size, ...(color ? { '--ring': color } : {}) } as React.CSSProperties}
      role="status"
      aria-live="polite"
      aria-label={loadingLabel}
    >
      <span className={styles.ring} aria-hidden="true" />
      <span className={styles.glow} aria-hidden="true" />
      <span className={`${styles.text} ${hideLabel ? styles.srOnly : ''}`}>
        {loadingLabel}
      </span>
    </div>
  )
}
