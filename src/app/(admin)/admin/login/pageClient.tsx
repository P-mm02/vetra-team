// src/app/(admin)/admin/login/pageClient.tsx
'use client'

import { useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import styles from './page.module.css'

type LoginState = 'idle' | 'loading'

function safeNextPath(raw: string | null) {
  if (!raw) return '/admin/cms'
  if (!raw.startsWith('/')) return '/admin/cms'
  if (raw.startsWith('//')) return '/admin/cms'
  return raw
}


export default function PageClient() {
  const sp = useSearchParams()

  const nextRaw = sp.get('next')
  const nextPath = useMemo(() => safeNextPath(nextRaw), [nextRaw])

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)

  const [state, setState] = useState<LoginState>('idle')
  const [error, setError] = useState<string | null>(null)

  const isLoading = state === 'loading'

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (isLoading) return

    setState('loading')
    setError(null)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          password,
        }),
      })

      const data = await res.json().catch(() => null)

      if (!res.ok || !data?.ok) {
        setError('Username or password is incorrect.')
        setState('idle')
        return
      }

      window.location.href = nextPath
    } catch {
      setError('Network error. Please try again.')
      setState('idle')
    }
  }

  return (
    <main className={styles.wrap}>
      <section className={styles.card} aria-label="CMS login">
        <div className={styles.topGlow} aria-hidden="true" />

        <header className={styles.head}>
          <div className={styles.brandRow}>
            <div className={styles.brandLogo} aria-hidden="true">
              <Image
                src="/admin/logo/vetra-logo-nobg.svg"
                alt="VETRA"
                width={56}
                height={56}
                priority
              />
            </div>

            <div className={styles.badgeWrap}>
              VETRA
              <div className={styles.badge} aria-hidden="true">
                CMS
              </div>
            </div>
          </div>

          <h1 className={styles.title}>Authorized access only</h1>
          <p className={styles.sub}>Sign in to your secure control panel</p>
        </header>

        <form className={styles.form} onSubmit={onSubmit}>
          <label className={styles.label}>
            <span className={styles.labelText}>Username</span>
            <input
              className={styles.input}
              type="text"
              inputMode="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              minLength={3}
              maxLength={30}
              placeholder="username"
              aria-invalid={!!error}
            />
          </label>

          <label className={styles.label}>
            <span className={styles.labelRow}>
              <span className={styles.labelText}>Password</span>

              <button
                type="button"
                className={styles.pwToggle}
                onClick={() => setShowPw((s) => !s)}
                aria-pressed={showPw}
                aria-label={showPw ? 'Hide password' : 'Show password'}
              >
                {showPw ? 'Hide' : 'Show'}
              </button>
            </span>

            <input
              className={styles.input}
              type={showPw ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              maxLength={200}
              placeholder="••••••••••"
              aria-invalid={!!error}
            />
          </label>

          {error && (
            <p className={styles.error} role="alert">
              {error}
            </p>
          )}

          <button className={styles.btn} type="submit" disabled={isLoading}>
            {isLoading ? 'Signing in…' : 'Sign in'}
          </button>

          <p className={styles.hint}>
            Access is restricted. If you need an account, contact the Admin.
          </p>
        </form>

        <footer className={styles.foot}>
          <span className={styles.footDot} aria-hidden="true" />
          Secure session handling. No client-side access
        </footer>
      </section>
    </main>
  )
}
