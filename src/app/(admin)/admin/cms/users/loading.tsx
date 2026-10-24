'use client'

import { useCmsI18n } from '@/components/cms/CmsLanguageProvider'
// src/app/(admin)/admin/cms/users/Loading.tsx
import styles from './page.module.css'

import Skeleton from '@/app/(admin)/admin/cms/_components/loading/Skeleton/Skeleton'
import CircleSpining from '@/app/(admin)/admin/cms/_components/loading/CircleSpining/CircleSpining'

export default function Loading() {
  const { t } = useCmsI18n()
  return (
    <main className={styles.page} aria-label={t('Loading users', 'กำลังโหลดผู้ใช้')}>
      <header className={styles.header}>
        <div className={styles.headerText}>
          <h1 className={styles.h1}>{t('Users', 'ผู้ใช้')}</h1>
          <p className={styles.sub}>
            <Skeleton style={{ width: '26rem', height: '1em' }} />
          </p>
        </div>

        <div className={styles.headerActions}>
          <span
            style={{
              display: 'inline-flex',
              borderRadius: 999,
              overflow: 'hidden',
            }}
          >
            <Skeleton style={{ width: '8.8rem', height: '2.4rem' }} />
          </span>
        </div>
      </header>

      <section className={styles.panel} aria-label={t('User list loading', 'กำลังโหลดรายการผู้ใช้')}>
        <div className={styles.tableWrap} aria-hidden="true">
          <table className={styles.table}>
            <thead>
              <tr>
                <th>{t('User', 'ผู้ใช้')}</th>
                <th>{t('Email', 'อีเมล')}</th>
                <th>{t('Role', 'สิทธิ์')}</th>
                <th>{t('Status', 'สถานะ')}</th>
                <th>{t('Created', 'วันที่สร้าง')}</th>
                <th>{t('Last login', 'เข้าสู่ระบบล่าสุด')}</th>
              </tr>
            </thead>

            <tbody>
              {Array.from({ length: 10 }).map((_, i) => (
                <tr key={i}>
                  <td>
                    <Skeleton
                      style={{ width: i % 3 === 0 ? '9.5rem' : '7.8rem' }}
                    />
                  </td>
                  <td>
                    <Skeleton style={{ width: '15rem' }} />
                  </td>
                  <td>
                    <Skeleton style={{ width: '6rem' }} />
                  </td>
                  <td>
                    <Skeleton style={{ width: '6.5rem' }} />
                  </td>
                  <td>
                    <Skeleton style={{ width: '8.5rem' }} />
                  </td>
                  <td>
                    <Skeleton style={{ width: '8.5rem' }} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <footer className={styles.foot}>
          <span className={styles.footDot} aria-hidden="true" />
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              minWidth: 0,
            }}
          >
            <Skeleton style={{ width: '12rem', height: '1em' }} />
          </span>

          <span style={{ marginLeft: 'auto', display: 'inline-flex' }}>
            <CircleSpining size="2.6rem" hideLabel label={t('Loading users…', 'กำลังโหลดผู้ใช้…')} />
          </span>
        </footer>
      </section>
    </main>
  )
}
