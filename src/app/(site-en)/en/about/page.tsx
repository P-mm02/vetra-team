import type { Metadata } from 'next'
import styles from '@/app/(site)/about/page.module.css'
import AboutHero from '@/app/(site)/about/AboutHero/AboutHero'
import { pageAlternates } from '@/lib/i18n'

export const metadata: Metadata = {
  title: 'About',
  description:
    'About Wee and VETRA - premium Next.js websites, web apps, clean code, SEO, performance, and maintainable business systems.',
  alternates: pageAlternates('/about', 'en'),
  openGraph: {
    title: 'About | VETRA',
    description:
      'About Wee and VETRA - premium Next.js websites, web apps, clean code, SEO, and maintainable business systems.',
    url: '/en/about',
    type: 'website',
    locale: 'en_US',
    alternateLocale: ['th_TH'],
  },
}

export default function EnglishAboutPage() {
  return (
    <main id="main" className={styles.page}>
      <AboutHero locale="en" />
    </main>
  )
}
