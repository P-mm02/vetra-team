'use client'

import styles from './DotsLoader.module.css'
import { useCmsI18n } from '@/components/cms/CmsLanguageProvider'

export default function DotsLoader() {
  const { t } = useCmsI18n()
  return (
    <div className={styles.con} role="status" aria-label={t('Loading', 'กำลังโหลด')}>

      <div className={styles.text} aria-hidden="true">
        <span>{t('Loading', 'กำลังโหลด')}</span>
      </div>

      <div className={styles.dots} aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
    </div>
  )
}
