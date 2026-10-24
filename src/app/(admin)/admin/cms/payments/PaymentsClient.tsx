'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, CircleAlert, Clock3, CreditCard, Plus, RefreshCw, Search } from 'lucide-react'
import type { PaymentListResponse, PaymentStatus } from '@/lib/payments/types'
import { dateTime, money, responseError, paymentStatusLabel, paymentMessage } from './paymentUi'
import { useCmsI18n } from '@/components/cms/CmsLanguageProvider'
import styles from './payments.module.css'

type StatusFilter = 'all' | PaymentStatus
const FILTERS: StatusFilter[] = ['all', 'pending', 'processing', 'paid', 'needs_review', 'cancelled', 'expired']

export default function PaymentsClient() {
  const { locale, intlLocale, t, formatNumber } = useCmsI18n()
  const [data, setData] = useState<PaymentListResponse | null>(null)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<StatusFilter>('all')
  const [page, setPage] = useState(1)
  const [refreshKey, setRefreshKey] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async (signal: AbortSignal) => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({ page: String(page) })
      if (query.trim()) params.set('q', query.trim())
      if (filter !== 'all') params.set('status', filter)
      const response = await fetch(`/api/admin/payments?${params.toString()}`, { cache: 'no-store', signal })
      if (!response.ok) throw new Error(await responseError(response))
      const result = await response.json() as PaymentListResponse
      if (!signal.aborted) {
        setData(result)
        if (result.page !== page) setPage(result.page)
      }
    } catch (cause) {
      if (!signal.aborted) setError(cause instanceof Error ? cause.message : 'Could not load payment requests.')
    } finally { if (!signal.aborted) setLoading(false) }
  }, [filter, page, query])

  useEffect(() => {
    const controller = new AbortController()
    const timer = setTimeout(() => void load(controller.signal), query.trim() ? 250 : 0)
    return () => { clearTimeout(timer); controller.abort() }
  }, [load, query, refreshKey])

  const payments = data?.payments ?? []
  const total = data?.total ?? 0
  const pageSize = data?.pageSize || 20
  const lastPage = Math.max(1, Math.ceil(total / pageSize))
  const stripe = data?.configuration.gateways.find((gateway) => gateway.id === 'stripe')
  const openOnPage = payments.filter((payment) => payment.status === 'pending' || payment.status === 'processing').length
  const paidOnPage = payments.filter((payment) => payment.status === 'paid').length
  const reviewOnPage = payments.filter((payment) => payment.status === 'needs_review').length

  return <main className={styles.page}>
    <header className={styles.header}>
      <div className={styles.headerCopy}><span className={styles.eyebrow}>{t("Payments / Management", "การชำระเงิน / จัดการ")}</span><h1 className={styles.title}>{t("Payment links", "ลิงก์ชำระเงิน")}</h1><p className={styles.subtitle}>{t("Create a request, share its link or QR code, and follow its verified payment status.", "สร้างรายการเรียกเก็บเงิน ส่งลิงก์หรือ QR Code และติดตามสถานะที่ยืนยันแล้ว")}</p></div>
      <div className={styles.headerActions}><Link className={styles.primaryButton} href="/admin/cms/payments/new"><Plus size={19} aria-hidden="true" />{t("Create payment link", "สร้างลิงก์ชำระเงิน")}</Link></div>
    </header>
    {data && (!stripe?.ready || data.configuration.mode === 'test' || !data.configuration.linksShareable) && <div className={styles.banner} role="status"><CircleAlert size={21} aria-hidden="true" /><div><strong>{!stripe?.ready ? t("Stripe setup is incomplete", "ยังตั้งค่า Stripe ไม่ครบ") : data.configuration.mode === 'test' ? t("Stripe is in test mode", "Stripe อยู่ในโหมดทดสอบ") : t("Public website URL is not configured", "ยังไม่ได้ตั้งค่า URL เว็บไซต์สาธารณะ")}</strong><p>{!stripe?.ready ? t("You can create payment requests now. Customer checkout stays unavailable until Stripe is configured.", "สร้างรายการเรียกเก็บเงินได้ทันที ลูกค้าจะเริ่มชำระเงินได้เมื่อตั้งค่า Stripe ครบแล้ว") : data.configuration.mode === 'test' ? t("Use these links for test payments only.", "ใช้ลิงก์เหล่านี้สำหรับทดสอบการชำระเงินเท่านั้น") : t("Links can be previewed locally, but should not be shared with customers yet.", "เปิดดูลิงก์บนเครื่องนี้ได้ แต่ยังไม่ควรส่งให้ลูกค้า")}</p>{data.configuration.configurationIssues.length > 0 && <p>{data.configuration.configurationIssues.map((issue) => paymentMessage(issue, locale)).join(' ')}</p>}</div></div>}
    <section className={styles.stats} aria-label={t("Payment overview", "ภาพรวมการชำระเงิน")}>
      <div className={styles.stat}><span>{t("Matching requests", "รายการที่พบ")}</span><strong>{loading && !data ? '—' : formatNumber(total)}</strong></div>
      <div className={styles.stat}><span>{t("Open on this page", "รายการที่ยังเปิดในหน้านี้")}</span><strong>{loading && !data ? '—' : formatNumber(openOnPage)}</strong></div>
      <div className={styles.stat}><span>{t("Paid on this page", "ชำระแล้วในหน้านี้")}</span><strong>{loading && !data ? '—' : formatNumber(paidOnPage)}</strong></div>
      <div className={styles.stat}><span>{t("Needs review on this page", "ต้องตรวจสอบในหน้านี้")}</span><strong>{loading && !data ? '—' : formatNumber(reviewOnPage)}</strong></div>
    </section>
    <section className={styles.panel} aria-label={t("Payment request history", "ประวัติรายการเรียกเก็บเงิน")}>
      <div className={styles.panelHead}><div><h2>{t("Request history", "ประวัติรายการ")}</h2><p>{loading ? t("Updating…", "กำลังอัปเดต…") : t(`${formatNumber(total)} request${total === 1 ? '' : 's'} ${total === 1 ? 'matches' : 'match'} your view`, `พบ ${formatNumber(total)} รายการตามตัวกรอง`)}</p></div><button type="button" className={styles.secondaryButton} disabled={loading} onClick={() => setRefreshKey((key) => key + 1)}><RefreshCw size={18} aria-hidden="true" />{t("Refresh list", "รีเฟรชรายการ")}</button></div>
      <div className={styles.toolbar}><label className={styles.search}><span className={styles.srOnly}>{t("Search payments", "ค้นหาการชำระเงิน")}</span><Search size={20} aria-hidden="true" /><input type="search" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1) }} placeholder={t("Search title, customer, or reference", "ค้นหาชื่อรายการ ลูกค้า หรือเลขอ้างอิง")} /></label><div className={styles.filters} role="group" aria-label={t("Filter by payment status", "กรองตามสถานะการชำระเงิน")}>{FILTERS.map((value) => <button key={value} type="button" className={`${styles.filterButton} ${filter === value ? styles.filterActive : ''}`} aria-pressed={filter === value} onClick={() => { setFilter(value); setPage(1) }}>{value === 'all' ? t("All", "ทั้งหมด") : paymentStatusLabel(value, locale)}</button>)}</div></div>
      {error && <div className={styles.state} role="alert"><strong>{t("Payment requests could not be loaded", "โหลดรายการเรียกเก็บเงินไม่สำเร็จ")}</strong><p>{paymentMessage(error, locale)}</p><button type="button" className={styles.secondaryButton} onClick={() => setRefreshKey((key) => key + 1)}>{t("Try again", "ลองอีกครั้ง")}</button></div>}
      {!error && loading && !data && <div className={styles.state} role="status">{t("Loading payment requests…", "กำลังโหลดรายการเรียกเก็บเงิน…")}</div>}
      {!error && !loading && payments.length === 0 && <div className={styles.empty}><CreditCard size={32} strokeWidth={1.5} aria-hidden="true" /><h3>{query || filter !== 'all' ? t("No matching requests", "ไม่พบรายการที่ตรงกัน") : t("No payment links yet", "ยังไม่มีลิงก์ชำระเงิน")}</h3><p>{query || filter !== 'all' ? t("Try another search or status.", "ลองค้นหาคำอื่นหรือเลือกสถานะอื่น") : t("Create a payment request to get a shareable link and QR code.", "สร้างรายการเรียกเก็บเงินเพื่อรับลิงก์และ QR Code สำหรับส่งให้ลูกค้า")}</p>{!query && filter === 'all' && <Link href="/admin/cms/payments/new" className={styles.primaryButton}><Plus size={18} aria-hidden="true" />{t("Create payment link", "สร้างลิงก์ชำระเงิน")}</Link>}</div>}
      {!error && payments.length > 0 && <div className={styles.list}>{payments.map((payment) => <Link key={payment.id} href={`/admin/cms/payments/${encodeURIComponent(payment.id)}`} className={styles.listRow}><div className={styles.rowMain}><strong>{payment.title}</strong><span>{payment.reference || payment.customerName || (payment.kind === 'service' ? t("Service request", "รายการค่าบริการ") : t("Product request", "รายการค่าสินค้า"))}</span></div><strong className={styles.rowAmount}>{money(payment.amountMinor, intlLocale)}</strong><span className={`${styles.status} ${styles[payment.status]}`}>{paymentStatusLabel(payment.status, locale)}</span><span className={styles.rowDate}><Clock3 size={16} aria-hidden="true" /> {dateTime(payment.createdAt, intlLocale)}</span><ArrowRight className={styles.rowArrow} size={19} aria-hidden="true" /></Link>)}</div>}
      {!error && !loading && total > pageSize && <div className={styles.toolbar}><span className={styles.helper}>{t(`Page ${formatNumber(page)} of ${formatNumber(lastPage)}`, `หน้า ${formatNumber(page)} จาก ${formatNumber(lastPage)}`)}</span><div className={styles.actionGroup}><button type="button" className={styles.secondaryButton} disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>{t("Previous", "ก่อนหน้า")}</button><button type="button" className={styles.secondaryButton} disabled={page >= lastPage} onClick={() => setPage((value) => value + 1)}>{t("Next", "ถัดไป")}</button></div></div>}
    </section>
  </main>
}
