export type CmsNavItem = {
  key: 'dashboard' | 'portfolio' | 'payments' | 'users' | 'trash' | 'analytics'
  label: string
  href: string
  roles?: readonly string[]
}

export const CMS_NAV: CmsNavItem[] = [
  { key: 'dashboard', label: 'Dashboard', href: '/admin/cms' },
  { key: 'portfolio', label: 'Portfolio', href: '/admin/cms/projects' },
  { key: 'payments', label: 'Payments', href: '/admin/cms/payments', roles: ['admin', 'dev'] },
  { key: 'users', label: 'Users', href: '/admin/cms/users', roles: ['admin', 'dev'] },
  { key: 'trash', label: 'Trash', href: '/admin/cms/trash', roles: ['editor', 'admin', 'dev'] },
  { key: 'analytics', label: 'Analytics', href: '/admin/cms/analytics', roles: ['admin', 'dev'] },
]

export function isActivePath(pathname: string, href: string) {
  if (href === '/admin/cms') return pathname === href
  return pathname === href || pathname.startsWith(`${href}/`)
}
