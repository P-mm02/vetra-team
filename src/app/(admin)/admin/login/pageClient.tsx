// src/app/(admin)/admin/login/pageClient.tsx
'use client'

import { useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import styles from './page.module.css'
import { useCmsI18n } from '@/components/cms/CmsLanguageProvider'
import CmsLanguageSwitch from '@/components/cms/CmsLanguageSwitch'

type LoginState = 'idle' | 'loading'

function safeNextPath(raw: string | null) {
  if (!raw) return '/admin/cms'
  if (raw.includes('\\') || /[\u0000-\u001f]/.test(raw)) return '/admin/cms'
  const pathname = raw.split(/[?#]/, 1)[0]
  if (pathname !== '/admin/cms' && !pathname.startsWith('/admin/cms/')) return '/admin/cms'
  return raw
}


export default function PageClient() {
  const { t } = useCmsI18n()
  const sp = useSearchParams()

  const nextRaw = sp.get('next')
  const nextPath = useMemo(() => safeNextPath(nextRaw), [nextRaw])

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)

  const [state, setState] = useState<LoginState>('idle')
  const [error, setError] = useState<'unavailable' | 'invalid' | 'network' | null>(null)
  const errorText = error === 'unavailable'
    ? t('Sign-in is temporarily unavailable. Please try again shortly.', 'ระบบเข้าสู่ระบบไม่พร้อมใช้งานชั่วคราว กรุณาลองใหม่อีกครั้ง')
    : error === 'invalid' ? t('Username, email, or password is incorrect.', 'ชื่อผู้ใช้ อีเมล หรือรหัสผ่านไม่ถูกต้อง')
    : t('Network error. Please try again.', 'เชื่อมต่อไม่สำเร็จ กรุณาลองใหม่')

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
        setError(res.status >= 500
          ? 'unavailable'
          : 'invalid')
        setState('idle')
        return
      }

      window.location.href = nextPath
    } catch {
      setError('network')
      setState('idle')
    }
  }

  return (
    <main className={styles.wrap}>
      <section className={styles.card} aria-label={t('CMS login', 'เข้าสู่ระบบจัดการเว็บไซต์')}>
        <div className={styles.language}><CmsLanguageSwitch /></div>
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

          <h1 className={styles.title}>{t('Authorized access only', 'สำหรับผู้ได้รับอนุญาตเท่านั้น')}</h1>
          <p className={styles.sub}>{t('Sign in to your secure control panel', 'เข้าสู่ระบบจัดการเว็บไซต์ของคุณ')}</p>
        </header>

        <form className={styles.form} onSubmit={onSubmit}>
          <label className={styles.label}>
            <span className={styles.labelText}>{t('Username or email', 'ชื่อผู้ใช้หรืออีเมล')}</span>
            <input
              className={styles.input}
              type="text"
              inputMode="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              minLength={3}
              maxLength={254}
              placeholder={t('username or email', 'ชื่อผู้ใช้หรืออีเมล')}
              aria-invalid={!!error}
            />
          </label>

          <label className={styles.label}>
            <span className={styles.labelRow}>
              <span className={styles.labelText}>{t('Password', 'รหัสผ่าน')}</span>

              <button
                type="button"
                className={styles.pwToggle}
                onClick={() => setShowPw((s) => !s)}
                aria-pressed={showPw}
                aria-label={showPw ? t('Hide password', 'ซ่อนรหัสผ่าน') : t('Show password', 'แสดงรหัสผ่าน')}
              >
                {showPw ? t('Hide', 'ซ่อน') : t('Show', 'แสดง')}
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
              {errorText}
            </p>
          )}

          <button className={styles.btn} type="submit" disabled={isLoading}>
            {isLoading ? t('Signing in…', 'กำลังเข้าสู่ระบบ…') : t('Sign in', 'เข้าสู่ระบบ')}
          </button>

          <p className={styles.hint}>
            {t('Access is restricted. If you need an account, contact the Admin.', 'หากต้องการบัญชีสำหรับเข้าใช้งาน กรุณาติดต่อผู้ดูแลระบบ')}
          </p>
        </form>

        <footer className={styles.foot}>
          <span className={styles.footDot} aria-hidden="true" />
          {t('Secure access to your workspace', 'เข้าสู่พื้นที่ทำงานอย่างปลอดภัย')}
        </footer>
      </section>
    </main>
  )
}
