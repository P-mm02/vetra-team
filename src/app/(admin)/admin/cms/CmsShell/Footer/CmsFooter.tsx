import { ArrowUpRight } from 'lucide-react'
import styles from './CmsFooter.module.css'
import { useCmsI18n } from '@/components/cms/CmsLanguageProvider'

export default function CmsFooter() {
  const { t, locale } = useCmsI18n()
  return (
    <div className={styles.sideFoot}>
      <a className={styles.siteLink} href={locale === 'en' ? '/en' : '/'} target="_blank" rel="noopener noreferrer">
        <span>{t('View website', 'ดูเว็บไซต์')}</span>
        <ArrowUpRight size={18} aria-hidden="true" />
      </a>
    </div>
  )
}
