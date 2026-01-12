// src/app/layout.tsx
import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import '@/styles/globals.css'

import Nav from '@/components/nav/nav'
import Footer from '@/components/footer/footer'

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || 'https://vetra-eta.vercel.app'
).replace(/\/+$/, '')

const OG_IMAGE = '/images/preview/vetra-preview.jpg' // ✅ public/images/preview/vetra-preview.jpg

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // Match your theme (bg) better than random blue
  themeColor: '#070714',
  colorScheme: 'dark',
}

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Wee | Freelance',
    template: '%s | Wee | Freelance',
  },
  description:
    'รับทำเว็บไซต์และเว็บแอปด้วย Next.js (Thai/EN). ดีไซน์ดาร์ก-ฟิวเจอร์ริสติก โหลดเร็ว SEO ดี โค้ดสะอาด ดูแลง่าย และพร้อมขยายระบบ.',
  applicationName: 'Wee | Freelance',
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
    siteName: 'Wee | Freelance',
    title: 'Wee | Freelance',
    description:
      'รับทำเว็บไซต์/เว็บแอปด้วย Next.js. โทนดาร์ก-ฟิวเจอร์ริสติก เน้น SEO + Performance พร้อมใช้งานจริง.',
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
    title: 'Wee | Freelance',
    description:
      'รับทำเว็บไซต์/เว็บแอปด้วย Next.js. โทนดาร์ก-ฟิวเจอร์ริสติก เน้น SEO + Performance.',
    images: [OG_IMAGE],
  },

  // (optional but nice) keep icons inside metadata too
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
        {/* Helps your CSS @import Google Fonts load faster */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />

        {/* Basic icon */}
        <link rel="icon" href="/favicon.ico" />
      </head>

      <body>
        <Nav />
        {children}
        <Footer />
      </body>
    </html>
  )
}
