// src/app/(site)/layout.tsx
import type { ReactNode } from 'react'
import '@/styles/globals.css'

import Nav from '@/components/nav/nav'
import Footer from '@/components/footer/footer'
import { GoogleAnalytics } from '@next/third-parties/google'

export default function SiteLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID

  return (
    <html lang="en">
      <body>
        <Nav />
        {children}
        <Footer />

        {gaId ? <GoogleAnalytics gaId={gaId} /> : null}
      </body>
    </html>
  )
}
