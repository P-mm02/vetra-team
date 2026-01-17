// src/app/(admin)/login/pageClient.tsx
'use client'

import { useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import styles from './page.module.css'

type LoginState = 'idle' | 'loading'

function safeNextPath(raw: string | null) {
  if (!raw) return '/cms'
  if (!raw.startsWith('/')) return '/cms'
  if (raw.startsWith('//')) return '/cms'
  return raw
}

export default function PageClient() {
  const sp = useSearchParams()

  // ✅ avoid using `sp` object as dep (it can change identity),
  // depend on the value you actually read instead
  const nextRaw = sp.get('next')
  const nextPath = useMemo(() => safeNextPath(nextRaw), [nextRaw])

  const [email, setEmail] = useState('')
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
          email: email.trim(),
          password,
        }),
      })

      const data = await res.json().catch(() => null)

      if (!res.ok || !data?.ok) {
        setError('Email or password is incorrect.')
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
                width={28}
                height={28}
                priority
              />
            </div>

            <div className={styles.badge} aria-hidden="true">
              CMS
            </div>
          </div>

          <h1 className={styles.title}>VETRA Admin</h1>
          <p className={styles.sub}>
            Sign in to manage your content & projects securely.
          </p>
        </header>

        <form className={styles.form} onSubmit={onSubmit}>
          <label className={styles.label}>
            <span className={styles.labelText}>Email</span>
            <input
              className={styles.input}
              type="email"
              inputMode="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              maxLength={254}
              placeholder="you@domain.com"
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
              placeholder="••••••••"
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
            Access is restricted. If you need an account, contact the owner.
          </p>
        </form>

        <footer className={styles.foot}>
          <span className={styles.footDot} aria-hidden="true" />
          Sessions are stored securely (httpOnly cookie).
        </footer>
      </section>
    </main>
  )
}
