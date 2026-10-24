'use client'

import { useCmsI18n } from '@/components/cms/CmsLanguageProvider'
// src/app/(admin)/admin/cms/users/add/loading.tsx
import Link from 'next/link'
import styles from './page.module.css'

import Skeleton from '@/app/(admin)/admin/cms/_components/loading/Skeleton/Skeleton'
import CircleSpining from '@/app/(admin)/admin/cms/_components/loading/CircleSpining/CircleSpining'

export default function Loading() {
  const { t } = useCmsI18n()
  return (
    <main className={styles.page} aria-label={t('Loading add user', 'กำลังโหลดหน้าสร้างผู้ใช้')}>
      <header className={styles.header}>
        <div className={styles.headerText}>
          <div className={styles.breadcrumb}>
            <Link
              className={styles.back}
              href="/admin/cms/users"
              aria-disabled="true"
            >
              {'<'} {t('Users', 'ผู้ใช้')}
            </Link>

            <span className={styles.sep} aria-hidden="true">
              /
            </span>

            <span className={styles.here}>{t('Add', 'เพิ่ม')}</span>
          </div>

          <h1 className={styles.h1}>{t('Create user', 'สร้างผู้ใช้')}</h1>

          <p className={styles.sub}>
            <Skeleton style={{ width: '38rem', height: '1em' }} />
          </p>
        </div>
      </header>

      <section className={styles.panel} aria-label={t('Create user form loading', 'กำลังโหลดแบบฟอร์มสร้างผู้ใช้')}>
        {/* Fake notice space (keeps layout stable) */}
        <div
          style={{ display: 'grid', gap: '0.6rem', marginBottom: '0.85rem' }}
        >
          <Skeleton style={{ width: '100%', height: '3.2rem' }} />
        </div>

        <div aria-hidden="true">
          {/* top grid: username/email/role/status */}
          <div className={styles.grid}>
            <div className={styles.field}>
              <span className={styles.label}>{t('Username *', 'ชื่อผู้ใช้ *')}</span>
              <Skeleton style={{ width: '100%', height: '2.55rem' }} />
              <span className={styles.hint}>
                <Skeleton style={{ width: '70%', height: '0.9rem' }} />
              </span>
            </div>

            <div className={styles.field}>
              <span className={styles.label}>{t('Email *', 'อีเมล *')}</span>
              <Skeleton style={{ width: '100%', height: '2.55rem' }} />
              <span className={styles.hint}>
                <Skeleton style={{ width: '78%', height: '0.9rem' }} />
              </span>
            </div>

            <div className={styles.field}>
              <span className={styles.label}>{t('Role *', 'สิทธิ์ *')}</span>
              <Skeleton style={{ width: '100%', height: '2.55rem' }} />
              <span className={styles.hint}>
                <Skeleton style={{ width: '62%', height: '0.9rem' }} />
              </span>
            </div>

            <div className={styles.field}>
              <span className={styles.label}>{t('Status', 'สถานะ')}</span>
              <Skeleton style={{ width: '100%', height: '2.55rem' }} />
              <span className={styles.hint}>
                <Skeleton style={{ width: '66%', height: '0.9rem' }} />
              </span>
            </div>
          </div>

          <div className={styles.divider} />

          {/* password grid */}
          <div className={styles.grid2}>
            <div className={styles.field}>
              <span className={styles.label}>{t('Password *', 'รหัสผ่าน *')}</span>
              <Skeleton style={{ width: '100%', height: '2.55rem' }} />
            </div>

            <div className={styles.field}>
              <span className={styles.label}>{t('Confirm password *', 'ยืนยันรหัสผ่าน *')}</span>
              <Skeleton style={{ width: '100%', height: '2.55rem' }} />
            </div>
          </div>

          {/* actions */}
          <footer className={styles.actions}>
            <span
              style={{
                display: 'inline-flex',
                borderRadius: 999,
                overflow: 'hidden',
              }}
            >
              <Skeleton style={{ width: '7.5rem', height: '2.6rem' }} />
            </span>

            <span
              style={{
                marginLeft: 'auto',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.6rem',
              }}
            >
              <CircleSpining size="2.2rem" hideLabel label={t('Loading…', 'กำลังโหลด…')} />
              <span
                style={{
                  display: 'inline-flex',
                  borderRadius: 999,
                  overflow: 'hidden',
                }}
              >
                <Skeleton style={{ width: '9.5rem', height: '2.6rem' }} />
              </span>
            </span>
          </footer>
        </div>
      </section>
    </main>
  )
}
