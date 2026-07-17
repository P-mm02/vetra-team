import type { Metadata } from 'next'
import styles from '@/app/(site)/page.module.css'
import AboutHero from '@/app/(site)/about/AboutHero/AboutHero'
import HomeHero from '@/app/(site)/HomeHero/HomeHero'
import { pageAlternates } from '@/lib/i18n'

const OG_IMAGE = '/images/preview/vetra-preview.jpg'

const DESC =
  'Premium Next.js websites and web applications for businesses that need polished design, SEO, performance, AI-ready content, and scalable custom systems.'

export const metadata: Metadata = {
  title: 'VETRA',
  description: DESC,
  alternates: pageAlternates('/', 'en'),
  openGraph: {
    title: 'VETRA',
    description: DESC,
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: 'VETRA' }],
    locale: 'en_US',
    alternateLocale: ['th_TH'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VETRA',
    description: DESC,
    images: [OG_IMAGE],
  },
}

export default function EnglishHomePage() {
  return (
    <div className={styles.page}>
      <HomeHero locale="en" />
      <AboutHero locale="en" />
    </div>
  )
}
