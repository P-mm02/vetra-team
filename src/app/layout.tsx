// src/app/layout.tsx
import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import '@/styles/globals.css'

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || 'https://vetra.asia'
).replace(/\/+$/, '')

const OG_IMAGE = '/images/preview/vetra-preview.jpg'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#070714',
  colorScheme: 'dark',
}

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'VETRA',
    template: '%s VETRA',
  },
  description:
    'สร้างเว็บไซต์ ทันสมัย ระดับพรีเมี่ยม ด้วย Next.js เว็บไซต์เพื่อธุรกิจ ดีไซน์สวยงาม ทำ SEO เต็มระบบ AI และ Google ค้นหาเจอง่าย เพิ่มยอดขายได้มาก',
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
    description:
      'สร้างเว็บไซต์ ทันสมัย ระดับพรีเมี่ยม ด้วย Next.js เว็บไซต์เพื่อธุรกิจ ดีไซน์สวยงาม ทำ SEO เต็มระบบ AI และ Google ค้นหาเจอง่าย เพิ่มยอดขายได้มาก',
    locale: 'th_TH',
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: 'Wee | Freelance',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VETRA',
    description:
      'สร้างเว็บไซต์ ทันสมัย ระดับพรีเมี่ยม ด้วย Next.js เว็บไซต์เพื่อธุรกิจ ดีไซน์สวยงาม ทำ SEO เต็มระบบ AI และ Google ค้นหาเจอง่าย เพิ่มยอดขายได้มาก',
    images: [OG_IMAGE],
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="th">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link rel="icon" href="/favicon.ico" />
      </head>

      <body>{children}</body>
    </html>
  )
}
