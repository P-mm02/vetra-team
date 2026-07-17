export type Locale = 'th' | 'en'

export const DEFAULT_LOCALE: Locale = 'th'
export const LOCALES: Locale[] = ['th', 'en']

export type LocalizedString = {
  th: string
  en: string
}

export function isLocale(value: unknown): value is Locale {
  return value === 'th' || value === 'en'
}

function normalizePath(path: string) {
  if (!path || path === '/') return '/'
  return path.startsWith('/') ? path : `/${path}`
}

export function stripLocalePrefix(pathname: string) {
  const path = normalizePath(pathname)
  if (path === '/en') return '/'
  if (path.startsWith('/en/')) return path.slice(3) || '/'
  return path
}

export function localizedPath(locale: Locale, path = '/') {
  const normalized = normalizePath(stripLocalePrefix(path))
  if (locale === 'th') return normalized
  return normalized === '/' ? '/en' : `/en${normalized}`
}

export function switchLocalePath(pathname: string, targetLocale: Locale) {
  return localizedPath(targetLocale, stripLocalePrefix(pathname))
}

export function navItems(locale: Locale) {
  const labels =
    locale === 'en'
      ? {
          home: 'Home',
          about: 'About',
          services: 'Services',
          projects: 'Projects',
          contact: 'Contact',
        }
      : {
          home: 'หน้าแรก',
          about: 'เกี่ยวกับ',
          services: 'บริการ',
          projects: 'ผลงาน',
          contact: 'ติดต่อ',
        }

  return [
    { label: labels.home, href: localizedPath(locale, '/') },
    { label: labels.about, href: localizedPath(locale, '/about') },
    { label: labels.services, href: localizedPath(locale, '/services') },
    { label: labels.projects, href: localizedPath(locale, '/projects') },
    { label: labels.contact, href: localizedPath(locale, '/contact') },
  ]
}

export function pageAlternates(path: string, locale: Locale) {
  const cleanPath = stripLocalePrefix(path)
  return {
    canonical: localizedPath(locale, cleanPath),
    languages: {
      th: localizedPath('th', cleanPath),
      en: localizedPath('en', cleanPath),
      'x-default': localizedPath('th', cleanPath),
    },
  }
}

export function externalSiteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || 'https://vetra.asia').replace(
    /\/+$/,
    '',
  )
}
