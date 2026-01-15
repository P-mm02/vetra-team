// src/app/(admin)/layout.tsx
import type { ReactNode } from 'react'

export default function AdminLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  // ✅ Keep this unprotected so /login works
  // ✅ No Nav/Footer here
  return <>{children}</>
}
