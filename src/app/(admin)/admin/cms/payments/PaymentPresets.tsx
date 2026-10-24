'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowDownToLine, Check, ChevronDown, Save } from 'lucide-react'
import { useCmsI18n } from '@/components/cms/CmsLanguageProvider'
import { createPaymentPresetSchema, type PaymentPresetFields, type PaymentPresetView } from '@/lib/payments/preset-validation'
import { parsePaymentAmount } from '@/lib/payments/validation'
import { money, paymentMessage, responseError } from './paymentUi'
import styles from './payments.module.css'

type SaveOperation = {
  method: 'POST'
  body: { idempotencyKey: string; name: string; details: PaymentPresetFields }
} | {
  method: 'PATCH'
  id: string
  body: { expectedVersion: number; name: string; details: PaymentPresetFields }
}

export default function PaymentPresets({ fields, disabled, onApply, onSavingChange }: {
  fields: PaymentPresetFields
  disabled: boolean
  onApply: (details: PaymentPresetFields) => void
  onSavingChange: (saving: boolean) => void
}) {
  const { locale, intlLocale, t } = useCmsI18n()
  const [presets, setPresets] = useState<PaymentPresetView[]>([])
  const [selectedId, setSelectedId] = useState('')
  // Keep the version actually loaded into the form, even after refreshing the list.
  const [appliedPreset, setAppliedPreset] = useState<PaymentPresetView | null>(null)
  const [name, setName] = useState('')
  const [saveOpen, setSaveOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [reload, setReload] = useState(0)
  const [loadError, setLoadError] = useState('')
  const [saveError, setSaveError] = useState('')
  const [notice, setNotice] = useState<'loaded' | 'saved' | ''>('')
  const [saving, setSaving] = useState(false)
  const [pendingSave, setPendingSave] = useState<SaveOperation | null>(null)
  const inFlight = useRef(false)
  const nameRef = useRef<HTMLInputElement>(null)
  const selected = presets.find(preset => preset.id === selectedId)
  const locked = disabled || saving || loading || !!pendingSave

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setLoadError('')
    void (async () => {
      try {
        const response = await fetch('/api/admin/payment-presets', { cache: 'no-store', signal: controller.signal })
        if (!response.ok) throw new Error(await responseError(response))
        const result = await response.json() as { presets: PaymentPresetView[] }
        if (!Array.isArray(result.presets)) throw new Error('Could not load saved payment details.')
        if (!controller.signal.aborted) setPresets(result.presets)
      } catch (cause) {
        if (!controller.signal.aborted) setLoadError(cause instanceof Error ? cause.message : 'Could not load saved payment details.')
      } finally { if (!controller.signal.aborted) setLoading(false) }
    })()
    return () => controller.abort()
  }, [reload])

  function apply() {
    if (!selected || locked) return
    onApply({ ...selected.details })
    setAppliedPreset(selected)
    setName(selected.name)
    setSaveError('')
    setNotice('loaded')
  }

  function saved(preset: PaymentPresetView) {
    setPresets(current => [...current.filter(item => item.id !== preset.id), preset].sort((a, b) => a.name.localeCompare(b.name)))
    setSelectedId(preset.id)
    setAppliedPreset(preset)
    setName(preset.name)
    setPendingSave(null)
    setNotice('saved')
  }

  async function persist(operation: SaveOperation) {
    if (inFlight.current || disabled) return
    inFlight.current = true
    setSaving(true)
    onSavingChange(true)
    setSaveError('')
    setNotice('')
    setPendingSave(operation)
    let definiteFailure = false
    try {
      const url = operation.method === 'POST' ? '/api/admin/payment-presets' : `/api/admin/payment-presets/${encodeURIComponent(operation.id)}`
      const response = await fetch(url, { method: operation.method, headers: { 'content-type': 'application/json' }, body: JSON.stringify(operation.body) })
      if (!response.ok) {
        definiteFailure = response.status >= 400 && response.status < 500
        throw new Error(await responseError(response))
      }
      const result = await response.json() as { preset: PaymentPresetView }
      if (!result.preset?.id) throw new Error('The saved payment could not be confirmed. Retry this same save.')
      saved(result.preset)
    } catch (cause) {
      if (operation.method === 'PATCH') {
        // A retry after a lost update response can return a version conflict.
        // Confirm the stored version and contents before showing an error.
        try {
          const lookup = await fetch('/api/admin/payment-presets', { cache: 'no-store' })
          if (lookup.ok) {
            const result = await lookup.json() as { presets: PaymentPresetView[] }
            const current = result.presets.find(preset => preset.id === operation.id)
            if (current && current.version === operation.body.expectedVersion + 1 && current.name === operation.body.name &&
              (Object.keys(operation.body.details) as (keyof PaymentPresetFields)[]).every(key => current.details[key] === operation.body.details[key])) {
              saved(current)
              return
            }
          }
        } catch { /* retain the exact operation if its outcome is still uncertain */ }
      }
      if (definiteFailure) setPendingSave(null)
      setSaveError(cause instanceof Error ? cause.message : 'The saved payment could not be confirmed. Retry this same save.')
    } finally {
      inFlight.current = false
      setSaving(false)
      onSavingChange(false)
    }
  }

  function save(updateExisting: boolean) {
    if (locked) return
    const validation = createPaymentPresetSchema.safeParse({ idempotencyKey: crypto.randomUUID(), name, details: fields })
    if (!validation.success) {
      const issue = validation.error.issues[0]
      setSaveError(issue?.path[0] === 'name' ? t('Saved name must be 100 characters or fewer.', 'ชื่อชุดข้อมูลต้องไม่เกิน 100 ตัวอักษร') : t('Check the payment fields before saving these details.', 'ตรวจสอบข้อมูลชำระเงินก่อนบันทึก'))
      if (issue?.path[0] === 'name') nameRef.current?.focus()
      return
    }
    if (validation.data.details.amount) {
      try { parsePaymentAmount(validation.data.details.amount) }
      catch (cause) { setSaveError(cause instanceof Error ? cause.message : 'Enter a valid THB amount.'); return }
    }
    if (updateExisting) {
      if (!appliedPreset || appliedPreset.id !== selectedId) return
      void persist({ method: 'PATCH', id: appliedPreset.id, body: { expectedVersion: appliedPreset.version, name: validation.data.name, details: validation.data.details } })
    } else {
      void persist({ method: 'POST', body: validation.data })
    }
  }

  return <section className={styles.panel} aria-label={t('Saved payment details', 'ข้อมูลชำระเงินที่บันทึกไว้')}>
    <div className={styles.panelBody}>
      {loadError ? <div role="alert"><p>{paymentMessage(loadError, locale)}</p><button type="button" className={styles.quietButton} disabled={locked} onClick={() => setReload(value => value + 1)}>{t('Reload saved details', 'โหลดข้อมูลที่บันทึกไว้อีกครั้ง')}</button></div> :
        <div className={styles.presetPicker}>
          <label className={styles.field}><span>{t('Saved preset', 'ชุดข้อมูลที่บันทึกไว้')}</span>
            <select value={selectedId} disabled={locked || loading || !presets.length} onChange={event => { setSelectedId(event.target.value); setNotice('') }}>
              <option value="">{loading ? t('Loading saved details…', 'กำลังโหลดข้อมูลที่บันทึกไว้…') : !presets.length ? t('No saved details yet', 'ยังไม่มีข้อมูลที่บันทึกไว้') : t('Select saved details', 'เลือกข้อมูลที่บันทึกไว้')}</option>
              {presets.map(preset => <option key={preset.id} value={preset.id}>{preset.name}{preset.details.amount ? ` · ${money(parsePaymentAmount(preset.details.amount), intlLocale)}` : ''}</option>)}
            </select>
          </label>
          <button type="button" className={styles.secondaryButton} disabled={locked || loading || !selected} onClick={apply}><ArrowDownToLine size={18} aria-hidden="true" />{t('Use', 'ใช้')}</button>
        </div>}
      {notice && <p className={styles.presetNotice} role="status"><Check size={18} aria-hidden="true" />{notice === 'loaded' ? t('Details loaded. Review the customer and reference before creating a payment link.', 'เติมข้อมูลแล้ว กรุณาตรวจสอบลูกค้าและเลขอ้างอิงก่อนสร้างลิงก์ชำระเงิน') : t('Payment details saved for reuse.', 'บันทึกข้อมูลสำหรับใช้ครั้งต่อไปแล้ว')}</p>}
      <div className={styles.presetSave}>
        <button type="button" className={styles.quietButton} disabled={disabled || saving || !!pendingSave} aria-expanded={saveOpen} aria-controls="payment-preset-save" onClick={() => setSaveOpen(value => !value)}><Save size={18} aria-hidden="true" />{t('Save current details', 'บันทึกข้อมูลในแบบฟอร์มนี้')}<ChevronDown size={17} aria-hidden="true" style={{ transform: saveOpen ? 'rotate(180deg)' : undefined }} /></button>
        {saveOpen && <div id="payment-preset-save" className={styles.presetSaveBody}>
          <p className={styles.helper}>{t('Leave any field blank. An empty saved name gets an automatic name. Presets are shared with payment administrators and do not create a payment link.', 'เว้นช่องใดก็ได้ หากไม่กรอกชื่อชุดข้อมูล ระบบจะตั้งชื่อให้อัตโนมัติ ชุดข้อมูลใช้ร่วมกับผู้ดูแลการชำระเงิน และการบันทึกยังไม่สร้างลิงก์ชำระเงิน')}</p>
          <label className={styles.field}><span>{t('Saved name (optional)', 'ชื่อชุดข้อมูล (ไม่บังคับ)')}</span><input ref={nameRef} value={name} maxLength={100} disabled={locked} onChange={event => { setName(event.target.value); setSaveError('') }} onKeyDown={event => { if (event.key === 'Enter') event.preventDefault() }} placeholder={t('e.g. Monthly website maintenance', 'เช่น ค่าดูแลเว็บไซต์รายเดือน')} /></label>
          <div className={styles.actionGroup}>
            <button type="button" className={styles.secondaryButton} disabled={locked} onClick={() => save(false)}><Save size={18} aria-hidden="true" />{t('Save as new', 'บันทึกเป็นชุดใหม่')}</button>
            {appliedPreset?.id === selectedId && <button type="button" className={styles.secondaryButton} disabled={locked} onClick={() => save(true)}>{t('Update saved details', 'อัปเดตชุดข้อมูลเดิม')}</button>}
          </div>
        </div>}
      </div>
      {saving && <p className={styles.helper} role="status">{t('Saving payment details…', 'กำลังบันทึกข้อมูลชำระเงิน…')}</p>}
      {saveError && <div role="alert" className={styles.presetError}><p>{paymentMessage(saveError, locale)}</p>
        {pendingSave ? <><p className={styles.helper}>{t('Retry uses the same saved name and form details from your original save.', 'การลองอีกครั้งจะใช้ชื่อและข้อมูลเดิมจากการบันทึกครั้งนั้น')}</p><button type="button" className={styles.secondaryButton} disabled={disabled || saving} onClick={() => void persist(pendingSave)}>{t('Retry save', 'ลองบันทึกอีกครั้ง')}</button></> :
          <button type="button" className={styles.quietButton} disabled={disabled || saving} onClick={() => setReload(value => value + 1)}>{t('Reload saved details', 'โหลดข้อมูลที่บันทึกไว้อีกครั้ง')}</button>}
      </div>}
    </div>
  </section>
}
