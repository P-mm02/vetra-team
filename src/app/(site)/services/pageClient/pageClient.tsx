// src/app/(site)/services/pageClient/pageClient.tsx
'use client'

import styles from './pageClient.module.css'
import { usePageClient } from './usePageClient'

export default function PageClient() {
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
  } = usePageClient()

  return (
    <div className={styles.wrap}>
      <div className={styles.stack}>
        {/* Base type */}
        <section
          className={`glass ${styles.panel}`}
          aria-label="Base Website Type"
        >
          <header className={styles.panelHead}>
            <h2 className={styles.h2}>ประเภทเว็บไซต์</h2>
            <p className={styles.hint}>เลือกได้ 1 แบบ</p>
          </header>

          <div
            className={styles.pillList}
            role="radiogroup"
            aria-label="Website type options"
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
                    aria-label="Toggle details"
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
        <section className={`glass ${styles.panel}`} aria-label="Small Add-ons">
          <header className={styles.panelHead}>
            <h2 className={styles.h2}>ฟังก์ชันเพิ่มเติม (เล็ก)</h2>
            <p className={styles.hint}>เลือกได้หลายอัน</p>
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
                    aria-label="Toggle details"
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
        <section className={`glass ${styles.panel}`} aria-label="Large Add-ons">
          <header className={styles.panelHead}>
            <h2 className={styles.h2}>ฟังก์ชันเพิ่มเติม (ใหญ่)</h2>
            <p className={styles.hint}>
              ระบบที่ซับซ้อน/มีแบ็กเอนด์/มีฐานข้อมูล
            </p>
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
                    aria-label="Toggle details"
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
          aria-label="Calculation Details"
        >
          <header className={styles.detailsHead}>
            <h2 className={styles.h2}>รายละเอียดการคำนวณ</h2>
            <div className={styles.detailsTotalLine}>
              <span className={styles.detailsMuted}>รวม</span>
              <span className={styles.detailsPrice}>{formatRange(total)}</span>
            </div>
          </header>

          <div className={styles.detailsBody}>
            <div className={styles.block}>
              <div className={styles.blockTitle}>ประเภทเว็บไซต์</div>
              <div className={styles.line}>
                <span className={styles.name}>{base?.title ?? '-'}</span>
                <span className={styles.price}>
                  {formatRange(base?.price ?? { min: 0, max: 0 })}
                </span>
              </div>
            </div>

            <div className={styles.block}>
              <div className={styles.blockTitle}>ฟังก์ชันเพิ่มเติม (เล็ก)</div>
              {selectedSmall.length ? (
                selectedSmall.map((a) => (
                  <div key={a.id} className={styles.line}>
                    <span className={styles.name}>{a.title}</span>
                    <span className={styles.price}>{formatRange(a.price)}</span>
                  </div>
                ))
              ) : (
                <div className={styles.empty}>ยังไม่ได้เลือก</div>
              )}
            </div>

            <div className={styles.block}>
              <div className={styles.blockTitle}>ฟังก์ชันเพิ่มเติม (ใหญ่)</div>
              {selectedLarge.length ? (
                selectedLarge.map((a) => (
                  <div key={a.id} className={styles.line}>
                    <span className={styles.name}>{a.title}</span>
                    <span className={styles.price}>{formatRange(a.price)}</span>
                  </div>
                ))
              ) : (
                <div className={styles.empty}>ยังไม่ได้เลือก</div>
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
              {copied ? 'คัดลอก \u00A0 ✓' : 'คัดลอกสรุป'}
            </button>

            <button
              type="button"
              className={styles.btnGhost}
              onClick={resetAll}
            >
              รีเซ็ต
            </button>
          </div>

          <details className={styles.debug}>
            <summary>ดูข้อความสรุป (Preview)</summary>
            <pre className={styles.pre}>{breakdownText}</pre>
          </details>
        </section>
      </div>

      {/* Spacer so bottom dock doesn't cover content */}
      <div className={styles.dockSpacer} />

      {/* FIXED TOTAL DOCK */}
      <div
        className={styles.totalDock}
        role="status"
        aria-label="Total fixed bar"
      >
        <div className={styles.totalDockInner}>
          <div className={styles.totalDockLabel}>รวม</div>
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
            {copied ? 'คัดลอก \u00A0 ✓' : 'คัดลอกสรุป'}
          </button>

          <button type="button" className={styles.btnGhost} onClick={resetAll}>
            รีเซ็ต
          </button>
        </div>
      </div>
    </div>
  )
}
