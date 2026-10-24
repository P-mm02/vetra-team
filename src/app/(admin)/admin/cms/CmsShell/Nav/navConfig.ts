export type CmsNavItem = {
  key: 'dashboard' | 'portfolio' | 'payments' | 'users' | 'trash' | 'analytics'
  label: string
  labelTh: string
  href: string
  roles?: readonly string[]
}

export const CMS_NAV: CmsNavItem[] = [
  { key: 'dashboard', label: 'Dashboard', labelTh: 'ภาพรวม', href: '/admin/cms' },
  { key: 'portfolio', label: 'Portfolio', labelTh: 'ผลงาน', href: '/admin/cms/projects' },
  { key: 'payments', label: 'Payments', labelTh: 'การชำระเงิน', href: '/admin/cms/payments', roles: ['admin', 'dev'] },
  { key: 'users', label: 'Users', labelTh: 'ผู้ใช้งาน', href: '/admin/cms/users', roles: ['admin', 'dev'] },
  { key: 'trash', label: 'Trash', labelTh: 'ถังขยะ', href: '/admin/cms/trash', roles: ['editor', 'admin', 'dev'] },
  { key: 'analytics', label: 'Analytics', labelTh: 'สถิติการเข้าชม', href: '/admin/cms/analytics', roles: ['admin', 'dev'] },
]

export function isActivePath(pathname: string, href: string) {
  if (href === '/admin/cms') return pathname === href
  return pathname === href || pathname.startsWith(`${href}/`)
}
