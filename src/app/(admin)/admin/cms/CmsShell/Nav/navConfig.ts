export type CmsNavItem = {
  key:
    | 'dashboard'
    | 'content'
    | 'projects'
    | 'items'
    | 'media'
    | 'users'
    | 'cloud'
    | 'analytics'
    | 'auditlog'
    | 'iptracking'
    | 'settings'
  label: string
  href: string
  icon: string // keep simple (emoji). later swap to svg/lucide
}

export const CMS_NAV: CmsNavItem[] = [
  { key: 'dashboard', label: 'Dashboard', href: '/admin/cms', icon: '✦' },
  { key: 'content', label: 'Content', href: '/admin/cms/content', icon: '◈' },
  { key: 'items', label: 'Items', href: '/admin/cms/items', icon: '▦' },
  { key: 'projects', label: 'Projects', href: '/admin/cms/projects', icon: '⬡', },
  { key: 'media', label: 'Media', href: '/admin/cms/media', icon: '⧉' },
  { key: 'users', label: 'Users', href: '/admin/cms/users', icon: '⦿' },
  { key: 'analytics', label: 'Analytics', href: '/admin/cms/analytics', icon: '▤', },
  { key: 'auditlog', label: 'AuditLog', href: '/admin/cms/auditlog', icon: '◎', },
  { key: 'iptracking', label: 'IP Tracking', href: '/admin/cms/iptracking', icon: '◎', },
  { key: 'cloud', label: 'Cloud Monitor', href: '/admin/cms/cloud', icon: '☁' },
  { key: 'settings', label: 'Settings', href: '/admin/cms/settings', icon: '⚙', },
]

export function isActivePath(pathname: string, href: string) {
  if (href === '/admin/cms') return pathname === '/admin/cms'
  return pathname === href || pathname.startsWith(`${href}/`)
}
