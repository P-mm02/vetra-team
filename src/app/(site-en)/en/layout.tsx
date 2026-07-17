import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import { GoogleAnalytics } from '@next/third-parties/google'

import '@/styles/globals.css'
import Nav from '@/components/nav/nav'
import Footer from '@/components/footer/footer'
import { externalSiteUrl, pageAlternates } from '@/lib/i18n'

const SITE_URL = externalSiteUrl()

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#070714',
  colorScheme: 'dark',
}

const BASE_DESC =
  'Premium Next.js websites and web applications for businesses that need modern design, strong SEO, AI-ready content, performance, and scalable custom systems.'

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
  alternates: pageAlternates('/', 'en'),
  openGraph: {
    type: 'website',
    url: '/en',
    siteName: 'VETRA',
    title: 'VETRA',
    description: BASE_DESC,
    locale: 'en_US',
    alternateLocale: ['th_TH'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VETRA',
    description: BASE_DESC,
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

export default function EnglishSiteLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID

  return (
    <html lang="en">
      <body>
        <Nav locale="en" />
        {children}
        <Footer locale="en" />
      </body>

      {gaId ? <GoogleAnalytics gaId={gaId} /> : null}
    </html>
  )
}
