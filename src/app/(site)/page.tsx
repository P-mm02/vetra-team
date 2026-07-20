// src/app/(site)/page.tsx
import type { Metadata } from 'next'
import styles from './page.module.css'
import AboutHero from '@/app/(site)/about/AboutHero/AboutHero'
import HomeHero from '@/app/(site)/HomeHero/HomeHero'
import RecentProjects from '@/app/(site)/RecentProjects/RecentProjects'
import { pageAlternates } from '@/lib/i18n'

const OG_IMAGE = '/images/preview/vetra-preview.jpg'

export const metadata: Metadata = {
  title: 'VETRA',
  description:
    'สร้างเว็บไซต์ ทันสมัย ระดับพรีเมี่ยม ด้วย Next.js เว็บไซต์เพื่อธุรกิจ ดีไซน์สวยงาม ทำ SEO เต็มระบบ AI และ Google ค้นหาเจอง่าย เพิ่มยอดขายได้มาก',
  alternates: pageAlternates('/', 'th'),
  openGraph: {
    title: 'VETRA',
    description:
      'สร้างเว็บไซต์ ทันสมัย ระดับพรีเมี่ยม ด้วย Next.js เว็บไซต์เพื่อธุรกิจ ดีไซน์สวยงาม ทำ SEO เต็มระบบ AI และ Google ค้นหาเจอง่าย เพิ่มยอดขายได้มาก',
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: 'VETRA' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VETRA',
    description:
      'สร้างเว็บไซต์ ทันสมัย ระดับพรีเมี่ยม ด้วย Next.js เว็บไซต์เพื่อธุรกิจ ดีไซน์สวยงาม ทำ SEO เต็มระบบ AI และ Google ค้นหาเจอง่าย เพิ่มยอดขายได้มาก',
    images: [OG_IMAGE],
  },
}

export default function Page() {
  return (
    <div className={styles.page}>
      <HomeHero locale="th" />
      <RecentProjects locale="th" />
      <AboutHero locale="th" headingLevel="h2" />
    </div>
  )
}
