'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { ArrowUpRight, CheckCircle2, CircleAlert, CreditCard, LoaderCircle, LockKeyhole, RefreshCw, ShieldCheck } from 'lucide-react'
import { formatPaymentAmount, type PublicPaymentView } from '@/lib/payments/types'
import styles from './PaymentCheckout.module.css'

const copy = {
  en: {
    heading: 'Payment request', amount: 'Total to pay', service: 'Service', product: 'Product', type: 'Payment for',
    reference: 'Reference', expires: 'Pay before', gateway: 'Payment method', pay: 'Pay with Stripe', resume: 'Resume secure checkout', recovering: 'Your previous checkout did not finish opening. You can safely resume it using this same link.', opening: 'Opening secure checkout…',
    loading: 'Loading your payment details…', refresh: 'Check payment status', checking: 'Checking payment…',
    secure: 'Payment details are entered securely on Stripe.', contact: 'Contact VETRA', privacy: 'Privacy',
    test: 'Test payment', testText: 'This is a test link. No real payment will be collected.',
    unavailable: 'Online payment is currently unavailable', unavailableText: 'Please contact VETRA before making this payment.',
    paid: 'Payment received', paidText: 'Thank you. Your payment has been confirmed.',
    processing: 'Your payment is being checked', processingText: 'Please wait for confirmation before making another payment.',
    cancelled: 'This payment link was cancelled', cancelledText: 'Please contact VETRA if you need a new payment link.',
    expired: 'This payment link has expired', expiredText: 'Please contact VETRA for a new link.',
    needs_review: 'We are checking this payment', needs_reviewText: 'Please contact VETRA. Do not make another payment until its status is confirmed.',
    error: 'We could not load the payment. Please try again.', missing: 'This payment link could not be found. Please ask VETRA to check the link.',
    checkoutError: 'Checkout could not be opened. Please check the payment status before trying again.',
    statusError: 'We could not confirm the latest status. Please try again shortly.', retry: 'Try again',
  },
  th: {
    heading: 'รายการชำระเงิน', amount: 'ยอดชำระทั้งหมด', service: 'บริการ', product: 'สินค้า', type: 'ชำระสำหรับ',
    reference: 'เลขอ้างอิง', expires: 'ชำระได้ถึง', gateway: 'ช่องทางชำระเงิน', pay: 'ชำระเงิน', resume: 'กลับไปยังหน้าชำระเงิน', recovering: 'หน้าชำระเงินก่อนหน้านี้เปิดไม่สำเร็จ สามารถใช้ลิงก์เดิมนี้เพื่อดำเนินการต่อได้อย่างปลอดภัย', opening: 'กำลังเปิดหน้าชำระเงิน…',
    loading: 'กำลังโหลดรายละเอียดการชำระเงิน…', refresh: 'ตรวจสอบสถานะการชำระเงิน', checking: 'กำลังตรวจสอบ…',
    secure: 'กรอกข้อมูลการชำระเงินบน Stripe อย่างปลอดภัย', contact: 'ติดต่อ VETRA', privacy: 'ความเป็นส่วนตัว',
    test: 'การชำระเงินทดสอบ', testText: 'ลิงก์นี้ใช้สำหรับการทดสอบ ไม่มีการเรียกเก็บเงินจริง',
    unavailable: 'ยังไม่สามารถชำระเงินออนไลน์ได้', unavailableText: 'กรุณาติดต่อ VETRA ก่อนชำระเงินรายการนี้',
    paid: 'ได้รับการชำระเงินแล้ว', paidText: 'ขอบคุณค่ะ ระบบยืนยันการชำระเงินเรียบร้อยแล้ว',
    processing: 'กำลังตรวจสอบการชำระเงิน', processingText: 'กรุณารอการยืนยันก่อนทำรายการชำระเงินอีกครั้ง',
    cancelled: 'ลิงก์ชำระเงินนี้ถูกยกเลิกแล้ว', cancelledText: 'กรุณาติดต่อ VETRA หากต้องการลิงก์ชำระเงินใหม่',
    expired: 'ลิงก์ชำระเงินนี้หมดอายุแล้ว', expiredText: 'กรุณาติดต่อ VETRA เพื่อขอลิงก์ใหม่',
    needs_review: 'กำลังตรวจสอบรายการนี้', needs_reviewText: 'กรุณาติดต่อ VETRA และรอการยืนยันสถานะก่อนชำระเงินอีกครั้ง',
    error: 'ไม่สามารถโหลดรายการชำระเงินได้ กรุณาลองอีกครั้ง', missing: 'ไม่พบลิงก์ชำระเงินนี้ กรุณาติดต่อ VETRA เพื่อตรวจสอบลิงก์',
    checkoutError: 'ไม่สามารถเปิดหน้าชำระเงินได้ กรุณาตรวจสอบสถานะก่อนลองอีกครั้ง',
    statusError: 'ยังไม่สามารถยืนยันสถานะล่าสุดได้ กรุณาลองใหม่อีกสักครู่', retry: 'ลองอีกครั้ง',
  },
}

export default function PaymentCheckout({ token, locale, returned }: { token: string; locale: 'th' | 'en'; returned: boolean }) {
  const t = copy[locale]
  const [payment, setPayment] = useState<PublicPaymentView | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<'checkout' | 'refresh' | null>(null)
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)
  const api = `/api/payments/${token}`

  useEffect(() => {
    const controller = new AbortController()
    async function load() {
      setLoading(true); setError('')
      try {
        const response = await fetch(api, { cache: 'no-store', signal: controller.signal })
        if (!response.ok) throw new Error(response.status === 404 ? t.missing : t.error)
        const data = await response.json()
        setPayment(data.payment)
        if (returned && !['paid', 'cancelled'].includes(data.payment.status)) {
          const refreshed = await fetch(`${api}/refresh`, { method: 'POST', signal: controller.signal })
          if (refreshed.ok) setPayment((await refreshed.json()).payment)
          else setError(t.statusError)
        }
      } catch (cause) {
        if (!controller.signal.aborted) setError(cause instanceof Error && cause.message === t.missing ? t.missing : t.error)
      } finally { if (!controller.signal.aborted) setLoading(false) }
    }
    void load()
    return () => controller.abort()
  }, [api, returned, retry, t])

  async function refresh() {
    if (busy) return
    setBusy('refresh'); setError('')
    try {
      const response = await fetch(`${api}/refresh`, { method: 'POST' })
      if (!response.ok) throw new Error(t.statusError)
      setPayment((await response.json()).payment)
    } catch { setError(t.statusError) }
    finally { setBusy(null) }
  }

  async function checkout() {
    if (busy || !payment?.canPay) return
    setBusy('checkout'); setError('')
    try {
      const response = await fetch(`${api}/checkout`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ locale }) })
      if (!response.ok) throw new Error(t.checkoutError)
      const data = await response.json()
      const url = new URL(data.url)
      if (url.protocol !== 'https:' || url.hostname !== 'checkout.stripe.com' || url.username || url.password) throw new Error(t.checkoutError)
      window.location.assign(url.toString())
    } catch { setError(t.checkoutError); setBusy(null) }
  }

  const status = payment?.status
  const statusTitle = status && status !== 'pending' ? t[status] : null
  const statusText = status === 'needs_review' && payment?.canPay ? t.recovering : status && status !== 'pending' ? t[`${status}Text`] : null
  const isPaid = status === 'paid'
  const prefix = locale === 'en' ? '/en' : ''
  const query = returned ? '&checkout=returned' : ''
  const nextLocale = locale === 'th' ? 'en' : 'th'

  return <main className={styles.page} lang={locale}>
    <header className={styles.top}>
      <a className={styles.brand} href={prefix || '/'} aria-label="VETRA"><Image src="/logo/vetra-logo_black-name.svg" alt="" width={1211} height={202} priority /></a>
      <a className={styles.languageSwitch} href={`?lang=${nextLocale}${query}`} aria-label={locale === 'th' ? 'TH, switch to English' : 'EN, เปลี่ยนเป็นภาษาไทย'}>{locale.toUpperCase()}</a>
    </header>
    <article className={styles.card} aria-busy={loading || !!busy}>
      {loading ? <div className={styles.loading} role="status"><LoaderCircle size={28} /><p>{t.loading}</p></div> : payment ? <>
        <header className={styles.intro}><p className={styles.eyebrow}><ShieldCheck size={20} />{t.heading}</p><h1>{payment.title}</h1></header>
        <div className={styles.body}>
          {payment.mode === 'test' && <div className={`${styles.notice} ${styles.warning}`}><CircleAlert size={22} /><div><strong>{t.test}</strong><p>{t.testText}</p></div></div>}
          <p className={styles.amountLabel}>{t.amount}</p>
          <p className={styles.amount}>{formatPaymentAmount(payment.amountMinor, locale === 'th' ? 'th-TH' : 'en-GB')}</p>
          {payment.description && <p className={styles.description}>{payment.description}</p>}
          <dl className={styles.details}>
            <div><dt>{t.type}</dt><dd>{t[payment.kind]}</dd></div>
            {payment.reference && <div><dt>{t.reference}</dt><dd>{payment.reference}</dd></div>}
            <div><dt>{t.gateway}</dt><dd>{payment.gateway === 'stripe' ? 'Stripe' : 'Merchant iPay'}</dd></div>
            <div><dt>{t.expires}</dt><dd>{new Intl.DateTimeFormat(locale === 'th' ? 'th-TH' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Bangkok' }).format(new Date(payment.expiresAt))} (GMT+7)</dd></div>
          </dl>
          {statusTitle && <div className={`${styles.notice} ${isPaid ? styles.success : ''}`} role="status">{isPaid ? <CheckCircle2 size={23} /> : <CircleAlert size={23} />}<div><strong>{statusTitle}</strong><p>{statusText}</p></div></div>}
          {!payment.gatewayReady && status === 'pending' && <div className={styles.notice}><LockKeyhole size={22} /><div><strong>{t.unavailable}</strong><p>{t.unavailableText}</p></div></div>}
          {error && <div className={`${styles.notice} ${styles.error}`} role="alert">{error}</div>}
          {payment.canPay && <button className={styles.button} disabled={!!busy} onClick={() => void checkout()}><CreditCard size={21} />{busy === 'checkout' ? t.opening : status === 'needs_review' ? t.resume : t.pay}<ArrowUpRight size={20} /></button>}
          {!['paid', 'cancelled', 'expired'].includes(payment.status) && <button className={styles.refresh} disabled={!!busy} onClick={() => void refresh()}><RefreshCw size={18} />{busy === 'refresh' ? t.checking : t.refresh}</button>}
          {payment.canPay && <p className={styles.reassurance}><LockKeyhole size={16} />{t.secure}</p>}
        </div>
      </> : <div className={styles.body}><div className={`${styles.notice} ${styles.error}`} role="alert">{error || t.error}</div><button className={styles.refresh} onClick={() => setRetry(value => value + 1)}>{t.retry}</button></div>}
    </article>
    <footer className={styles.footer}><a href={`${prefix}/contact`}>{t.contact}</a><span aria-hidden="true">·</span><a href={`${prefix}/privacy`}>{t.privacy}</a></footer>
  </main>
}
