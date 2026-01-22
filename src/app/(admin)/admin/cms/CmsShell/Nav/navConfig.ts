export type CmsNavItem = {
  key:
    | 'dashboard'
    | 'content'
    | 'projects'
    | 'items'
    | 'media'
    | 'users'
    | 'settings'
    | 'cloud'
    | 'tracking'
    | 'analytics'
    | 'ga4'
    | 'gtm'
  label: string
  href: string
  icon: string // keep simple (emoji). later swap to svg/lucide
}

export const CMS_NAV: CmsNavItem[] = [
  { key: 'dashboard', label: 'Dashboard', href: '/admin/cms', icon: '✦' },
  { key: 'content', label: 'Content', href: '/admin/cms/content', icon: '◈' },
  {
    key: 'projects',
    label: 'Projects',
    href: '/admin/cms/projects',
    icon: '⬡',
  },
  { key: 'items', label: 'Items', href: '/admin/cms/items', icon: '▦' },
  { key: 'media', label: 'Media', href: '/admin/cms/media', icon: '⧉' },
  { key: 'users', label: 'Users', href: '/admin/cms/users', icon: '⦿' },
  {
    key: 'settings',
    label: 'Settings',
    href: '/admin/cms/settings',
    icon: '⚙',
  },

  // future modules you asked for
  { key: 'cloud', label: 'Cloud Monitor', href: '/admin/cms/cloud', icon: '☁' },
  {
    key: 'tracking',
    label: 'Tracking',
    href: '/admin/cms/tracking',
    icon: '◎',
  },
  {
    key: 'analytics',
    label: 'Analytics',
    href: '/admin/cms/analytics',
    icon: '▤',
  },
  { key: 'ga4', label: 'GA4', href: '/admin/cms/ga4', icon: 'G' },
  { key: 'gtm', label: 'GTM', href: '/admin/cms/gtm', icon: 'T' },
]

export function isActivePath(pathname: string, href: string) {
  if (href === '/admin/cms') return pathname === '/admin/cms'
  return pathname === href || pathname.startsWith(`${href}/`)
}
