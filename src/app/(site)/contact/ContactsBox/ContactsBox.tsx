// src/app/contact/ContactsBox/ContactsBox.tsx
import Image from 'next/image'
import styles from './ContactsBox.module.css'

type ContactsBoxProps = {
  title?: string
  lineUrl?: string
  facebookUrl?: string
  fastworkUrl?: string
  phone?: string
  className?: string
}

export default function ContactsBox({
  title = 'Quick contact',
  lineUrl = 'https://lin.ee/hgKZAHm',
  facebookUrl = 'https://www.facebook.com/profile.php?id=61580630981781',
  fastworkUrl = 'https://fastwork.co/user/poomtawee',
  phone = '0936661370',
  className = '',
}: ContactsBoxProps) {
  return (
    <div className={styles.contactBar} aria-label="Quick contact">
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
        aria-label="Phone"
        title="Call"
      >
        <Image
          src="/icons/Phone.png"
          alt="Phone"
          width={96}
          height={96}
          className={styles.iconPhone}
        />
      </a>
    </div>
  )
}
