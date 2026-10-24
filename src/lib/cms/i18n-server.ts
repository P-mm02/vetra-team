import 'server-only'
import { cookies } from 'next/headers'
import { CMS_LOCALE_COOKIE, cmsI18n, normalizeCmsLocale } from './i18n'

export async function getCmsI18n() {
  return cmsI18n(normalizeCmsLocale((await cookies()).get(CMS_LOCALE_COOKIE)?.value))
}
