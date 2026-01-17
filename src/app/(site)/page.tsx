// src/app/page.tsx
import styles from './page.module.css'
import AboutHero from '@/app/(site)/about/AboutHero/AboutHero'
import HomeHero from '@/app/(site)/HomeHero/HomeHero'

export default function Page() {
  return (
    <div className={styles.page}>
      <HomeHero />

      <AboutHero />
    </div>
  )
}
