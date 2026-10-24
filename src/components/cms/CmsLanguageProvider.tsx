'use client'

import { createContext, useContext, useEffect, useMemo, useState, useTransition, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { CMS_LOCALE_COOKIE, cmsI18n, type CmsLocale } from '@/lib/cms/i18n'

type CmsLanguageContext = ReturnType<typeof cmsI18n> & { setLocale: (locale: CmsLocale) => void; switching: boolean }
const Context = createContext<CmsLanguageContext | null>(null)

export function CmsLanguageProvider({ initialLocale, children }: { initialLocale: CmsLocale; children: ReactNode }) {
  const [locale, updateLocale] = useState(initialLocale)
  const [switching, startTransition] = useTransition()
  const router = useRouter()
  const translations = useMemo(() => cmsI18n(locale), [locale])
  const value = useMemo(() => ({
    ...translations, switching,
    setLocale(next: CmsLocale) {
      if (next === locale || switching) return
      document.cookie = `${CMS_LOCALE_COOKIE}=${next}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}`
      updateLocale(next)
      // Refresh server copy on the same URL. Existing client form state stays mounted.
      startTransition(() => router.refresh())
    },
  }), [locale, router, switching, translations])

  useEffect(() => { document.documentElement.lang = locale }, [locale])

  return <Context.Provider value={value}>{children}</Context.Provider>
}

export function useCmsI18n() {
  const context = useContext(Context)
  if (!context) throw new Error('CMS language provider is missing.')
  return context
}
