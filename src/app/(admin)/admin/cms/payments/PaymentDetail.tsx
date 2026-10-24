'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import QRCode from 'qrcode'
import { ArrowLeft, ArrowUpRight, Check, CircleAlert, Copy, Download, ExternalLink, RefreshCw, XCircle } from 'lucide-react'
import type { PaymentDetailResponse } from '@/lib/payments/types'
import { dateTime, money, responseError, paymentStatusLabel, paymentMessage } from './paymentUi'
import { useCmsI18n } from '@/components/cms/CmsLanguageProvider'
import styles from './payments.module.css'

export default function PaymentDetail({ id }: { id: string }) {
  const { locale, intlLocale, t } = useCmsI18n()
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

  if (loading && !data) return <main className={styles.page}><div className={styles.state} role="status">{t("Loading payment request…", "กำลังโหลดรายการเรียกเก็บเงิน…")}</div></main>
  if (loadError && !data) return <main className={styles.page}><div className={styles.breadcrumb}><Link href="/admin/cms/payments">{t("Payments", "การชำระเงิน")}</Link></div><div className={styles.error} role="alert"><CircleAlert size={21} aria-hidden="true" /><div><strong>{t("Could not open this request", "เปิดรายการนี้ไม่สำเร็จ")}</strong><p>{paymentMessage(loadError, locale)}</p><button type="button" className={styles.secondaryButton} onClick={() => void load()}>{t("Try again", "ลองอีกครั้ง")}</button></div></div></main>
  if (!data) return null

  const { payment, configuration } = data
  const stripe = configuration.gateways.find((gateway) => gateway.id === payment.gateway)
  const gatewayReady = Boolean(stripe?.ready && payment.mode === configuration.mode)
  const isOpen = payment.status === 'pending' || payment.status === 'processing' || payment.status === 'needs_review'

  return <main className={styles.page}>
    <div className={styles.breadcrumb}><Link href="/admin/cms/payments">{t("Payments", "การชำระเงิน")}</Link><span aria-hidden="true">/</span><span>{payment.title}</span></div>
    <header className={styles.header}><div className={styles.headerCopy}><span className={styles.eyebrow}>{t("Payment request", "รายการเรียกเก็บเงิน")}</span><h1 className={styles.title}>{t("Request details", "รายละเอียดรายการ")}</h1><p className={styles.subtitle}>{t("Amounts and request details are fixed after creation. Cancel and create a new link if they need to change.", "ยอดเงินและรายละเอียดแก้ไขไม่ได้หลังสร้างรายการ หากต้องการเปลี่ยนให้ยกเลิกและสร้างลิงก์ใหม่")}</p></div><Link className={styles.secondaryButton} href="/admin/cms/payments"><ArrowLeft size={18} aria-hidden="true" />{t("Back to history", "กลับไปประวัติรายการ")}</Link></header>
    <section className={styles.detailHero} aria-label={t("Payment summary", "สรุปการชำระเงิน")}><div><span className={`${styles.status} ${styles[payment.status]}`}>{paymentStatusLabel(payment.status, locale)}</span><h2>{payment.title}</h2><p>{payment.kind === 'service' ? t("Service payment", "ชำระค่าบริการ") : t("Product payment", "ชำระค่าสินค้า")} · {payment.gateway === 'stripe' ? 'Stripe' : 'Merchant iPay'}{payment.mode === 'test' ? t(" · Test mode", " · โหมดทดสอบ") : ''}</p></div><strong className={styles.heroAmount}>{money(payment.amountMinor, intlLocale)}</strong></section>
    {(!gatewayReady || !configuration.linksShareable || payment.mode === 'test') && <div className={styles.banner} role="status"><CircleAlert size={21} aria-hidden="true" /><div><strong>{!gatewayReady ? t("Customer checkout is unavailable", "ลูกค้ายังเริ่มชำระเงินไม่ได้") : payment.mode === 'test' ? t("Test mode is active", "กำลังใช้โหมดทดสอบ") : t("Local preview only", "ดูตัวอย่างบนเครื่องนี้เท่านั้น")}</strong><p>{payment.mode !== configuration.mode ? t("This request was created in a different Stripe mode. Create a new request in the current mode before accepting payment.", "รายการนี้สร้างในโหมด Stripe ที่ต่างจากโหมดปัจจุบัน กรุณาสร้างรายการใหม่ในโหมดปัจจุบันก่อนรับชำระเงิน") : !gatewayReady ? t("Stripe setup is incomplete. The request is saved, but the customer cannot pay until setup is complete.", "ยังตั้งค่า Stripe ไม่ครบ รายการบันทึกแล้ว แต่ลูกค้าจะชำระเงินได้เมื่อตั้งค่าเสร็จ") : payment.mode === 'test' ? t("Use this request only for test payments.", "ใช้รายการนี้สำหรับทดสอบการชำระเงินเท่านั้น") : t("The public website URL is not configured. Do not share this local link with a customer.", "ยังไม่ได้ตั้งค่า URL เว็บไซต์สาธารณะ กรุณาอย่าส่งลิงก์ภายในเครื่องนี้ให้ลูกค้า")}</p>{configuration.configurationIssues.length > 0 && <p>{configuration.configurationIssues.map((issue) => paymentMessage(issue, locale)).join(' ')}</p>}</div></div>}
    {actionError && <div className={styles.error} role="alert"><CircleAlert size={21} aria-hidden="true" /><div><strong>{t("Action did not complete", "ดำเนินการไม่สำเร็จ")}</strong><p>{paymentMessage(actionError, locale)}</p></div></div>}
    {message && <div className={styles.success} role="status"><Check size={21} aria-hidden="true" /><div><strong>{paymentMessage(message, locale)}</strong></div></div>}
    <div className={styles.detailLayout}><div className={styles.mainColumn}>
      <section className={styles.panel}><div className={styles.panelHead}><div><h2>{t("Request information", "ข้อมูลรายการ")}</h2><p>{t("Use these details to match the payment with your work.", "ใช้ข้อมูลเหล่านี้เพื่อตรวจสอบการชำระเงินให้ตรงกับงานของคุณ")}</p></div></div><div className={styles.panelBody}>{payment.description && <p className={styles.description}>{payment.description}</p>}<dl className={styles.detailFacts}><div className={styles.fact}><dt>{t("Amount", "ยอดเงิน")}</dt><dd>{money(payment.amountMinor, intlLocale)} · THB</dd></div><div className={styles.fact}><dt>{t("Status", "สถานะ")}</dt><dd>{paymentStatusLabel(payment.status, locale)}</dd></div><div className={styles.fact}><dt>{t("Created", "สร้างเมื่อ")}</dt><dd>{dateTime(payment.createdAt, intlLocale)}</dd></div><div className={styles.fact}><dt>{t("Expires", "หมดอายุ")}</dt><dd>{dateTime(payment.expiresAt, intlLocale)}</dd></div>{payment.paidAt && <div className={styles.fact}><dt>{t("Paid", "ชำระแล้ว")}</dt><dd>{dateTime(payment.paidAt, intlLocale)}</dd></div>}<div className={styles.fact}><dt>{t("Customer name", "ชื่อลูกค้า")}</dt><dd>{payment.customerName || '—'}</dd></div><div className={styles.fact}><dt>{t("Customer email", "อีเมลลูกค้า")}</dt><dd>{payment.customerEmail || '—'}</dd></div><div className={styles.fact}><dt>{t("Reference", "เลขอ้างอิง")}</dt><dd>{payment.reference || '—'}</dd></div></dl></div></section>
      {payment.internalNote && <section className={styles.panel}><div className={styles.panelHead}><div><h2>{t("Internal note", "บันทึกภายใน")}</h2><p>{t("Visible only to staff in the CMS.", "แสดงเฉพาะเจ้าหน้าที่ใน CMS")}</p></div></div><div className={styles.panelBody}><p className={styles.description}>{payment.internalNote}</p></div></section>}
      <section className={styles.panel}><div className={styles.panelHead}><div><h2>{t("Payment status", "สถานะการชำระเงิน")}</h2><p>{t("Refresh the provider status before following up with a customer.", "ตรวจสอบสถานะล่าสุดจากผู้ให้บริการก่อนติดตามกับลูกค้า")}</p></div></div><div className={styles.panelBody}><div className={styles.actionGroup}><button type="button" ref={refreshButtonRef} className={styles.secondaryButton} disabled={busy !== null} onClick={() => void runAction('refresh')}><RefreshCw size={18} aria-hidden="true" />{busy === 'refresh' ? t("Checking status…", "กำลังตรวจสอบสถานะ…") : t("Refresh provider status", "ตรวจสอบสถานะจากผู้ให้บริการ")}</button>{payment.canCancel && <button type="button" ref={cancelTriggerRef} className={styles.dangerButton} disabled={busy !== null} onClick={() => { setActionError(''); setConfirmingCancel(true) }}><XCircle size={18} aria-hidden="true" />{busy === 'cancel' ? t("Cancelling…", "กำลังยกเลิก…") : t("Cancel link", "ยกเลิกลิงก์")}</button>}</div><p className={styles.helper}>{isOpen ? t("Cancelling closes the link for new checkout. It does not refund a payment.", "การยกเลิกจะปิดลิงก์สำหรับเริ่มชำระเงินใหม่ โดยไม่ได้คืนเงินที่ชำระแล้ว") : t("This request is closed to new checkout.", "รายการนี้ไม่เปิดให้เริ่มชำระเงินใหม่แล้ว")}</p></div></section>
    </div><aside className={styles.sideColumn}><section className={styles.panel}><div className={styles.panelHead}><div><h2>{t("Share this link", "ส่งลิงก์นี้")}</h2><p>{t("Copy the link or send the QR code.", "คัดลอกลิงก์หรือส่ง QR Code")}</p></div></div><div className={styles.panelBody}><div className={styles.sharePanel}>{payment.shareUrl ? <><div className={styles.linkWrap}><label className={styles.srOnly} htmlFor="payment-share-url">{t("Payment URL", "URL ชำระเงิน")}</label><input id="payment-share-url" className={styles.linkField} readOnly value={payment.shareUrl} onFocus={(event) => event.target.select()} /><button type="button" className={styles.secondaryButton} onClick={() => void copyLink()}><Copy size={18} aria-hidden="true" />{t("Copy", "คัดลอก")}</button></div>{!configuration.linksShareable && <p className={styles.shareHint}><CircleAlert size={17} aria-hidden="true" /> {t("Local preview only. Configure a public site URL before sharing.", "ดูตัวอย่างบนเครื่องนี้เท่านั้น กรุณาตั้งค่า URL เว็บไซต์สาธารณะก่อนส่งลิงก์")}</p>}{qrUrl ? <div className={styles.qrBox}><Image unoptimized src={qrUrl} width={900} height={900} alt={t("QR code for this payment link", "QR Code สำหรับลิงก์ชำระเงินนี้")} /></div> : qrError ? <div className={styles.error} role="alert"><CircleAlert size={18} aria-hidden="true" /><div><strong>{t("QR code unavailable", "ยังไม่มี QR Code")}</strong><p>{paymentMessage(qrError, locale)}</p><button type="button" className={styles.secondaryButton} onClick={() => setQrAttempt((count) => count + 1)}>{t("Retry QR code", "สร้าง QR Code อีกครั้ง")}</button></div></div> : <p className={styles.helper}>{t("Preparing QR code…", "กำลังสร้าง QR Code…")}</p>}<div className={styles.actionGroup}>{qrUrl ? <a className={styles.secondaryButton} href={qrUrl} download={`vetra-payment-${payment.id}.png`}><Download size={18} aria-hidden="true" />{t("Download PNG", "ดาวน์โหลด PNG")}</a> : <button type="button" className={styles.secondaryButton} disabled><Download size={18} aria-hidden="true" />{t("Download PNG", "ดาวน์โหลด PNG")}</button>}<a className={styles.secondaryButton} href={payment.shareUrl} target="_blank" rel="noopener noreferrer"><ExternalLink size={18} aria-hidden="true" />{t("Preview page", "ดูตัวอย่างหน้า")}</a></div><p className={styles.shareHint}>{t("The QR code opens the same payment page as the link. Payment status is checked by the server.", "QR Code จะเปิดหน้าชำระเงินเดียวกับลิงก์ ระบบจะตรวจสอบสถานะการชำระเงินจากเซิร์ฟเวอร์")}</p></> : <div className={styles.empty}><CircleAlert size={27} aria-hidden="true" /><h3>{t("Link is unavailable", "ยังไม่มีลิงก์")}</h3><p>{t("Configure the public website URL, then reload this request to get its link and QR code.", "ตั้งค่า URL เว็บไซต์สาธารณะ แล้วโหลดรายการนี้ใหม่เพื่อรับลิงก์และ QR Code")}</p></div>}</div></div></section><Link className={styles.quietButton} href="/admin/cms/payments/new">{t("Create another request", "สร้างรายการใหม่")} <ArrowUpRight size={17} aria-hidden="true" /></Link></aside></div>
    {confirmingCancel && <div className={styles.dialogOverlay}>
      <div ref={cancelDialogRef} className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="cancel-payment-title" aria-describedby="cancel-payment-description" tabIndex={-1}>
        <span className={styles.dialogIcon}><XCircle size={25} aria-hidden="true" /></span>
        <h2 id="cancel-payment-title">{t("Cancel this payment link?", "ยกเลิกลิงก์ชำระเงินนี้หรือไม่")}</h2>
        <p id="cancel-payment-description">{t("The customer will no longer be able to start checkout from this link. A payment already in progress may still complete. Cancelling does not issue a refund.", "ลูกค้าจะเริ่มชำระเงินจากลิงก์นี้ไม่ได้อีก การชำระเงินที่เริ่มแล้วอาจยังสำเร็จได้ การยกเลิกนี้จะไม่คืนเงิน")}</p>
        {actionError && <p className={styles.dialogError} role="alert">{paymentMessage(actionError, locale)}</p>}
        <div className={styles.dialogActions}>
          <button ref={keepLinkRef} type="button" className={styles.secondaryButton} disabled={busy !== null} onClick={() => setConfirmingCancel(false)}>{t("Keep link", "เก็บลิงก์ไว้")}</button>
          <button type="button" className={styles.dangerButton} disabled={busy !== null} onClick={() => void runAction('cancel')}>{busy === 'cancel' ? t("Cancelling…", "กำลังยกเลิก…") : t("Cancel link", "ยกเลิกลิงก์")}</button>
        </div>
      </div>
    </div>}
  </main>
}
