'use client'

import { useCmsI18n } from './CmsLanguageProvider'
import styles from './CmsLanguageSwitch.module.css'

export default function CmsLanguageSwitch() {
  const { locale, setLocale, switching, t } = useCmsI18n()
  return <div className={styles.switch} role="group" aria-label={t('Interface language', 'ภาษาของระบบ')} aria-busy={switching}>
    {(['th', 'en'] as const).map(language => <button
      key={language} type="button" lang={language} aria-pressed={locale === language}
      aria-label={language === 'th' ? 'ภาษาไทย' : 'English'} disabled={switching}
      onClick={() => setLocale(language)}
    >{language.toUpperCase()}</button>)}
  </div>
}
