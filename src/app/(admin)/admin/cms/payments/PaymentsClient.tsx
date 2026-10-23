'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, CircleAlert, Clock3, CreditCard, Plus, RefreshCw, Search } from 'lucide-react'
import type { PaymentListResponse, PaymentStatus } from '@/lib/payments/types'
import { dateTime, money, responseError, statusLabels } from './paymentUi'
import styles from './payments.module.css'

type StatusFilter = 'all' | PaymentStatus
const FILTERS: StatusFilter[] = ['all', 'pending', 'processing', 'paid', 'needs_review', 'cancelled', 'expired']

export default function PaymentsClient() {
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
      <div className={styles.headerCopy}><span className={styles.eyebrow}>Payments / Management</span><h1 className={styles.title}>Payment links</h1><p className={styles.subtitle}>Create a request, share its link or QR code, and follow its verified payment status.</p></div>
      <div className={styles.headerActions}><Link className={styles.primaryButton} href="/admin/cms/payments/new"><Plus size={19} aria-hidden="true" />Create payment link</Link></div>
    </header>
    {data && (!stripe?.ready || data.configuration.mode === 'test' || !data.configuration.linksShareable) && <div className={styles.banner} role="status"><CircleAlert size={21} aria-hidden="true" /><div><strong>{!stripe?.ready ? 'Stripe setup is incomplete' : data.configuration.mode === 'test' ? 'Stripe is in test mode' : 'Public website URL is not configured'}</strong><p>{!stripe?.ready ? 'You can create payment requests now. Customer checkout stays unavailable until Stripe is configured.' : data.configuration.mode === 'test' ? 'Use these links for test payments only.' : 'Links can be previewed locally, but should not be shared with customers yet.'}</p>{data.configuration.configurationIssues.length > 0 && <p>{data.configuration.configurationIssues.join(' ')}</p>}</div></div>}
    <section className={styles.stats} aria-label="Payment overview">
      <div className={styles.stat}><span>Matching requests</span><strong>{loading && !data ? '—' : total}</strong></div>
      <div className={styles.stat}><span>Open on this page</span><strong>{loading && !data ? '—' : openOnPage}</strong></div>
      <div className={styles.stat}><span>Paid on this page</span><strong>{loading && !data ? '—' : paidOnPage}</strong></div>
      <div className={styles.stat}><span>Needs review on this page</span><strong>{loading && !data ? '—' : reviewOnPage}</strong></div>
    </section>
    <section className={styles.panel} aria-label="Payment request history">
      <div className={styles.panelHead}><div><h2>Request history</h2><p>{loading ? 'Updating…' : `${total} request${total === 1 ? '' : 's'} ${total === 1 ? 'matches' : 'match'} your view`}</p></div><button type="button" className={styles.secondaryButton} disabled={loading} onClick={() => setRefreshKey((key) => key + 1)}><RefreshCw size={18} aria-hidden="true" />Refresh list</button></div>
      <div className={styles.toolbar}><label className={styles.search}><span className={styles.srOnly}>Search payments</span><Search size={20} aria-hidden="true" /><input type="search" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1) }} placeholder="Search title, customer, or reference" /></label><div className={styles.filters} role="group" aria-label="Filter by payment status">{FILTERS.map((value) => <button key={value} type="button" className={`${styles.filterButton} ${filter === value ? styles.filterActive : ''}`} aria-pressed={filter === value} onClick={() => { setFilter(value); setPage(1) }}>{value === 'all' ? 'All' : statusLabels[value]}</button>)}</div></div>
      {error && <div className={styles.state} role="alert"><strong>Payment requests could not be loaded</strong><p>{error}</p><button type="button" className={styles.secondaryButton} onClick={() => setRefreshKey((key) => key + 1)}>Try again</button></div>}
      {!error && loading && !data && <div className={styles.state} role="status">Loading payment requests…</div>}
      {!error && !loading && payments.length === 0 && <div className={styles.empty}><CreditCard size={32} strokeWidth={1.5} aria-hidden="true" /><h3>{query || filter !== 'all' ? 'No matching requests' : 'No payment links yet'}</h3><p>{query || filter !== 'all' ? 'Try another search or status.' : 'Create a payment request to get a shareable link and QR code.'}</p>{!query && filter === 'all' && <Link href="/admin/cms/payments/new" className={styles.primaryButton}><Plus size={18} aria-hidden="true" />Create payment link</Link>}</div>}
      {!error && payments.length > 0 && <div className={styles.list}>{payments.map((payment) => <Link key={payment.id} href={`/admin/cms/payments/${encodeURIComponent(payment.id)}`} className={styles.listRow}><div className={styles.rowMain}><strong>{payment.title}</strong><span>{payment.reference || payment.customerName || (payment.kind === 'service' ? 'Service request' : 'Product request')}</span></div><strong className={styles.rowAmount}>{money(payment.amountMinor)}</strong><span className={`${styles.status} ${styles[payment.status]}`}>{statusLabels[payment.status]}</span><span className={styles.rowDate}><Clock3 size={16} aria-hidden="true" /> {dateTime(payment.createdAt)}</span><ArrowRight className={styles.rowArrow} size={19} aria-hidden="true" /></Link>)}</div>}
      {!error && !loading && total > pageSize && <div className={styles.toolbar}><span className={styles.helper}>Page {page} of {lastPage}</span><div className={styles.actionGroup}><button type="button" className={styles.secondaryButton} disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Previous</button><button type="button" className={styles.secondaryButton} disabled={page >= lastPage} onClick={() => setPage((value) => value + 1)}>Next</button></div></div>}
    </section>
  </main>
}
