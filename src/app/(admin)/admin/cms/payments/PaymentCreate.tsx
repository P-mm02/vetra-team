'use client'

import { useEffect, useRef, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, CircleAlert, CreditCard, FileText, LockKeyhole, Package, ShieldCheck } from 'lucide-react'
import type { PaymentConfiguration, PaymentDetailResponse, PaymentListResponse } from '@/lib/payments/types'
import { createPaymentSchema, parsePaymentAmount, type CreatePaymentInput } from '@/lib/payments/validation'
import { money, responseError } from './paymentUi'
import styles from './payments.module.css'

type Fields = Omit<CreatePaymentInput, 'idempotencyKey'>
const INITIAL: Fields = { gateway: 'stripe', kind: 'service', title: '', description: '', amount: '', customerName: '', customerEmail: '', reference: '', internalNote: '', expiresInDays: 30 }

export default function PaymentCreate() {
  const router = useRouter()
  const [fields, setFields] = useState<Fields>(INITIAL)
  const [configuration, setConfiguration] = useState<PaymentConfiguration | null>(null)
  const [configurationError, setConfigurationError] = useState('')
  const [configurationLoading, setConfigurationLoading] = useState(true)
  const [configurationAttempt, setConfigurationAttempt] = useState(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [errorSequence, setErrorSequence] = useState(0)
  const [locked, setLocked] = useState(false)
  const snapshot = useRef<CreatePaymentInput | null>(null)
  const inFlight = useRef(false)
  const errorRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!error || !errorRef.current) return
    errorRef.current.scrollIntoView({ block: 'center', behavior: 'auto' })
    errorRef.current.focus({ preventScroll: true })
  }, [error, errorSequence])

  function reportError(message: string) {
    setError(message)
    setErrorSequence((count) => count + 1)
  }

  useEffect(() => {
    const controller = new AbortController()
    setConfigurationLoading(true)
    setConfigurationError('')
    void (async () => {
      try {
        const response = await fetch('/api/admin/payments?page=1', { cache: 'no-store', signal: controller.signal })
        if (!response.ok) throw new Error(await responseError(response))
        const result = await response.json() as PaymentListResponse
        if (!controller.signal.aborted) setConfiguration(result.configuration)
      } catch (cause) {
        if (!controller.signal.aborted) setConfigurationError(cause instanceof Error ? cause.message : 'Could not check payment setup.')
      } finally { if (!controller.signal.aborted) setConfigurationLoading(false) }
    })()
    return () => controller.abort()
  }, [configurationAttempt])

  function update<K extends keyof Fields>(key: K, value: Fields[K]) {
    setFields((current) => ({ ...current, [key]: value }))
    setError('')
  }

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (inFlight.current) return
    if (!configuration || configurationLoading) { reportError('Wait for the payment mode and setup check to finish.'); return }
    let payload = snapshot.current
    if (!payload) {
      const candidate = { ...fields, idempotencyKey: crypto.randomUUID() }
      const validation = createPaymentSchema.safeParse(candidate)
      if (!validation.success) { reportError(validation.error.issues[0]?.message || 'Check the payment details.'); return }
      try { parsePaymentAmount(candidate.amount) }
      catch (cause) { reportError(cause instanceof Error ? cause.message : 'Enter a valid THB amount.'); return }
      payload = validation.data
      snapshot.current = payload
    }
    inFlight.current = true
    setLocked(true)
    setBusy(true)
    setError('')
    let navigating = false
    try {
      const response = await fetch('/api/admin/payments', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) })
      if (!response.ok) throw new Error(await responseError(response))
      const result = await response.json() as PaymentDetailResponse
      if (!result.payment?.id) throw new Error('The request may have been created, but the response was incomplete.')
      router.replace(`/admin/cms/payments/${encodeURIComponent(result.payment.id)}`)
      router.refresh()
      navigating = true
    } catch (cause) {
      try {
        const lookup = await fetch(`/api/admin/payments?idempotencyKey=${encodeURIComponent(payload.idempotencyKey)}`, { cache: 'no-store' })
        if (lookup.ok) {
          const existing = await lookup.json() as PaymentDetailResponse
          if (existing.payment?.id) {
            router.replace(`/admin/cms/payments/${encodeURIComponent(existing.payment.id)}`)
            router.refresh()
            navigating = true
            return
          }
        }
      } catch { /* the exact request remains safe to replay */ }
      reportError(`${cause instanceof Error ? cause.message : 'Could not create the payment request.'} Your details are kept. Retry the same request to avoid a duplicate.`)
    } finally {
      if (!navigating) { setBusy(false); inFlight.current = false }
    }
  }

  let amountMinor = 0
  try { amountMinor = parsePaymentAmount(fields.amount) } catch { /* preview remains empty until valid */ }
  const stripe = configuration?.gateways.find((gateway) => gateway.id === 'stripe')

  return <main className={styles.page}>
    <div className={styles.breadcrumb}><Link href="/admin/cms/payments">Payments</Link><span aria-hidden="true">/</span><span>New request</span></div>
    <header className={styles.header}><div className={styles.headerCopy}><span className={styles.eyebrow}>New payment request</span><h1 className={styles.title}>Create a payment link</h1><p className={styles.subtitle}>Enter the agreed amount and details. The request is saved immediately, and its amount cannot be edited later.</p></div><Link className={styles.secondaryButton} href="/admin/cms/payments"><ArrowLeft size={18} aria-hidden="true" />Back to history</Link></header>
    {configurationError && <div className={styles.error} role="alert"><CircleAlert size={21} aria-hidden="true" /><div><strong>Could not check payment setup</strong><p>{configurationError}</p><button type="button" className={styles.secondaryButton} onClick={() => setConfigurationAttempt((count) => count + 1)}>Try again</button></div></div>}
    {configuration && (!stripe?.ready || configuration.mode === 'test' || !configuration.linksShareable) && <div className={styles.banner} role="status"><CircleAlert size={21} aria-hidden="true" /><div><strong>{!stripe?.ready ? 'Stripe setup is incomplete' : configuration.mode === 'test' ? 'Test mode is active' : 'Public website URL is not configured'}</strong><p>{!stripe?.ready ? 'This request can be saved now. Customer checkout will stay unavailable until Stripe is configured.' : configuration.mode === 'test' ? 'The payment link is for test payments only.' : 'You can preview the link locally, but it should not be shared with customers yet.'}</p>{configuration.configurationIssues.length > 0 && <p>{configuration.configurationIssues.join(' ')}</p>}</div></div>}
    {error && <div ref={errorRef} tabIndex={-1} className={styles.error} role="alert"><CircleAlert size={21} aria-hidden="true" /><div><strong>Payment request was not confirmed</strong><p>{error}</p></div></div>}
    <form className={styles.formLayout} onSubmit={(event) => void create(event)}>
      <div className={styles.mainColumn}>
        <section className={styles.panel}><div className={styles.panelHead}><div><h2>Payment details</h2><p>The title and amount are shown to the customer.</p></div><CreditCard size={22} color="var(--cms-accent)" aria-hidden="true" /></div><div className={styles.panelBody}>
          <fieldset disabled={locked || busy} className={styles.choiceGrid} style={{ border: 0 }}><legend className={styles.srOnly}>Payment kind</legend><label className={styles.choice}><input type="radio" name="kind" checked={fields.kind === 'service'} onChange={() => update('kind', 'service')} /><FileText size={21} color="var(--cms-accent)" aria-hidden="true" /><span className={styles.choiceCopy}><strong>Service</strong><small>Consulting, design, or project work</small></span></label><label className={styles.choice}><input type="radio" name="kind" checked={fields.kind === 'product'} onChange={() => update('kind', 'product')} /><Package size={21} color="var(--cms-accent)" aria-hidden="true" /><span className={styles.choiceCopy}><strong>Product</strong><small>A single product or agreed order</small></span></label></fieldset>
          <label className={styles.field}><span>Title <em>Required</em></span><input required maxLength={160} value={fields.title} disabled={locked || busy} onChange={(event) => update('title', event.target.value)} placeholder="e.g. Website design deposit" /></label>
          <label className={styles.field}><span>Description</span><textarea maxLength={2000} value={fields.description} disabled={locked || busy} onChange={(event) => update('description', event.target.value)} placeholder="What is this payment for?" /><small>This appears on the payment page.</small></label>
          <label className={styles.field}><span>Amount <em>Required</em></span><div className={styles.amountWrap}><span>฿</span><input required inputMode="decimal" autoComplete="off" placeholder="0.00" value={fields.amount} disabled={locked || busy} onChange={(event) => update('amount', event.target.value)} aria-label="Amount in Thai baht" /></div><small>THB 10.00–999,999.99. Up to two decimal places.</small></label>
        </div></section>
        <section className={styles.panel}><div className={styles.panelHead}><div><h2>Payment gateway</h2><p>Stripe is available first. Bangkok Bank Merchant iPay is coming soon.</p></div><ShieldCheck size={22} color="var(--cms-accent)" aria-hidden="true" /></div><div className={styles.panelBody}><fieldset disabled={locked || busy} className={styles.choiceGrid} style={{ border: 0 }}><legend className={styles.srOnly}>Payment gateway</legend><label className={styles.choice}><input type="radio" name="gateway" checked readOnly /><CreditCard size={21} color="var(--cms-accent)" aria-hidden="true" /><span className={styles.choiceCopy}><strong>Stripe</strong><small>{stripe?.ready ? 'Ready for payment' : 'Link creation available; checkout setup incomplete'}</small></span></label><label className={styles.choice}><input type="radio" name="gateway" disabled /><LockKeyhole size={21} aria-hidden="true" /><span className={styles.choiceCopy}><strong>Merchant iPay</strong><small>Coming soon</small></span></label></fieldset></div></section>
        <section className={styles.panel}><div className={styles.panelHead}><div><h2>Customer and reference</h2><p>Optional details help you find this request later.</p></div></div><div className={styles.panelBody}><div className={styles.fieldGrid}><label className={styles.field}><span>Customer name</span><input maxLength={120} value={fields.customerName} disabled={locked || busy} onChange={(event) => update('customerName', event.target.value)} autoComplete="name" /></label><label className={styles.field}><span>Customer email</span><input type="email" maxLength={254} value={fields.customerEmail} disabled={locked || busy} onChange={(event) => update('customerEmail', event.target.value)} autoComplete="email" /></label></div><label className={styles.field}><span>Reference</span><input maxLength={80} value={fields.reference} disabled={locked || busy} onChange={(event) => update('reference', event.target.value)} placeholder="e.g. Quote or order number" /><small>The reference can appear on the payment page. Avoid private information.</small></label><label className={styles.field}><span>Internal note</span><textarea maxLength={1000} value={fields.internalNote} disabled={locked || busy} onChange={(event) => update('internalNote', event.target.value)} placeholder="Only visible to staff in the CMS" /></label></div></section>
        <section className={styles.panel}><div className={styles.panelHead}><div><h2>Link lifetime</h2><p>Choose when this payment request expires.</p></div></div><div className={styles.panelBody}><fieldset className={styles.expiryGrid} disabled={locked || busy} style={{ border: 0 }}><legend className={styles.srOnly}>Expiry period</legend>{([7, 14, 30, 90] as const).map((days) => <label key={days} className={styles.expiryChoice}><input type="radio" name="expiry" checked={fields.expiresInDays === days} onChange={() => update('expiresInDays', days)} /><strong>{days}</strong><span>days</span></label>)}</fieldset><p className={styles.helper}>Once the request is created, its amount and expiry cannot be changed. Cancel it and create a new request if needed.</p></div></section>
      </div>
      <aside className={styles.sideColumn}><div className={styles.summary}><span className={styles.summaryLabel}>Request summary</span><h2>{fields.title.trim() || 'New payment request'}</h2><strong className={styles.summaryAmount}>{amountMinor ? money(amountMinor) : '฿—'}</strong><div className={styles.summaryLine}><span>Type</span><strong>{fields.kind === 'service' ? 'Service' : 'Product'}</strong></div><div className={styles.summaryLine}><span>Gateway</span><strong>Stripe</strong></div><div className={styles.summaryLine}><span>Mode</span><strong>{configuration?.mode === "test" ? "Test" : configuration?.mode === "live" ? "Live" : "Checking…"}</strong></div><div className={styles.summaryLine}><span>Expires after</span><strong>{fields.expiresInDays} days</strong></div><p className={styles.summaryNote}>Creating this request saves it immediately. You can share the link and QR code from the next screen.</p><button type="submit" className={styles.primaryButton} disabled={busy || configurationLoading || !configuration}>{busy ? 'Creating request…' : configurationLoading ? 'Checking setup…' : !configuration ? 'Payment setup unavailable' : locked ? 'Retry same request' : 'Create payment link'}</button>{locked && <p className={styles.helper}>These exact details and the same request key will be used for the retry.</p>}</div></aside>
    </form>
  </main>
}
