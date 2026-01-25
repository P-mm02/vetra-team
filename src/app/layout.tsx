// src/app/layout.tsx
import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import { GoogleAnalytics } from '@next/third-parties/google'

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || 'https://vetra.asia'
).replace(/\/+$/, '')

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#070714',
  colorScheme: 'dark',
}

const BASE_DESC =
  'สร้างเว็บไซต์ ทันสมัย ระดับพรีเมี่ยม ด้วย Next.js เว็บไซต์เพื่อธุรกิจ ดีไซน์สวยงาม ทำ SEO เต็มระบบ AI และ Google ค้นหาเจอง่าย เพิ่มยอดขายได้มาก'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'VETRA',
    template: '%s | VETRA',
  },
  description: BASE_DESC,
  applicationName: 'VETRA',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    url: '/',
    siteName: 'VETRA',
    title: 'VETRA',
    description: BASE_DESC,
    locale: 'th_TH',
    // ❌ DO NOT set images here (set per page)
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VETRA',
    description: BASE_DESC,
    // ❌ DO NOT set images here (set per page)
  },
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

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID
  return (
    <html lang="th">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body>{children}</body>
      {gaId ? <GoogleAnalytics gaId={gaId} /> : null}
    </html>
  )
}
