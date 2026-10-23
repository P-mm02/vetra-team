'use client'

import Link from 'next/link'
import styles from '@/app/(site)/error.module.css'

export default function EnglishSiteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className={styles.page}>
      <section className={styles.card} role="alert" aria-labelledby="site-error-title">
        <span className={styles.eyebrow}>VETRA · Site update</span>
        <h1 id="site-error-title">We can’t load the projects right now</h1>
        <p>There’s a temporary problem. Please try again shortly. You can still reach us through the contact page.</p>
        <div className={styles.actions}>
          <button type="button" className={styles.primaryButton} onClick={reset}>Try again</button>
          <Link className={styles.secondaryButton} href="/en/contact">Contact us</Link>
        </div>
      </section>
    </main>
  )
}
