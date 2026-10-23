'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import QRCode from 'qrcode'
import { ArrowLeft, ArrowUpRight, Check, CircleAlert, Copy, Download, ExternalLink, RefreshCw, XCircle } from 'lucide-react'
import type { PaymentDetailResponse } from '@/lib/payments/types'
import { dateTime, money, responseError, statusLabels } from './paymentUi'
import styles from './payments.module.css'

export default function PaymentDetail({ id }: { id: string }) {
  const [data, setData] = useState<PaymentDetailResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [actionError, setActionError] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState<'refresh' | 'cancel' | null>(null)
  const [qrUrl, setQrUrl] = useState('')
  const [qrError, setQrError] = useState('')
  const [qrAttempt, setQrAttempt] = useState(0)
  const [confirmingCancel, setConfirmingCancel] = useState(false)
  const inFlight = useRef(false)
  const cancelTriggerRef = useRef<HTMLButtonElement | null>(null)
  const refreshButtonRef = useRef<HTMLButtonElement | null>(null)
  const cancelDialogRef = useRef<HTMLDivElement | null>(null)
  const keepLinkRef = useRef<HTMLButtonElement | null>(null)

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true)
    setLoadError('')
    try {
      const response = await fetch(`/api/admin/payments/${encodeURIComponent(id)}`, { cache: 'no-store', signal })
      if (!response.ok) throw new Error(await responseError(response))
      const result = await response.json() as PaymentDetailResponse
      if (!result.payment?.id) throw new Error('The payment request could not be read.')
      if (!signal?.aborted) setData(result)
    } catch (cause) {
      if (!signal?.aborted) setLoadError(cause instanceof Error ? cause.message : 'Could not load this payment request.')
    } finally { if (!signal?.aborted) setLoading(false) }
  }, [id])

  useEffect(() => {
    const controller = new AbortController()
    void load(controller.signal)
    return () => controller.abort()
  }, [load])

  useEffect(() => {
    const shareUrl = data?.payment.shareUrl
    setQrUrl('')
    setQrError('')
    if (!shareUrl) return
    let cancelled = false
    void QRCode.toDataURL(shareUrl, { width: 900, margin: 4, errorCorrectionLevel: 'M', color: { dark: '#242349', light: '#ffffff' } })
      .then((url) => { if (!cancelled) setQrUrl(url) })
      .catch(() => { if (!cancelled) setQrError('The QR code could not be prepared. You can still use the link.') })
    return () => { cancelled = true }
  }, [data?.payment.shareUrl, qrAttempt])

  useEffect(() => {
    if (!confirmingCancel) return
    const dialog = cancelDialogRef.current
    if (!dialog) return
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : cancelTriggerRef.current
    const fallbackFocus = refreshButtonRef.current
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        if (!inFlight.current) setConfirmingCancel(false)
        return
      }
      if (event.key !== 'Tab') return
      const buttons = Array.from(dialog!.querySelectorAll<HTMLButtonElement>('button:not([disabled])'))
      const first = buttons[0]
      const last = buttons.at(-1)
      if (!first || !last) { event.preventDefault(); dialog!.focus(); return }
      if (!dialog!.contains(document.activeElement)) { event.preventDefault(); first.focus() }
      else if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }

    document.addEventListener('keydown', onKeyDown)
    keepLinkRef.current?.focus()
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
      if (previousFocus?.isConnected) previousFocus.focus()
      else fallbackFocus?.focus()
    }
  }, [confirmingCancel])

  async function runAction(action: 'refresh' | 'cancel') {
    if (inFlight.current) return
    inFlight.current = true
    setBusy(action)
    setActionError('')
    setMessage('')
    try {
      const response = await fetch(`/api/admin/payments/${encodeURIComponent(id)}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action }) })
      if (!response.ok) throw new Error(await responseError(response))
      const result = await response.json() as PaymentDetailResponse
      if (!result.payment?.id) throw new Error('The status response was incomplete. Refresh this page to check the request.')
      setData(result)
      setMessage(action === 'cancel' ? 'Payment link cancelled.' : 'Provider status checked and request updated.')
      if (action === 'cancel') setConfirmingCancel(false)
    } catch (cause) { setActionError(cause instanceof Error ? cause.message : 'Could not update payment status.') }
    finally { setBusy(null); inFlight.current = false }
  }

  async function copyLink() {
    if (!data?.payment.shareUrl) return
    try { await navigator.clipboard.writeText(data.payment.shareUrl); setMessage('Payment link copied.'); setActionError('') }
    catch { setActionError('Could not copy automatically. Select the link and copy it manually.') }
  }

  if (loading && !data) return <main className={styles.page}><div className={styles.state} role="status">Loading payment request…</div></main>
  if (loadError && !data) return <main className={styles.page}><div className={styles.breadcrumb}><Link href="/admin/cms/payments">Payments</Link></div><div className={styles.error} role="alert"><CircleAlert size={21} aria-hidden="true" /><div><strong>Could not open this request</strong><p>{loadError}</p><button type="button" className={styles.secondaryButton} onClick={() => void load()}>Try again</button></div></div></main>
  if (!data) return null

  const { payment, configuration } = data
  const stripe = configuration.gateways.find((gateway) => gateway.id === payment.gateway)
  const gatewayReady = Boolean(stripe?.ready && payment.mode === configuration.mode)
  const isOpen = payment.status === 'pending' || payment.status === 'processing' || payment.status === 'needs_review'

  return <main className={styles.page}>
    <div className={styles.breadcrumb}><Link href="/admin/cms/payments">Payments</Link><span aria-hidden="true">/</span><span>{payment.title}</span></div>
    <header className={styles.header}><div className={styles.headerCopy}><span className={styles.eyebrow}>Payment request</span><h1 className={styles.title}>Request details</h1><p className={styles.subtitle}>Amounts and request details are fixed after creation. Cancel and create a new link if they need to change.</p></div><Link className={styles.secondaryButton} href="/admin/cms/payments"><ArrowLeft size={18} aria-hidden="true" />Back to history</Link></header>
    <section className={styles.detailHero} aria-label="Payment summary"><div><span className={`${styles.status} ${styles[payment.status]}`}>{statusLabels[payment.status]}</span><h2>{payment.title}</h2><p>{payment.kind === 'service' ? 'Service payment' : 'Product payment'} · {payment.gateway === 'stripe' ? 'Stripe' : 'Merchant iPay'}{payment.mode === 'test' ? ' · Test mode' : ''}</p></div><strong className={styles.heroAmount}>{money(payment.amountMinor)}</strong></section>
    {(!gatewayReady || !configuration.linksShareable || payment.mode === 'test') && <div className={styles.banner} role="status"><CircleAlert size={21} aria-hidden="true" /><div><strong>{!gatewayReady ? 'Customer checkout is unavailable' : payment.mode === 'test' ? 'Test mode is active' : 'Local preview only'}</strong><p>{payment.mode !== configuration.mode ? 'This request was created in a different Stripe mode. Create a new request in the current mode before accepting payment.' : !gatewayReady ? 'Stripe setup is incomplete. The request is saved, but the customer cannot pay until setup is complete.' : payment.mode === 'test' ? 'Use this request only for test payments.' : 'The public website URL is not configured. Do not share this local link with a customer.'}</p>{configuration.configurationIssues.length > 0 && <p>{configuration.configurationIssues.join(' ')}</p>}</div></div>}
    {actionError && <div className={styles.error} role="alert"><CircleAlert size={21} aria-hidden="true" /><div><strong>Action did not complete</strong><p>{actionError}</p></div></div>}
    {message && <div className={styles.success} role="status"><Check size={21} aria-hidden="true" /><div><strong>{message}</strong></div></div>}
    <div className={styles.detailLayout}><div className={styles.mainColumn}>
      <section className={styles.panel}><div className={styles.panelHead}><div><h2>Request information</h2><p>Use these details to match the payment with your work.</p></div></div><div className={styles.panelBody}>{payment.description && <p className={styles.description}>{payment.description}</p>}<dl className={styles.detailFacts}><div className={styles.fact}><dt>Amount</dt><dd>{money(payment.amountMinor)} · THB</dd></div><div className={styles.fact}><dt>Status</dt><dd>{statusLabels[payment.status]}</dd></div><div className={styles.fact}><dt>Created</dt><dd>{dateTime(payment.createdAt)}</dd></div><div className={styles.fact}><dt>Expires</dt><dd>{dateTime(payment.expiresAt)}</dd></div>{payment.paidAt && <div className={styles.fact}><dt>Paid</dt><dd>{dateTime(payment.paidAt)}</dd></div>}<div className={styles.fact}><dt>Customer name</dt><dd>{payment.customerName || '—'}</dd></div><div className={styles.fact}><dt>Customer email</dt><dd>{payment.customerEmail || '—'}</dd></div><div className={styles.fact}><dt>Reference</dt><dd>{payment.reference || '—'}</dd></div></dl></div></section>
      {payment.internalNote && <section className={styles.panel}><div className={styles.panelHead}><div><h2>Internal note</h2><p>Visible only to staff in the CMS.</p></div></div><div className={styles.panelBody}><p className={styles.description}>{payment.internalNote}</p></div></section>}
      <section className={styles.panel}><div className={styles.panelHead}><div><h2>Payment status</h2><p>Refresh the provider status before following up with a customer.</p></div></div><div className={styles.panelBody}><div className={styles.actionGroup}><button type="button" ref={refreshButtonRef} className={styles.secondaryButton} disabled={busy !== null} onClick={() => void runAction('refresh')}><RefreshCw size={18} aria-hidden="true" />{busy === 'refresh' ? 'Checking status…' : 'Refresh provider status'}</button>{payment.canCancel && <button type="button" ref={cancelTriggerRef} className={styles.dangerButton} disabled={busy !== null} onClick={() => { setActionError(''); setConfirmingCancel(true) }}><XCircle size={18} aria-hidden="true" />{busy === 'cancel' ? 'Cancelling…' : 'Cancel link'}</button>}</div><p className={styles.helper}>{isOpen ? 'Cancelling closes the link for new checkout. It does not refund a payment.' : 'This request is closed to new checkout.'}</p></div></section>
    </div><aside className={styles.sideColumn}><section className={styles.panel}><div className={styles.panelHead}><div><h2>Share this link</h2><p>Copy the link or send the QR code.</p></div></div><div className={styles.panelBody}><div className={styles.sharePanel}>{payment.shareUrl ? <><div className={styles.linkWrap}><label className={styles.srOnly} htmlFor="payment-share-url">Payment URL</label><input id="payment-share-url" className={styles.linkField} readOnly value={payment.shareUrl} onFocus={(event) => event.target.select()} /><button type="button" className={styles.secondaryButton} onClick={() => void copyLink()}><Copy size={18} aria-hidden="true" />Copy</button></div>{!configuration.linksShareable && <p className={styles.shareHint}><CircleAlert size={17} aria-hidden="true" /> Local preview only. Configure a public site URL before sharing.</p>}{qrUrl ? <div className={styles.qrBox}><Image unoptimized src={qrUrl} width={900} height={900} alt="QR code for this payment link" /></div> : qrError ? <div className={styles.error} role="alert"><CircleAlert size={18} aria-hidden="true" /><div><strong>QR code unavailable</strong><p>{qrError}</p><button type="button" className={styles.secondaryButton} onClick={() => setQrAttempt((count) => count + 1)}>Retry QR code</button></div></div> : <p className={styles.helper}>Preparing QR code…</p>}<div className={styles.actionGroup}>{qrUrl ? <a className={styles.secondaryButton} href={qrUrl} download={`vetra-payment-${payment.id}.png`}><Download size={18} aria-hidden="true" />Download PNG</a> : <button type="button" className={styles.secondaryButton} disabled><Download size={18} aria-hidden="true" />Download PNG</button>}<a className={styles.secondaryButton} href={payment.shareUrl} target="_blank" rel="noopener noreferrer"><ExternalLink size={18} aria-hidden="true" />Preview page</a></div><p className={styles.shareHint}>The QR code opens the same payment page as the link. Payment status is checked by the server.</p></> : <div className={styles.empty}><CircleAlert size={27} aria-hidden="true" /><h3>Link is unavailable</h3><p>Configure the public website URL, then reload this request to get its link and QR code.</p></div>}</div></div></section><Link className={styles.quietButton} href="/admin/cms/payments/new">Create another request <ArrowUpRight size={17} aria-hidden="true" /></Link></aside></div>
    {confirmingCancel && <div className={styles.dialogOverlay}>
      <div ref={cancelDialogRef} className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="cancel-payment-title" aria-describedby="cancel-payment-description" tabIndex={-1}>
        <span className={styles.dialogIcon}><XCircle size={25} aria-hidden="true" /></span>
        <h2 id="cancel-payment-title">Cancel this payment link?</h2>
        <p id="cancel-payment-description">The customer will no longer be able to start checkout from this link. A payment already in progress may still complete. Cancelling does not issue a refund.</p>
        {actionError && <p className={styles.dialogError} role="alert">{actionError}</p>}
        <div className={styles.dialogActions}>
          <button ref={keepLinkRef} type="button" className={styles.secondaryButton} disabled={busy !== null} onClick={() => setConfirmingCancel(false)}>Keep link</button>
          <button type="button" className={styles.dangerButton} disabled={busy !== null} onClick={() => void runAction('cancel')}>{busy === 'cancel' ? 'Cancelling…' : 'Cancel link'}</button>
        </div>
      </div>
    </div>}
  </main>
}
