import { formatPaymentAmount, type PaymentStatus } from '@/lib/payments/types'

const statusLabels: Record<PaymentStatus, [string, string]> = {
  pending: ['Pending', 'รอชำระเงิน'],
  processing: ['Processing', 'กำลังดำเนินการ'],
  paid: ['Paid', 'ชำระแล้ว'],
  cancelled: ['Cancelled', 'ยกเลิกแล้ว'],
  expired: ['Expired', 'หมดอายุ'],
  needs_review: ['Needs review', 'ต้องตรวจสอบ'],
}

export function paymentStatusLabel(status: PaymentStatus, locale: 'en' | 'th') {
  return statusLabels[status][locale === 'th' ? 1 : 0]
}

export function money(amountMinor: number, locale = 'en-GB') {
  return formatPaymentAmount(amountMinor, locale)
}

export function dateTime(value: string | null | undefined, locale = 'en-GB') {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    timeZone: 'Asia/Bangkok', timeZoneName: 'short',
  }).format(date)
}

/** Translate known service messages at display time so switching language also updates alerts. */
const messages: Record<string, string> = {
  'Could not load saved payment details.': 'โหลดข้อมูลชำระเงินที่บันทึกไว้ไม่สำเร็จ',
  'Enter a saved payment name with 1–100 characters.': 'กรุณากรอกชื่อชุดข้อมูลความยาว 1–100 ตัวอักษร',
  'Check the payment fields before saving these details.': 'กรุณาตรวจสอบชื่อรายการ ยอดเงิน และข้อมูลในแบบฟอร์มก่อนบันทึก',
  'Check the saved payment name and fields and try again.': 'กรุณาตรวจสอบชื่อชุดข้อมูลและรายละเอียดในแบบฟอร์ม แล้วลองอีกครั้ง',
  'This saved payment was not found.': 'ไม่พบชุดข้อมูลชำระเงินนี้',
  'This saved payment changed. Reload and use its latest details before updating, or save your form as new.': 'ชุดข้อมูลนี้มีการเปลี่ยนแปลง กรุณาโหลดรายการและเลือกใช้ข้อมูลล่าสุดก่อนอัปเดต หรือบันทึกข้อมูลในแบบฟอร์มเป็นชุดใหม่',
  'This save request was already used with different details.': 'รหัสการบันทึกนี้ถูกใช้กับข้อมูลที่ต่างกันแล้ว',
  'The saved payment could not be confirmed. Retry this same save.': 'ยังยืนยันผลการบันทึกไม่ได้ กรุณาลองบันทึกข้อมูลเดิมอีกครั้ง',
  'Enable payments with PAYMENTS_ENABLED=true when setup is complete.': 'เมื่อตั้งค่าเสร็จแล้ว ให้เปิดรับชำระเงินด้วย PAYMENTS_ENABLED=true',
  'STRIPE_MODE must be test or live.': 'STRIPE_MODE ต้องเป็น test หรือ live',
  'Add a Stripe test secret key in STRIPE_SECRET_KEY.': 'เพิ่มคีย์ลับ Stripe สำหรับโหมดทดสอบใน STRIPE_SECRET_KEY',
  'Add a Stripe live secret key in STRIPE_SECRET_KEY.': 'เพิ่มคีย์ลับ Stripe สำหรับโหมดใช้งานจริงใน STRIPE_SECRET_KEY',
  'Add the endpoint signing secret in STRIPE_WEBHOOK_SECRET.': 'เพิ่มคีย์ลงนามของ Webhook ใน STRIPE_WEBHOOK_SECRET',
  'Set NEXT_PUBLIC_SITE_URL to this website’s origin, without a path.': 'ตั้งค่า NEXT_PUBLIC_SITE_URL เป็น URL หลักของเว็บไซต์ โดยไม่มีพาธต่อท้าย',
  'Live payments need a public HTTPS website URL.': 'การรับชำระเงินจริงต้องใช้ URL เว็บไซต์สาธารณะแบบ HTTPS',
  'Live payments are available only in a production deployment. Use Stripe test mode here.': 'รับชำระเงินจริงได้เฉพาะระบบที่เผยแพร่ในสภาพแวดล้อม Production กรุณาใช้โหมดทดสอบ Stripe ที่นี่',
  'Could not load payment requests.': 'โหลดรายการเรียกเก็บเงินไม่สำเร็จ',
  'Could not check payment setup.': 'ตรวจสอบการตั้งค่าการชำระเงินไม่สำเร็จ',
  'Wait for the payment mode and setup check to finish.': 'กรุณารอให้ตรวจสอบโหมดและการตั้งค่าการชำระเงินเสร็จก่อน',
  'Check the payment details.': 'กรุณาตรวจสอบรายละเอียดการชำระเงิน',
  'Enter a title with 1–160 characters.': 'กรุณากรอกชื่อรายการความยาว 1–160 ตัวอักษร',
  'Enter a valid THB amount.': 'กรุณากรอกจำนวนเงินบาทให้ถูกต้อง',
  'Enter a THB amount with up to two decimal places.': 'กรุณากรอกจำนวนเงินบาท โดยมีทศนิยมไม่เกิน 2 ตำแหน่ง',
  'The payment amount must be between ฿10.00 and ฿999,999.99.': 'ยอดชำระเงินต้องอยู่ระหว่าง ฿10.00 ถึง ฿999,999.99',
  'Enter a valid customer email.': 'กรุณากรอกอีเมลลูกค้าให้ถูกต้อง',
  'The request may have been created, but the response was incomplete.': 'รายการอาจถูกสร้างแล้ว แต่ระบบตอบกลับไม่ครบถ้วน',
  'Could not create the payment request.': 'สร้างรายการเรียกเก็บเงินไม่สำเร็จ',
  'The payment request could not be read.': 'ไม่สามารถอ่านข้อมูลรายการเรียกเก็บเงินได้',
  'Could not load this payment request.': 'โหลดรายการเรียกเก็บเงินนี้ไม่สำเร็จ',
  'The QR code could not be prepared. You can still use the link.': 'สร้าง QR Code ไม่สำเร็จ คุณยังสามารถใช้ลิงก์ชำระเงินได้',
  'The status response was incomplete. Refresh this page to check the request.': 'ข้อมูลสถานะที่ตอบกลับไม่ครบถ้วน กรุณาโหลดหน้านี้ใหม่เพื่อตรวจสอบรายการ',
  'Payment link cancelled.': 'ยกเลิกลิงก์ชำระเงินแล้ว',
  'Provider status checked and request updated.': 'ตรวจสอบสถานะจากผู้ให้บริการและอัปเดตรายการแล้ว',
  'Could not update payment status.': 'อัปเดตสถานะการชำระเงินไม่สำเร็จ',
  'Payment link copied.': 'คัดลอกลิงก์ชำระเงินแล้ว',
  'Could not copy automatically. Select the link and copy it manually.': 'คัดลอกอัตโนมัติไม่สำเร็จ กรุณาเลือกลิงก์แล้วคัดลอกด้วยตนเอง',
  'The payment gateway does not match this request.': 'ช่องทางชำระเงินไม่ตรงกับรายการนี้',
  'You do not have permission to manage payments.': 'คุณไม่มีสิทธิ์จัดการการชำระเงิน',
  'Check the payment fields and try again.': 'กรุณาตรวจสอบข้อมูลการชำระเงินแล้วลองอีกครั้ง',
  'This create request was already used with different details.': 'รหัสคำขอนี้ถูกใช้สร้างรายการที่มีรายละเอียดต่างกันแล้ว',
  'The payment request outcome is uncertain. Look it up by its request key before trying again.': 'ยังยืนยันผลการสร้างรายการไม่ได้ กรุณาตรวจสอบด้วยรหัสคำขอเดิมก่อนลองอีกครั้ง',
  'Invalid payment request key.': 'รหัสคำขอชำระเงินไม่ถูกต้อง',
  'Another payment operation is in progress. Please retry shortly.': 'ระบบกำลังดำเนินการกับรายการนี้อยู่ กรุณาลองอีกครั้งในอีกสักครู่',
  'The gateway payment details do not match this request.': 'รายละเอียดจากผู้ให้บริการชำระเงินไม่ตรงกับรายการนี้',
  'The gateway returned an invalid expiry.': 'วันหมดอายุที่ผู้ให้บริการส่งกลับมาไม่ถูกต้อง',
  'The gateway returned an invalid checkout link.': 'ลิงก์ชำระเงินที่ผู้ให้บริการส่งกลับมาไม่ถูกต้อง',
  'A positive amount cannot be completed without payment.': 'ไม่สามารถยืนยันรายการที่มียอดเงินมากกว่าศูนย์โดยยังไม่ได้ชำระเงิน',
  'The gateway returned an inconsistent checkout state.': 'สถานะการชำระเงินที่ผู้ให้บริการส่งกลับมาไม่สอดคล้องกัน',
  'The payment attempt was not found.': 'ไม่พบข้อมูลการดำเนินการชำระเงิน',
  'The payment state changed during verification. Refresh it.': 'สถานะการชำระเงินเปลี่ยนระหว่างตรวจสอบ กรุณารีเฟรชสถานะ',
  'The gateway returned a different session for this attempt.': 'เซสชันที่ผู้ให้บริการส่งกลับมาไม่ตรงกับการดำเนินการนี้',
  'This request has more than one verified payment and needs review.': 'รายการนี้มีการชำระเงินที่ยืนยันแล้วมากกว่าหนึ่งครั้ง กรุณาตรวจสอบ',
  'This checkout attempt needs manual review before another payment can start.': 'กรุณาตรวจสอบการชำระเงินนี้ด้วยตนเองก่อนเริ่มรายการใหม่',
  'This checkout attempt needs manual review.': 'กรุณาตรวจสอบการชำระเงินนี้ด้วยตนเอง',
  'The payment gateway could not confirm this checkout yet. Please retry refresh.': 'ผู้ให้บริการยังยืนยันการชำระเงินนี้ไม่ได้ กรุณารีเฟรชสถานะอีกครั้ง',
  'The payment website URL is not configured.': 'ยังไม่ได้ตั้งค่า URL เว็บไซต์สำหรับการชำระเงิน',
  'This payment has already been completed.': 'ชำระเงินรายการนี้เรียบร้อยแล้ว',
  'This payment request was cancelled.': 'รายการเรียกเก็บเงินนี้ถูกยกเลิกแล้ว',
  'This payment link has expired.': 'ลิงก์ชำระเงินนี้หมดอายุแล้ว',
  'A payment is still processing. Please refresh its status.': 'การชำระเงินยังอยู่ระหว่างดำเนินการ กรุณารีเฟรชสถานะ',
  'Online payments are not available yet. Please contact VETRA.': 'ยังไม่สามารถรับชำระเงินออนไลน์ได้ กรุณาติดต่อ VETRA',
  'This payment attempt needs manual review.': 'กรุณาตรวจสอบการดำเนินการชำระเงินนี้ด้วยตนเอง',
  'A paid request cannot be cancelled.': 'ไม่สามารถยกเลิกรายการที่ชำระเงินแล้ว',
  'A payment is processing and cannot be cancelled.': 'การชำระเงินอยู่ระหว่างดำเนินการ จึงยังยกเลิกไม่ได้',
  'This attempt needs manual review.': 'กรุณาตรวจสอบการดำเนินการนี้ด้วยตนเอง',
  'A payment was already verified and cannot be cancelled.': 'การชำระเงินได้รับการยืนยันแล้ว จึงไม่สามารถยกเลิกได้',
  'This payment has already completed.': 'ชำระเงินรายการนี้เรียบร้อยแล้ว',
  'The gateway could not confirm cancellation. Refresh before trying again.': 'ผู้ให้บริการยังยืนยันการยกเลิกไม่ได้ กรุณารีเฟรชสถานะก่อนลองอีกครั้ง',
  'The gateway did not confirm checkout expiry. This payment cannot be cancelled yet.': 'ผู้ให้บริการยังไม่ยืนยันว่าการชำระเงินหมดอายุ จึงยังยกเลิกรายการนี้ไม่ได้',
  'This payment changed while cancellation was in progress. Refresh it.': 'รายการเปลี่ยนแปลงระหว่างยกเลิก กรุณารีเฟรชสถานะ',
  'The payment service could not confirm this operation. Refresh its status before trying again.': 'ระบบชำระเงินยังยืนยันผลการดำเนินการไม่ได้ กรุณารีเฟรชสถานะก่อนลองอีกครั้ง',
  'The request is too large.': 'ข้อมูลคำขอมีขนาดใหญ่เกินไป',
  'Invalid request body.': 'ข้อมูลคำขอไม่ถูกต้อง',
  'This request must come from this website.': 'ต้องดำเนินการจากเว็บไซต์นี้เท่านั้น',
  'Please sign in again.': 'กรุณาเข้าสู่ระบบอีกครั้ง',
  'This payment gateway is not available yet.': 'ยังไม่สามารถใช้ช่องทางชำระเงินนี้ได้',
  'Online payments are not configured yet.': 'ยังไม่ได้ตั้งค่าการชำระเงินออนไลน์',
  'The payment gateway returned an invalid checkout status.': 'สถานะการดำเนินการที่ผู้ให้บริการส่งกลับมาไม่ถูกต้อง',
  'The payment gateway returned an invalid payment status.': 'สถานะการชำระเงินที่ผู้ให้บริการส่งกลับมาไม่ถูกต้อง',
  'The payment gateway returned an unexpected checkout URL.': 'URL ชำระเงินที่ผู้ให้บริการส่งกลับมาไม่ตรงกับที่คาดไว้',
  'The checkout mode does not match this payment request.': 'โหมดการชำระเงินไม่ตรงกับรายการนี้',
  'Unknown payment status filter.': 'ตัวกรองสถานะการชำระเงินไม่ถูกต้อง',
  'Invalid page.': 'หมายเลขหน้าไม่ถูกต้อง',
  'Unknown payment action.': 'การดำเนินการชำระเงินไม่ถูกต้อง',
}

export function paymentMessage(message: string, locale: 'en' | 'th'): string {
  if (locale === 'en' || !message) return message
  const retrySuffix = ' Your details are kept. Retry the same request to avoid a duplicate.'
  if (message.endsWith(retrySuffix)) {
    return `${paymentMessage(message.slice(0, -retrySuffix.length), locale)} ข้อมูลของคุณยังอยู่ กรุณาลองส่งคำขอเดิมอีกครั้งเพื่อป้องกันรายการซ้ำ`
  }
  if (messages[message]) return messages[message]
  const status = /^Request failed \((\d+)\)\.$/.exec(message)
  if (status) return `ดำเนินการไม่สำเร็จ (${status[1]}) กรุณาลองอีกครั้ง`
  return 'ยังยืนยันผลการดำเนินการไม่ได้ กรุณาตรวจสอบข้อมูลและรีเฟรชสถานะก่อนลองอีกครั้ง'
}

export async function responseError(response: Response) {
  try {
    const body = await response.json() as { error?: string; message?: string }
    return body.error || body.message || `Request failed (${response.status}).`
  } catch { return `Request failed (${response.status}).` }
}
