// src/app/contact/ContactsBox/ContactsBox.tsx
import Image from 'next/image'
import styles from './ContactsBox.module.css'
import type { Locale } from '@/lib/i18n'

type ContactsBoxProps = {
  lineUrl?: string
  facebookUrl?: string
  fastworkUrl?: string
  phone?: string
  className?: string
  locale?: Locale
}

export default function ContactsBox({
  lineUrl = 'https://lin.ee/hgKZAHm',
  facebookUrl = 'https://www.facebook.com/profile.php?id=61580630981781',
  fastworkUrl = 'https://fastwork.co/user/poomtawee',
  phone = '0936661370',
  className = '',
  locale = 'th',
}: ContactsBoxProps) {
  const ariaLabel = locale === 'en' ? 'Quick contact' : 'ช่องทางติดต่อด่วน'

  return (
    <div
      className={`${styles.contactBar} ${className}`.trim()}
      aria-label={ariaLabel}
    >
      <a
        className={styles.contactIcon}
        href={lineUrl}
        target="_blank"
        rel="noreferrer"
        aria-label="LINE"
        title="LINE"
      >
        <Image src="/icons/LINE.png" alt="LINE" width={96} height={96} />
      </a>

      <a
        className={styles.contactIcon}
        href={facebookUrl}
        target="_blank"
        rel="noreferrer"
        aria-label="Facebook"
        title="Facebook"
      >
        <Image
          src="/icons/Facebook.png"
          alt="Facebook"
          width={96}
          height={96}
        />
      </a>

      <a
        className={styles.contactIcon}
        href={fastworkUrl}
        target="_blank"
        rel="noreferrer"
        aria-label="Fastwork"
        title="Fastwork"
      >
        {/* Change to /icons/Fastwork.svg if that's your real file */}
        <Image
          src="/icons/Fastwork.svg"
          alt="Fastwork"
          width={96}
          height={96}
        />
      </a>

      <a
        className={styles.contactIcon}
        href={`tel:${phone}`}
        aria-label={locale === 'en' ? 'Phone' : 'โทรศัพท์'}
        title={locale === 'en' ? 'Call' : 'โทร'}
      >
        <Image
          src="/icons/Phone.png"
          alt=""
          width={96}
          height={96}
          className={styles.iconPhone}
        />
      </a>
    </div>
  )
}
