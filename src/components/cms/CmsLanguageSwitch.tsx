'use client'

import { useCmsI18n } from './CmsLanguageProvider'
import styles from './CmsLanguageSwitch.module.css'

export default function CmsLanguageSwitch() {
  const { locale, setLocale, switching } = useCmsI18n()
  return <button
    className={styles.switch}
    type="button"
    aria-label={locale === 'th' ? 'TH, เปลี่ยนเป็นภาษาอังกฤษ' : 'EN, switch to Thai'}
    aria-busy={switching}
    disabled={switching}
    onClick={() => setLocale(locale === 'th' ? 'en' : 'th')}
  >{locale.toUpperCase()}</button>
}
