// src/app/(site)/services/pageClient/pageClient.tsx
'use client'

import { useEffect, useMemo, useState } from 'react'
import styles from './pageClient.module.css'
import servicesData from './services.json'

type PriceRange = { min: number; max?: number | null }

type BaseType = {
  id: string
  title: string
  subtitle: string
  price: PriceRange
  details: string[]
}

type Addon = {
  id: string
  title: string
  desc: string
  price: PriceRange
  tag?: string
}

type ServicesJSON = {
  baseTypes: BaseType[]
  addonsSmall: Addon[]
  addonsLarge: Addon[]
}

const DATA = servicesData as ServicesJSON
const LS_KEY = 'vetra_services_calc_v3'

function formatTHB(n: number) {
  return new Intl.NumberFormat('th-TH').format(n)
}

function formatRange(r: PriceRange) {
  const min = formatTHB(r.min)
  const max = r.max == null ? null : formatTHB(r.max)
  if (max == null) return `${min}+ บาท`
  if (r.min === r.max) return `${min} บาท`
  return `${min} – ${max} บาท`
}

function addRanges(a: PriceRange, b: PriceRange): PriceRange {
  const min = a.min + b.min
  const max =
    a.max == null || b.max == null
      ? null
      : (a.max as number) + (b.max as number)
  return { min, max }
}

function sumRanges(ranges: PriceRange[]) {
  return ranges.reduce<PriceRange>((acc, r) => addRanges(acc, r), {
    min: 0,
    max: 0,
  })
}

function uniq(ids: string[]) {
  return Array.from(new Set(ids))
}

export default function PageClient() {
  const [baseId, setBaseId] = useState<string>(DATA.baseTypes[0]?.id ?? '')
  const [smallIds, setSmallIds] = useState<string[]>([])
  const [largeIds, setLargeIds] = useState<string[]>([])

  // ✅ open/close "more" state (per group)
  const [openBaseId, setOpenBaseId] = useState<string | null>(null)
  const [openSmallIds, setOpenSmallIds] = useState<string[]>([])
  const [openLargeIds, setOpenLargeIds] = useState<string[]>([])

  function toggleOpenBase(id: string) {
    setOpenBaseId((prev) => (prev === id ? null : id))
  }
  function toggleOpenSmall(id: string) {
    setOpenSmallIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }
  function toggleOpenLarge(id: string) {
    setOpenLargeIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  // restore
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw) as {
        baseId?: string
        smallIds?: string[]
        largeIds?: string[]
      }

      if (parsed.baseId && DATA.baseTypes.some((b) => b.id === parsed.baseId)) {
        setBaseId(parsed.baseId)
      }

      if (Array.isArray(parsed.smallIds)) {
        const ok = parsed.smallIds.filter((id) =>
          DATA.addonsSmall.some((a) => a.id === id),
        )
        setSmallIds(uniq(ok))
      }

      if (Array.isArray(parsed.largeIds)) {
        const ok = parsed.largeIds.filter((id) =>
          DATA.addonsLarge.some((a) => a.id === id),
        )
        setLargeIds(uniq(ok))
      }
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // persist
  useEffect(() => {
    try {
      localStorage.setItem(
        LS_KEY,
        JSON.stringify({ baseId, smallIds, largeIds }),
      )
    } catch {
      // ignore
    }
  }, [baseId, smallIds, largeIds])

  const base = useMemo(
    () => DATA.baseTypes.find((b) => b.id === baseId) ?? DATA.baseTypes[0],
    [baseId],
  )

  const selectedSmall = useMemo(
    () => DATA.addonsSmall.filter((a) => smallIds.includes(a.id)),
    [smallIds],
  )

  const selectedLarge = useMemo(
    () => DATA.addonsLarge.filter((a) => largeIds.includes(a.id)),
    [largeIds],
  )

  const total = useMemo(() => {
    const parts: PriceRange[] = []
    if (base?.price) parts.push(base.price)
    parts.push(...selectedSmall.map((x) => x.price))
    parts.push(...selectedLarge.map((x) => x.price))
    return sumRanges(parts)
  }, [base, selectedSmall, selectedLarge])

  function toggleSmall(id: string) {
    setSmallIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  function toggleLarge(id: string) {
    setLargeIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  function resetAll() {
    setBaseId(DATA.baseTypes[0]?.id ?? '')
    setSmallIds([])
    setLargeIds([])

    // optional: close all
    setOpenBaseId(null)
    setOpenSmallIds([])
    setOpenLargeIds([])
  }

  const breakdownText = useMemo(() => {
    const lines: string[] = []
    lines.push(
      `ประเภทเว็บไซต์: ${base?.title ?? '-'} (${formatRange(
        base?.price ?? { min: 0, max: 0 },
      )})`,
    )

    if (selectedSmall.length) {
      lines.push('')
      lines.push('ฟังก์ชันเพิ่มเติม (เล็ก):')
      for (const a of selectedSmall)
        lines.push(`- ${a.title} (${formatRange(a.price)})`)
    }

    if (selectedLarge.length) {
      lines.push('')
      lines.push('ฟังก์ชันเพิ่มเติม (ใหญ่):')
      for (const a of selectedLarge)
        lines.push(`- ${a.title} (${formatRange(a.price)})`)
    }

    lines.push('')
    lines.push(`รวมโดยประมาณ: ${formatRange(total)}`)
    lines.push('')
    lines.push(
      'หมายเหตุ: เป็นราคาโดยประมาณเท่านั้น ราคาจริงจะมีหักส่วนลด และแถมฟังก์ชันให้ โดยคิดตามความยากง่ายของงาน',
    )

    return lines.join('\n')
  }, [base, selectedSmall, selectedLarge, total])

  async function copyBrief() {
    try {
      await navigator.clipboard.writeText(breakdownText)
    } catch {
      // ignore
    }
  }

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
            >
              คัดลอกสรุป
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
          >
            คัดลอกสรุป
          </button>
          <button type="button" className={styles.btnGhost} onClick={resetAll}>
            รีเซ็ต
          </button>
        </div>
      </div>
    </div>
  )
}
