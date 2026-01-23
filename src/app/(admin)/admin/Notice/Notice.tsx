// src/app/(admin)/admin/Notice/Notice.tsx
'use client'

import { useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import styles from './Notice.module.css'

export type NoticeTone = 'info' | 'success' | 'warning' | 'danger'

type Props = {
  tone?: NoticeTone
  title?: string
  message: string
  code?: number | string
  className?: string
  dismissible?: boolean
  /** which query key should be removed when close (default: "err") */
  clearQueryKey?: string
}

export default function Notice({
  tone = 'info',
  title,
  message,
  code,
  className = '',
  dismissible = true,
  clearQueryKey = 'err',
}: Props) {
  const [open, setOpen] = useState(true)
  const router = useRouter()
  const pathname = usePathname()
  const sp = useSearchParams()

  if (!open) return null

  function onClose() {
    setOpen(false)

    // remove query key from URL (so it doesn't come back)
    const next = new URLSearchParams(sp.toString())
    next.delete(clearQueryKey)

    const qs = next.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname)
  }

  return (
    <div
      className={`${styles.notice} ${styles[tone]} ${className}`}
      role={tone === 'danger' ? 'alert' : 'status'}
      aria-live="polite"
    >
      <span className={styles.dot} aria-hidden="true" />

      <div className={styles.body}>
        <div className={styles.top}>
          <div className={styles.leftTop}>
            {title ? <div className={styles.title}>{title}</div> : null}
            {code !== undefined ? (
              <div className={styles.code}>Code: {String(code)}</div>
            ) : null}
          </div>

          {dismissible ? (
            <button
              type="button"
              className={styles.close}
              onClick={onClose}
              aria-label="Close notice"
              title="Close"
            >
              ×
            </button>
          ) : null}
        </div>

        <div className={styles.msg}>{message}</div>
      </div>
    </div>
  )
}
