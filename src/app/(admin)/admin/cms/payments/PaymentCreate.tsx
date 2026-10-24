'use client'

import { useEffect, useRef, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, CircleAlert, CreditCard, FileText, LockKeyhole, Package } from 'lucide-react'
import type { PaymentConfiguration, PaymentDetailResponse, PaymentListResponse } from '@/lib/payments/types'
import { createPaymentSchema, parsePaymentAmount, type CreatePaymentInput } from '@/lib/payments/validation'
import { money, responseError, paymentMessage } from './paymentUi'
import { useCmsI18n } from '@/components/cms/CmsLanguageProvider'
import PaymentPresets from './PaymentPresets'
import styles from './payments.module.css'

type Fields = Omit<CreatePaymentInput, 'idempotencyKey'>
const INITIAL: Fields = { gateway: 'stripe', kind: 'service', title: '', description: '', amount: '', customerName: '', customerEmail: '', reference: '', internalNote: '', expiresInDays: 30 }

export default function PaymentCreate() {
  const { locale, intlLocale, t, formatNumber } = useCmsI18n()
  const router = useRouter()
  const [fields, setFields] = useState<Fields>(INITIAL)
  const [configuration, setConfiguration] = useState<PaymentConfiguration | null>(null)
  const [configurationError, setConfigurationError] = useState('')
  const [configurationLoading, setConfigurationLoading] = useState(true)
  const [configurationAttempt, setConfigurationAttempt] = useState(0)
  const [busy, setBusy] = useState(false)
  const [presetSaving, setPresetSaving] = useState(false)
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
    if (inFlight.current || presetSaving) return
    if (!configuration || configurationLoading) { reportError('Wait for the payment mode and setup check to finish.'); return }
    let payload = snapshot.current
    if (!payload) {
      const candidate = { ...fields, idempotencyKey: crypto.randomUUID() }
      const validation = createPaymentSchema.safeParse(candidate)
      if (!validation.success) {
        const issue = validation.error.issues[0]
        reportError(issue?.path[0] === 'customerEmail' ? 'Enter a valid customer email.' : issue?.path[0] === 'title' ? 'Enter a title with 1–160 characters.' : 'Check the payment details.')
        return
      }
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
  const requestTitle = fields.title.trim() || t("New payment request", "รายการเรียกเก็บเงินใหม่")
  const requestAmount = amountMinor ? money(amountMinor, intlLocale) : '฿—'
  const submitDisabled = presetSaving || busy || configurationLoading || !configuration
  const submitLabel = busy ? t("Creating request…", "กำลังสร้างรายการ…") : configurationLoading ? t("Checking setup…", "กำลังตรวจสอบการตั้งค่า…") : !configuration ? t("Payment setup unavailable", "ยังตรวจสอบการตั้งค่าไม่ได้") : locked ? t("Retry same request", "ลองส่งคำขอเดิมอีกครั้ง") : t("Create", "สร้าง")

  return <main className={styles.page}>
    <div className={styles.breadcrumb}><Link href="/admin/cms/payments">{t("Payments", "การชำระเงิน")}</Link><span aria-hidden="true">/</span><span>{t("New request", "รายการใหม่")}</span></div>
    <header className={styles.header}><div className={styles.headerCopy}><span className={styles.eyebrow}>{t("New payment request", "รายการเรียกเก็บเงินใหม่")}</span><h1 className={styles.title}>{t("Create a payment link", "สร้างลิงก์ชำระเงิน")}</h1><p className={styles.subtitle}>{t("Enter the agreed amount and details. The request is saved immediately, and its amount cannot be edited later.", "กรอกยอดเงินและรายละเอียดที่ตกลงไว้ ระบบจะบันทึกรายการทันที และไม่สามารถแก้ไขยอดเงินภายหลังได้")}</p></div><Link className={styles.secondaryButton} href="/admin/cms/payments"><ArrowLeft size={18} aria-hidden="true" />{t("Back to history", "กลับไปประวัติรายการ")}</Link></header>
    {configurationError && <div className={styles.error} role="alert"><CircleAlert size={21} aria-hidden="true" /><div><strong>{t("Could not check payment setup", "ตรวจสอบการตั้งค่าการชำระเงินไม่สำเร็จ")}</strong><p>{paymentMessage(configurationError, locale)}</p><button type="button" className={styles.secondaryButton} onClick={() => setConfigurationAttempt((count) => count + 1)}>{t("Try again", "ลองอีกครั้ง")}</button></div></div>}
    {error && <div ref={errorRef} tabIndex={-1} className={styles.error} role="alert"><CircleAlert size={21} aria-hidden="true" /><div><strong>{t("Payment request was not confirmed", "ยังยืนยันรายการเรียกเก็บเงินไม่ได้")}</strong><p>{paymentMessage(error, locale)}</p></div></div>}
    <form className={styles.formLayout} onSubmit={(event) => void create(event)}>
      <div className={styles.mainColumn}>
        <PaymentPresets fields={fields} disabled={locked || busy} onApply={(details) => { setFields({ ...details }); setError('') }} onSavingChange={setPresetSaving} />
        <section className={styles.panel} aria-label={t("Payment details", "รายละเอียดการชำระเงิน")}><div className={styles.panelBody}>
          <fieldset disabled={locked || busy} className={styles.choiceGrid} style={{ border: 0 }}><legend className={styles.srOnly}>{t("Payment kind", "ประเภทรายการชำระเงิน")}</legend><label className={styles.choice}><input type="radio" name="kind" checked={fields.kind === 'service'} onChange={() => update('kind', 'service')} /><FileText size={21} color="var(--cms-accent)" aria-hidden="true" /><span className={styles.choiceCopy}><strong>{t("Service", "บริการ")}</strong><small>{t("Consulting, design, or project work", "ค่าที่ปรึกษา งานออกแบบ หรืองานโครงการ")}</small></span></label><label className={styles.choice}><input type="radio" name="kind" checked={fields.kind === 'product'} onChange={() => update('kind', 'product')} /><Package size={21} color="var(--cms-accent)" aria-hidden="true" /><span className={styles.choiceCopy}><strong>{t("Product", "สินค้า")}</strong><small>{t("A single product or agreed order", "สินค้าเดี่ยวหรือคำสั่งซื้อที่ตกลงไว้")}</small></span></label></fieldset>
          <label className={styles.field}><span>{t("Title", "ชื่อรายการ")} <em>{t("Required", "จำเป็น")}</em></span><input required maxLength={160} value={fields.title} disabled={locked || busy} onChange={(event) => update('title', event.target.value)} placeholder={t("e.g. Website design deposit", "เช่น เงินมัดจำงานออกแบบเว็บไซต์")} /></label>
          <label className={styles.field}><span>{t("Description", "รายละเอียด")}</span><textarea maxLength={2000} value={fields.description} disabled={locked || busy} onChange={(event) => update('description', event.target.value)} placeholder={t("What is this payment for?", "รายการนี้ชำระเงินสำหรับอะไร")} /><small>{t("This appears on the payment page.", "ข้อความนี้จะแสดงบนหน้าชำระเงิน")}</small></label>
          <label className={styles.field}><span>{t("Amount", "ยอดเงิน")} <em>{t("Required", "จำเป็น")}</em></span><div className={styles.amountWrap}><span>฿</span><input required inputMode="decimal" autoComplete="off" placeholder="0.00" value={fields.amount} disabled={locked || busy} onChange={(event) => update('amount', event.target.value)} aria-label={t("Amount in Thai baht", "จำนวนเงินในหน่วยบาท")} /></div><small>{t("THB 10.00–999,999.99. Up to two decimal places.", "10.00–999,999.99 บาท ทศนิยมไม่เกิน 2 ตำแหน่ง")}</small></label>
        </div></section>
        <section className={styles.panel} aria-label={t("Payment gateway", "ช่องทางชำระเงิน")}><div className={styles.panelBody}><fieldset disabled={locked || busy} className={styles.choiceGrid} style={{ border: 0 }}><legend className={styles.srOnly}>{t("Payment gateway", "ช่องทางชำระเงิน")}</legend><label className={styles.choice}><input type="radio" name="gateway" checked readOnly /><CreditCard size={21} color="var(--cms-accent)" aria-hidden="true" /><span className={styles.choiceCopy}><strong>Stripe</strong><small>{stripe?.ready ? t("Ready for payment", "พร้อมรับชำระเงิน") : t("Link creation available; checkout setup incomplete", "สร้างลิงก์ได้ แต่ยังตั้งค่ารับชำระเงินไม่ครบ")}</small></span></label><label className={styles.choice}><input type="radio" name="gateway" disabled /><LockKeyhole size={21} aria-hidden="true" /><span className={styles.choiceCopy}><strong>Merchant iPay</strong><small>{t("Coming soon", "เตรียมเปิดให้บริการ")}</small></span></label></fieldset></div></section>
        <section className={styles.panel} aria-label={t("Customer and reference", "ลูกค้าและข้อมูลอ้างอิง")}><div className={styles.panelBody}><div className={styles.fieldGrid}><label className={styles.field}><span>{t("Customer name", "ชื่อลูกค้า")}</span><input maxLength={120} value={fields.customerName} disabled={locked || busy} onChange={(event) => update('customerName', event.target.value)} autoComplete="name" /></label><label className={styles.field}><span>{t("Customer email", "อีเมลลูกค้า")}</span><input type="email" maxLength={254} value={fields.customerEmail} disabled={locked || busy} onChange={(event) => update('customerEmail', event.target.value)} autoComplete="email" /></label></div><label className={styles.field}><span>{t("Reference", "เลขอ้างอิง")}</span><input maxLength={80} value={fields.reference} disabled={locked || busy} onChange={(event) => update('reference', event.target.value)} placeholder={t("e.g. Quote or order number", "เช่น เลขใบเสนอราคาหรือเลขคำสั่งซื้อ")} /><small>{t("The reference can appear on the payment page. Avoid private information.", "เลขอ้างอิงอาจแสดงบนหน้าชำระเงิน กรุณาหลีกเลี่ยงข้อมูลส่วนตัว")}</small></label><label className={styles.field}><span>{t("Internal note", "บันทึกภายใน")}</span><textarea maxLength={1000} value={fields.internalNote} disabled={locked || busy} onChange={(event) => update('internalNote', event.target.value)} placeholder={t("Only visible to staff in the CMS", "แสดงเฉพาะเจ้าหน้าที่ใน CMS")} /></label></div></section>
        <section className={styles.panel} aria-label={t("Link lifetime", "อายุของลิงก์")}><div className={styles.panelBody}><fieldset className={styles.expiryGrid} disabled={locked || busy} style={{ border: 0 }}><legend className={styles.srOnly}>{t("Expiry period", "ระยะเวลาก่อนหมดอายุ")}</legend>{([7, 14, 30, 90] as const).map((days) => <label key={days} className={styles.expiryChoice}><input type="radio" name="expiry" checked={fields.expiresInDays === days} onChange={() => update('expiresInDays', days)} /><strong>{formatNumber(days)}</strong><span>{t("days", "วัน")}</span></label>)}</fieldset></div></section>
      </div>
      <aside className={styles.sideColumn}><div className={styles.summary}><span className={styles.summaryLabel}>{t("Request summary", "สรุปรายการ")}</span><h2>{requestTitle}</h2><strong className={styles.summaryAmount}>{requestAmount}</strong><div className={styles.summaryLine}><span>{t("Type", "ประเภท")}</span><strong>{fields.kind === 'service' ? t("Service", "บริการ") : t("Product", "สินค้า")}</strong></div><div className={styles.summaryLine}><span>{t("Gateway", "ช่องทาง")}</span><strong>Stripe</strong></div><div className={styles.summaryLine}><span>{t("Mode", "โหมด")}</span><strong>{configuration?.mode === "test" ? t("Test", "ทดสอบ") : configuration?.mode === "live" ? t("Live", "ใช้งานจริง") : t("Checking…", "กำลังตรวจสอบ…")}</strong></div><div className={styles.summaryLine}><span>{t("Expires after", "หมดอายุภายใน")}</span><strong>{formatNumber(fields.expiresInDays)} {t("days", "วัน")}</strong></div><p className={styles.summaryNote}>{t("Creating this request saves it immediately. You can share the link and QR code from the next screen.", "ระบบจะบันทึกรายการนี้ทันทีที่สร้าง คุณสามารถส่งลิงก์และ QR Code จากหน้าถัดไป")}</p><button type="submit" className={styles.primaryButton} disabled={submitDisabled}>{submitLabel}</button>{locked && <p className={styles.helper}>{t("These exact details and the same request key will be used for the retry.", "การลองอีกครั้งจะใช้ข้อมูลและรหัสคำขอเดิมทั้งหมด")}</p>}</div></aside>
      <div className={styles.createDock} role="group" aria-label={t("Create payment request", "สร้างรายการเรียกเก็บเงิน")}>
        <div className={styles.createDockInfo}>
          <strong className={styles.createDockTitle} title={requestTitle}><span className={styles.srOnly}>{t("Title", "ชื่อรายการ")}: </span>{requestTitle}</strong>
        </div>
        <div className={styles.createDockActions}>
          <span className={styles.createDockAmount}><span className={styles.srOnly}>{t("Amount", "ยอดเงิน")}: </span>{requestAmount}</span>
          <p className={styles.createDockMeta}><span className={styles.srOnly}>{t("Expires after", "หมดอายุภายใน")}: </span>{formatNumber(fields.expiresInDays)} {t("days", "วัน")}</p>
          <button type="submit" className={styles.primaryButton} disabled={submitDisabled}>{submitLabel}</button>
        </div>
      </div>
    </form>
  </main>
}
