// src/app/(admin)/layout.tsx
import type { Metadata, Viewport } from 'next'
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
  subsets: ['latin', 'thai'],
  weight: ['400', '600', '900'],
  display: 'swap',
  variable: '--font-prompt',
})

const fontNoto = Noto_Sans_Thai({
  subsets: ['thai'],
  weight: ['400', '600', '900'],
  display: 'swap',
  variable: '--font-noto',
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#070714',
  colorScheme: 'dark',
}

export const metadata: Metadata = {
  title: {
    default: 'VETRA | CMS',
    template: '%s • Admin • VETRA',
  },

  // ✅ Keep admin out of Google
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
      'max-snippet': 0,
      'max-image-preview': 'none',
    },
  },

  // ✅ Optional: reuse same icons as main site
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
  },
}

export default function AdminLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html
      lang="th"
      className={`${fontPlayfair.variable} ${fontPrompt.variable} ${fontNoto.variable}`}
    >
      <body>{children}</body>
    </html>
  )
}
