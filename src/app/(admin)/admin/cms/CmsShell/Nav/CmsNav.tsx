import Link from 'next/link'
import Image from 'next/image'
import { ChartNoAxesCombined, CreditCard, FolderKanban, LayoutDashboard, Trash2, UsersRound, X } from 'lucide-react'
import styles from './CmsNav.module.css'
import { CMS_NAV, isActivePath, type CmsNavItem } from './navConfig'
import { useCmsI18n } from '@/components/cms/CmsLanguageProvider'

const icons = {
  dashboard: LayoutDashboard,
  portfolio: FolderKanban,
  payments: CreditCard,
  users: UsersRound,
  trash: Trash2,
  analytics: ChartNoAxesCombined,
} satisfies Record<CmsNavItem['key'], typeof LayoutDashboard>

export default function CmsNav({
  pathname,
  role,
  onClose,
}: {
  pathname: string
  role: string
  onClose: () => void
}) {
  const { t } = useCmsI18n()
  return (
    <>
      <div className={styles.sideTop}>
        <Link className={styles.brand} href="/admin/cms" onClick={onClose}>
          <span className={styles.brandLogo} aria-hidden="true">
            <Image src="/admin/logo/vetra-logo-nobg.svg" alt="" width={42} height={42} priority />
          </span>
          <span className={styles.brandText}>
            <span className={styles.brandName}>VETRA</span>
            <span className={styles.brandTag}>{t('CONTENT STUDIO', 'ระบบจัดการเนื้อหา')}</span>
          </span>
        </Link>

        <button type="button" className={styles.closeBtn} onClick={onClose} aria-label={t('Close menu', 'ปิดเมนู')}>
          <X size={20} aria-hidden="true" />
        </button>
      </div>

      <div className={styles.sectionLabel}>{t('WORKSPACE', 'จัดการเว็บไซต์')}</div>
      <nav className={styles.nav} aria-label={t('CMS navigation', 'เมนูระบบจัดการเนื้อหา')}>
        {CMS_NAV.filter((item) => !item.roles || item.roles.includes(role)).map((item) => {
          const active = isActivePath(pathname, item.href)
          const Icon = icons[item.key]
          return (
            <Link
              key={item.key}
              className={`${styles.navItem} ${active ? styles.navItemActive : ''}`}
              href={item.href}
              onClick={onClose}
              aria-current={active ? 'page' : undefined}
            >
              <Icon className={styles.navIcon} size={19} strokeWidth={1.9} aria-hidden="true" />
              <span className={styles.navLabel}>{t(item.label, item.labelTh)}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
