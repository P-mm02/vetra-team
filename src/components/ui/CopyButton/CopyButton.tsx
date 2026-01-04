'use client'

import { useState } from 'react'

type Props = {
  value: string
  className?: string
  idleText?: string
  copiedText?: string
}

export default function CopyButton({
  value,
  className,
  idleText = 'Copy',
  copiedText = 'Copied!',
}: Props) {
  const [label, setLabel] = useState(idleText)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value)
      setLabel(copiedText)
      window.setTimeout(() => setLabel(idleText), 1200)
    } catch {
      // fallback: still show something helpful
      setLabel('Copy failed')
      window.setTimeout(() => setLabel(idleText), 1200)
    }
  }

  return (
    <button type="button" className={className} onClick={handleCopy}>
      {label}
    </button>
  )
}
