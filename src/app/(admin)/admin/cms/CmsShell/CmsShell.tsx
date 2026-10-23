'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import type { CurrentUser } from '@/lib/auth/session'
import styles from './CmsShell.module.css'
import CmsNav from './Nav/CmsNav'
import CmsTopbar from './Topbar/CmsTopbar'
import CmsFooter from './Footer/CmsFooter'

const focusableSelector = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

export default function CmsShell({ user, children }: {
  user: CurrentUser
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [navOpen, setNavOpen] = useState(false)
  const drawerRef = useRef<HTMLElement>(null)
  const mainRef = useRef<HTMLDivElement>(null)
  const menuButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!navOpen) return

    const drawer = drawerRef.current
    const main = mainRef.current
    if (!drawer) return

    const previousFocus = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : menuButtonRef.current
    const menuButton = menuButtonRef.current
    const previousOverflow = document.body.style.overflow
    const previousRootOverflow = document.documentElement.style.overflow
    const previousInert = main?.inert ?? false
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'
    if (main) main.inert = true

    function getFocusable() {
      return Array.from(drawer!.querySelectorAll<HTMLElement>(focusableSelector))
        .filter((element) => !element.hasAttribute('disabled'))
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        setNavOpen(false)
        return
      }
      if (event.key !== 'Tab') return

      const focusable = getFocusable()
      const first = focusable[0]
      const last = focusable.at(-1)
      if (!first || !last) {
        event.preventDefault()
        return
      }
      if (!drawer!.contains(document.activeElement)) {
        event.preventDefault()
        first.focus()
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    drawer.querySelector<HTMLElement>('button')?.focus()

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
      document.documentElement.style.overflow = previousRootOverflow
      if (main) main.inert = previousInert
      if (previousFocus?.isConnected) previousFocus.focus()
      else menuButton?.focus()
    }
  }, [navOpen])

  useEffect(() => {
    setNavOpen(false)
  }, [pathname])

  return (
    <div className={styles.shell}>
      <aside
        id="cms-navigation-drawer"
        ref={drawerRef}
        className={`${styles.sidebar} ${navOpen ? styles.sidebarOpen : ''}`}
        role="dialog"
        aria-modal={navOpen ? true : undefined}
        aria-label="Workspace menu"
        aria-hidden={!navOpen}
      >
        <CmsNav pathname={pathname} role={user.role} onClose={() => setNavOpen(false)} />
        <CmsFooter />
      </aside>

      <button
        type="button"
        className={`${styles.backdrop} ${navOpen ? styles.backdropShow : ''}`}
        onClick={() => setNavOpen(false)}
        tabIndex={-1}
        aria-label="Close menu"
        aria-hidden="true"
      />

      <div ref={mainRef} className={styles.main}>
        <CmsTopbar
          menuButtonRef={menuButtonRef}
          navOpen={navOpen}
          onOpenNav={() => setNavOpen(true)}
          user={user}
        />
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  )
}
