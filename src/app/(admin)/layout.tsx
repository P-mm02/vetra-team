// src/app/(admin)/layout.tsx
import type { ReactNode } from 'react'
import './globals.css'

import { Playfair_Display, Prompt, Noto_Sans_Thai } from 'next/font/google'

const fontPlayfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['600', '900'],
  display: 'swap',
  variable: '--font-playfair',
})

const fontPrompt = Prompt({
  subsets: ['latin'],
  weight: ['400', '600', '900'],
  display: 'swap',
  variable: '--font-prompt',
})

// Thai font (optional but recommended since you use it in stacks)
const fontNoto = Noto_Sans_Thai({
  subsets: ['thai'],
  weight: ['400', '600', '900'],
  display: 'swap',
  variable: '--font-noto',
})

export default function AdminLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  // ✅ Keep this unprotected so /admin/login works
  // ✅ No Nav/Footer here
  return (
    <html
      className={`${fontPlayfair.variable} ${fontPrompt.variable} ${fontNoto.variable}`}
    >
      <body>{children}</body>
    </html>
  )
}
