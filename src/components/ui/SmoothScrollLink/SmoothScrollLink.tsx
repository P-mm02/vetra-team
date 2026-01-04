// src/components/ui/SmoothScrollLink/SmoothScrollLink.tsx
'use client'

import Link from 'next/link'
import { type MouseEvent, type ReactNode } from 'react'

type Props = {
  href: string
  className?: string
  children: ReactNode
  onClick?: (e: MouseEvent<HTMLAnchorElement>) => void
}

export default function SmoothScrollLink({
  href,
  className,
  children,
  onClick,
}: Props) {
  return (
    <Link
      href={href}
      className={className}
      onClick={(e) => {
        // Allow parent handlers (ex: close mobile drawer)
        onClick?.(e)

        // If parent prevented default, respect it.
        if (e.defaultPrevented) return

        // Works only for hash links like "#contact"
        if (!href.startsWith('#')) return

        const id = href.slice(1)
        const el = document.getElementById(id)
        if (!el) return

        e.preventDefault()
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })

        // keep URL hash updated (nice UX)
        history.pushState(null, '', href)
      }}
    >
      {children}
    </Link>
  )
}
