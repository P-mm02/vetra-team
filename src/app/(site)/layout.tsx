// src/app/(site)/layout.tsx
import type { ReactNode } from 'react'

import Nav from '@/components/nav/nav'
import Footer from '@/components/footer/footer'

export default function SiteLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <>
      <Nav />
      {children}
      <Footer />
    </>
  )
}
