// src/app/(site)/services/pageClient/pageClient.tsx
'use client'

import styles from './pageClient.module.css'
import { usePageClient } from './usePageClient'
import type { Locale } from '@/lib/i18n'
import { useEffect, useRef, useState } from 'react'

const copy = {
  th: {
    baseTitle: 'ประเภทเว็บไซต์',
    baseHint: 'เลือกได้ 1 แบบ',
    smallTitle: 'ฟังก์ชันเพิ่มเติม (เล็ก)',
    smallHint: 'เลือกได้หลายอัน',
    largeTitle: 'ฟังก์ชันเพิ่มเติม (ใหญ่)',
    largeHint: 'ระบบที่ซับซ้อน/มีแบ็กเอนด์/มีฐานข้อมูล',
    detailsTitle: 'รายละเอียดการคำนวณ',
    total: 'รวม',
    empty: 'ยังไม่ได้เลือก',
    copyIdle: 'คัดลอกสรุป',
    copied: 'คัดลอก   ✓',
    reset: 'รีเซ็ต',
    preview: 'ดูข้อความสรุป (Preview)',
    fixedBar: 'แถบแสดงราคารวม',
    baseSection: 'เลือกประเภทเว็บไซต์',
    baseOptions: 'ตัวเลือกประเภทเว็บไซต์',
    smallSection: 'ฟังก์ชันเพิ่มเติมขนาดเล็ก',
    largeSection: 'ฟังก์ชันเพิ่มเติมขนาดใหญ่',
    toggleDetails: 'แสดงหรือซ่อนรายละเอียด',
    calculationDetails: 'รายละเอียดการคำนวณราคา',
  },
  en: {
    baseTitle: 'Website type',
    baseHint: 'Choose one',
    smallTitle: 'Small add-ons',
    smallHint: 'Choose multiple options',
    largeTitle: 'Large add-ons',
    largeHint: 'Complex systems with backend, database, or workflows',
    detailsTitle: 'Estimate breakdown',
    total: 'Total',
    empty: 'Not selected',
    copyIdle: 'Copy summary',
    copied: 'Copied   ✓',
    reset: 'Reset',
    preview: 'Preview summary text',
    fixedBar: 'Total fixed bar',
    baseSection: 'Base website type',
    baseOptions: 'Website type options',
    smallSection: 'Small add-ons',
    largeSection: 'Large add-ons',
    toggleDetails: 'Show or hide details',
    calculationDetails: 'Calculation details',
  },
} satisfies Record<Locale, Record<string, string>>

export default function PageClient({ locale = 'th' }: { locale?: Locale }) {
  const t = copy[locale]
  const wrapRef = useRef<HTMLDivElement>(null)
  const [dockVisible, setDockVisible] = useState(false)
  const {
    DATA,

    baseId,
    setBaseId,
    smallIds,
    largeIds,

    openBaseId,
    openSmallIds,
    openLargeIds,

    toggleOpenBase,
    toggleOpenSmall,
    toggleOpenLarge,

    toggleSmall,
    toggleLarge,
    resetAll,

    base,
    selectedSmall,
    selectedLarge,
    total,
    breakdownText,
    formatRange,

    copied,
    copyBrief,
  } = usePageClient(locale)

  useEffect(() => {
    const element = wrapRef.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => setDockVisible(entry.isIntersecting),
      { threshold: 0 },
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={wrapRef} className={styles.wrap}>
      <div className={styles.stack}>
        {/* Base type */}
        <section
          className={`glass ${styles.panel}`}
          aria-label={t.baseSection}
        >
          <header className={styles.panelHead}>
            <h2 className={styles.h2}>{t.baseTitle}</h2>
            <p className={styles.hint}>{t.baseHint}</p>
          </header>

          <div
            className={styles.pillList}
            role="radiogroup"
            aria-label={t.baseOptions}
          >
            {DATA.baseTypes.map((b) => {
              const active = b.id === baseId
              const isOpen = openBaseId === b.id

              return (
                <div
                  key={b.id}
                  className={`${styles.pill} ${active ? styles.pillOn : ''}`}
                  role="radio"
                  aria-checked={active}
                  tabIndex={0}
                  onClick={() => setBaseId(b.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      setBaseId(b.id)
                    }
                  }}
                >
                  <div className={styles.pillTop}>
                    <div className={styles.pillTitle}>{b.title}</div>
                  </div>

                  <div
                    className={`${styles.more} ${isOpen ? styles.moreOpen : ''}`}
                  >
                    <div className={styles.moreSub}>{b.subtitle}</div>
                    <ul className={styles.moreList}>
                      {b.details.map((d, i) => (
                        <li key={`${b.id}-d-${i}`}>{d}</li>
                      ))}
                    </ul>
                  </div>

                  <button
                    type="button"
                    className={`${styles.moreBtn} ${isOpen ? styles.moreBtnOpen : ''}`}
                    aria-label={`${t.toggleDetails}: ${b.title}`}
                    aria-expanded={isOpen}
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleOpenBase(b.id)
                    }}
                    onKeyDown={(e) => e.stopPropagation()}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      width="24"
                      height="24"
                      aria-hidden="true"
                      className={styles.moreBtnArrow}
                    >
                      <path
                        d="M14 22 L22 22 L22 14"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </div>
              )
            })}
          </div>
        </section>

        {/* Small addons */}
        <section
          className={`glass ${styles.panel}`}
          aria-label={t.smallSection}
        >
          <header className={styles.panelHead}>
            <h2 className={styles.h2}>{t.smallTitle}</h2>
            <p className={styles.hint}>{t.smallHint}</p>
          </header>

          <div className={styles.pillList}>
            {DATA.addonsSmall.map((a) => {
              const checked = smallIds.includes(a.id)
              const isOpen = openSmallIds.includes(a.id)

              return (
                <div
                  key={a.id}
                  className={`${styles.pill} ${checked ? styles.pillOn : ''}`}
                  onClick={() => toggleSmall(a.id)}
                  role="checkbox"
                  aria-checked={checked}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      toggleSmall(a.id)
                    }
                  }}
                >
                  <div className={styles.pillTop}>
                    <div className={styles.pillTitle}>{a.title}</div>
                  </div>

                  <div
                    className={`${styles.more} ${isOpen ? styles.moreOpen : ''}`}
                  >
                    <div className={styles.moreSub}>{a.desc}</div>

                    {a.tag
                      ? a.tag
                          .split(',')
                          .map((t) => t.trim())
                          .filter(Boolean)
                          .map((t, i) => (
                            <div key={`${t}-${i}`} className={styles.tag}>
                              {t}
                            </div>
                          ))
                      : null}
                  </div>

                  <button
                    type="button"
                    className={`${styles.moreBtn} ${isOpen ? styles.moreBtnOpen : ''}`}
                    aria-label={`${t.toggleDetails}: ${a.title}`}
                    aria-expanded={isOpen}
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleOpenSmall(a.id)
                    }}
                    onKeyDown={(e) => e.stopPropagation()}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      width="24"
                      height="24"
                      aria-hidden="true"
                      className={styles.moreBtnArrow}
                    >
                      <path
                        d="M14 22 L22 22 L22 14"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </div>
              )
            })}
          </div>
        </section>

        {/* Large addons */}
        <section
          className={`glass ${styles.panel}`}
          aria-label={t.largeSection}
        >
          <header className={styles.panelHead}>
            <h2 className={styles.h2}>{t.largeTitle}</h2>
            <p className={styles.hint}>{t.largeHint}</p>
          </header>

          <div className={styles.pillList}>
            {DATA.addonsLarge.map((a) => {
              const checked = largeIds.includes(a.id)
              const isOpen = openLargeIds.includes(a.id)

              return (
                <div
                  key={a.id}
                  className={`${styles.pill} ${checked ? styles.pillOn : ''}`}
                  onClick={() => toggleLarge(a.id)}
                  role="checkbox"
                  aria-checked={checked}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      toggleLarge(a.id)
                    }
                  }}
                >
                  <div className={styles.pillTop}>
                    <div className={styles.pillTitle}>{a.title}</div>
                  </div>

                  <div
                    className={`${styles.more} ${isOpen ? styles.moreOpen : ''}`}
                  >
                    <div className={styles.moreSub}>{a.desc}</div>
                    {a.tag ? <div className={styles.tag}>{a.tag}</div> : null}
                  </div>

                  <button
                    type="button"
                    className={`${styles.moreBtn} ${isOpen ? styles.moreBtnOpen : ''}`}
                    aria-label={`${t.toggleDetails}: ${a.title}`}
                    aria-expanded={isOpen}
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleOpenLarge(a.id)
                    }}
                    onKeyDown={(e) => e.stopPropagation()}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      width="24"
                      height="24"
                      aria-hidden="true"
                      className={styles.moreBtnArrow}
                    >
                      <path
                        d="M14 22 L22 22 L22 14"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </div>
              )
            })}
          </div>
        </section>

        {/* Details */}
        <section
          className={`glass ${styles.details}`}
          aria-label={t.calculationDetails}
        >
          <header className={styles.detailsHead}>
            <h2 className={styles.h2}>{t.detailsTitle}</h2>
            <div className={styles.detailsTotalLine}>
              <span className={styles.detailsMuted}>{t.total}</span>
              <span className={styles.detailsPrice}>{formatRange(total)}</span>
            </div>
          </header>

          <div className={styles.detailsBody}>
            <div className={styles.block}>
              <div className={styles.blockTitle}>{t.baseTitle}</div>
              <div className={styles.line}>
                <span className={styles.name}>{base?.title ?? '-'}</span>
                <span className={styles.price}>
                  {formatRange(base?.price ?? { min: 0, max: 0 })}
                </span>
              </div>
            </div>

            <div className={styles.block}>
              <div className={styles.blockTitle}>{t.smallTitle}</div>
              {selectedSmall.length ? (
                selectedSmall.map((a) => (
                  <div key={a.id} className={styles.line}>
                    <span className={styles.name}>{a.title}</span>
                    <span className={styles.price}>{formatRange(a.price)}</span>
                  </div>
                ))
              ) : (
                <div className={styles.empty}>{t.empty}</div>
              )}
            </div>

            <div className={styles.block}>
              <div className={styles.blockTitle}>{t.largeTitle}</div>
              {selectedLarge.length ? (
                selectedLarge.map((a) => (
                  <div key={a.id} className={styles.line}>
                    <span className={styles.name}>{a.title}</span>
                    <span className={styles.price}>{formatRange(a.price)}</span>
                  </div>
                ))
              ) : (
                <div className={styles.empty}>{t.empty}</div>
              )}
            </div>
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.btnPrimary}
              onClick={copyBrief}
              data-state={copied ? 'copied' : 'idle'}
              aria-live="polite"
            >
              {copied ? t.copied : t.copyIdle}
            </button>

            <button
              type="button"
              className={styles.btnGhost}
              onClick={resetAll}
            >
              {t.reset}
            </button>
          </div>

          <details className={styles.debug}>
            <summary>{t.preview}</summary>
            <pre className={styles.pre}>{breakdownText}</pre>
          </details>
        </section>
      </div>

      {/* Spacer so bottom dock doesn't cover content */}
      <div className={styles.dockSpacer} />

      {/* FIXED TOTAL DOCK */}
      <div
        className={`${styles.totalDock} ${
          dockVisible ? styles.totalDockVisible : ''
        }`}
        role="status"
        aria-label={t.fixedBar}
        aria-hidden={!dockVisible}
        inert={!dockVisible}
      >
        <div className={styles.totalDockInner}>
          <div className={styles.totalDockLabel}>{t.total}</div>
          <div className={styles.totalDockValue}>{formatRange(total)}</div>
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.btnPrimary}
            onClick={copyBrief}
            data-state={copied ? 'copied' : 'idle'}
          aria-live="polite"
        >
          {copied ? t.copied : t.copyIdle}
        </button>

        <button type="button" className={styles.btnGhost} onClick={resetAll}>
          {t.reset}
        </button>
        </div>
      </div>
    </div>
  )
}
