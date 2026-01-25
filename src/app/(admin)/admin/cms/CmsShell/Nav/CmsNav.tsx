import Link from 'next/link'
import Image from 'next/image'
import styles from './CmsNav.module.css'
import { CMS_NAV, isActivePath } from './navConfig'

export default function CmsNav({
  pathname,
  onClose,
}: {
  pathname: string
  onClose: () => void
}) {
  return (
    <>
      <div className={styles.sideTop}>
        <Link className={styles.brand} href="/admin/cms" onClick={onClose}>
          <span className={styles.brandLogo} aria-hidden="true">
            <Image
              src="/admin/logo/vetra-logo-nobg.svg"
              alt="VETRA"
              width={56}
              height={56}
              priority
            />
          </span>
          <span className={styles.brandText}>
            <span className={styles.brandName}>VETRA</span>
            <span className={styles.brandTag}>CMS</span>
          </span>
        </Link>

        <button
          type="button"
          className={styles.closeBtn}
          onClick={onClose}
          aria-label="Close menu"
        >
          ✕
        </button>
      </div>

      <nav className={styles.nav} aria-label="CMS navigation">
        {CMS_NAV.map((item) => {
          const active = isActivePath(pathname, item.href)
          return (
            <Link
              key={item.key}
              className={`${styles.navItem} ${active ? styles.navItemActive : ''}`}
              href={item.href}
              onClick={onClose}
            >
              <span className={styles.navIcon} aria-hidden="true">
                {item.icon}
              </span>
              <span className={styles.navLabel}>{item.label}</span>
              <span
                className={`${styles.dot} ${active ? styles.dotActive : ''}`}
                aria-hidden="true"
              />
            </Link>
          )
        })}
      </nav>
    </>
  )
}
