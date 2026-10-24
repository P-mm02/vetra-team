export type CmsLocale = 'th' | 'en'

export const CMS_LOCALE_COOKIE = 'vetra-cms-locale'
export function normalizeCmsLocale(value: unknown): CmsLocale {
  return value === 'en' ? 'en' : 'th'
}

/** Keep the English and Thai interface copy together at its point of use. */
export function cmsI18n(locale: CmsLocale) {
  const intlLocale = locale === 'th' ? 'th-TH' : 'en-GB'
  const t = (english: string, thai: string) => locale === 'th' ? thai : english
  const formatDate = (value: string | number | Date | null | undefined, options?: Intl.DateTimeFormatOptions) => {
    if (value === null || value === undefined || value === '') return '—'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return '—'
    const defaults: Intl.DateTimeFormatOptions = options?.dateStyle || options?.timeStyle
      ? {} : { day: 'numeric', month: 'short', year: 'numeric' }
    return new Intl.DateTimeFormat(intlLocale, { ...defaults, timeZone: 'Asia/Bangkok', ...options }).format(date)
  }
  const formatNumber = (value: number, options?: Intl.NumberFormatOptions) => new Intl.NumberFormat(intlLocale, options).format(value)
  return { locale, intlLocale, t, formatDate, formatNumber }
}

export function cmsRoleLabel(role: string, locale: CmsLocale) {
  const roles: Record<string, [string, string]> = {
    dev: ['Developer', 'นักพัฒนา'], admin: ['Administrator', 'ผู้ดูแลระบบ'],
    editor: ['Editor', 'ผู้แก้ไขเนื้อหา'], viewer: ['Viewer', 'ผู้ดูข้อมูล'],
  }
  const label = roles[role]
  return label ? cmsI18n(locale).t(...label) : role
}
