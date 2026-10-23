'use client'

import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { prepareImage } from './prepareImage'
import { assetFromSaved, arrayToLines, CATEGORY_LABELS, emptyProject, linesToArray, newSubmissionId, responseMessage, type PortfolioInput, type PortfolioRecord, type ProjectAsset, type ProjectCategory } from './types'
import styles from './ProjectEditor.module.css'

type DetailResponse = { project: PortfolioRecord; canEdit: boolean; mediaConfigured: boolean }
type ListResponse = { canEdit: boolean; mediaConfigured: boolean }
type SaveResponse = { project: PortfolioRecord }
type LookupResponse = { project: PortfolioRecord | null; status: 'missing' | 'uploading' | 'saving' | 'saved' | 'failed' | 'abandoned' }
type Stage = 'idle' | 'preparing' | 'uploading' | 'saving' | 'checking' | 'cleanup' | 'deleting'

const MAX_RETRIES = 3

function isValidProject(form: PortfolioInput, cover: ProjectAsset, slides: ProjectAsset[]) {
  if (!/^[a-z0-9][a-z0-9-]{2,100}$/.test(form.id.trim())) return 'Project ID needs 3–101 lowercase letters, numbers, or hyphens.'
  if (!form.title.trim() || !form.shortDesc.trim()) return 'Add the Thai title and summary.'
  if (form.title.length > 160 || form.english.title.length > 160) return 'Project titles must be 160 characters or fewer.'
  if (form.shortDesc.length > 2000 || form.english.shortDesc.length > 2000) return 'Project summaries must be 2,000 characters or fewer.'
  if (!Number.isInteger(form.year) || form.year < 1900 || form.year > 2200) return 'Enter a valid year.'
  if (!Number.isInteger(form.sortOrder) || Math.abs(form.sortOrder) > 100000) return 'Display order must be a whole number between -100000 and 100000.'
  if (!cover.src && !cover.file) return 'Choose a cover image.'
  if (!cover.alt.trim()) return 'Add a Thai cover image description.'
  if (cover.alt.length > 300 || form.english.coverAlt.length > 300) return 'Cover image descriptions must be 300 characters or fewer.'
  if (slides.length > 30) return 'A project can have up to 30 gallery images.'
  if (slides.some((slide) => !slide.alt.trim())) return 'Add a Thai description for every gallery image.'
  if (slides.some((slide) => slide.alt.length > 300 || slide.caption.length > 500 || slide.englishCaption.length > 500)) return 'Gallery descriptions must be within 300 characters and captions within 500.'
  if (form.stack.length > 30 || (form.english.stack?.length ?? 0) > 30 || form.stack.some((line) => line.length > 100) || form.english.stack?.some((line) => line.length > 100)) return 'Technology lists may have up to 30 lines of 100 characters each.'
  if (form.highlights.length > 30 || form.english.highlights.length > 30 || form.highlights.some((line) => line.length > 1000) || form.english.highlights.some((line) => line.length > 1000)) return 'Highlights may have up to 30 lines of 1,000 characters each.'
  return ''
}

function makeInput(form: PortfolioInput, cover: ProjectAsset, slides: ProjectAsset[]): PortfolioInput {
  return {
    ...form,
    id: form.id.trim(),
    title: form.title.trim(),
    shortDesc: form.shortDesc.trim(),
    cover: { src: cover.uploadedSrc || cover.src, alt: cover.alt.trim() },
    slides: slides.map((slide) => ({ src: slide.uploadedSrc || slide.src, alt: slide.alt.trim(), caption: slide.caption.trim(), priority: slide.priority })),
    stack: form.stack.map((value) => value.trim()).filter(Boolean),
    highlights: form.highlights.map((value) => value.trim()).filter(Boolean),
    english: {
      title: form.english.title.trim(),
      shortDesc: form.english.shortDesc.trim(),
      coverAlt: form.english.coverAlt.trim(),
      highlights: form.english.highlights.map((value) => value.trim()).filter(Boolean),
      slideCaptions: slides.map((slide) => slide.englishCaption.trim()),
      stack: (form.english.stack ?? []).map((value) => value.trim()).filter(Boolean),
    },
  }
}

export default function ProjectEditor({ id }: { id?: string }) {
  const router = useRouter()
  const isNew = !id
  const [form, setForm] = useState<PortfolioInput>(() => emptyProject())
  const [cover, setCover] = useState<ProjectAsset>(() => assetFromSaved({ src: '', alt: '' }))
  const [slides, setSlides] = useState<ProjectAsset[]>([])
  const [version, setVersion] = useState<number | null>(null)
  const [canEdit, setCanEdit] = useState(false)
  const [mediaConfigured, setMediaConfigured] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [stage, setStage] = useState<Stage>('idle')
  const [progress, setProgress] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [uploadFailures, setUploadFailures] = useState(0)
  const [saveFailures, setSaveFailures] = useState(0)
  const [uncertain, setUncertain] = useState(false)
  const [cleanupNeeded, setCleanupNeeded] = useState(false)
  const submissionId = useRef(newSubmissionId())
  const ownedPreviewUrls = useRef<string[]>([])
  const inFlight = useRef(false)
  const saveSnapshot = useRef<{ project: PortfolioInput; submissionId: string; expectedVersion?: number | null } | null>(null)

  useEffect(() => () => { ownedPreviewUrls.current.forEach((url) => URL.revokeObjectURL(url)) }, [])

  function revokePreview(url?: string) {
    if (!url) return
    URL.revokeObjectURL(url)
    ownedPreviewUrls.current = ownedPreviewUrls.current.filter((item) => item !== url)
  }

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError('')
    try {
      const endpoint = isNew ? '/api/admin/projects' : `/api/admin/projects/${encodeURIComponent(id)}`
      const res = await fetch(endpoint, { cache: 'no-store' })
      if (!res.ok) throw new Error(await responseMessage(res))
      const data = (await res.json()) as DetailResponse | ListResponse
      setCanEdit(Boolean(data.canEdit))
      setMediaConfigured(Boolean(data.mediaConfigured))
      if ('project' in data) {
        const project = data.project
        setForm({ ...project, english: project.english ?? emptyProject().english })
        setCover(assetFromSaved(project.cover))
        setSlides((project.slides ?? []).map((slide, index) => assetFromSaved(slide, project.english?.slideCaptions?.[index])))
        setVersion(project.version)
      }
    } catch (cause) {
      setLoadError(cause instanceof Error ? cause.message : 'Could not load project.')
    } finally {
      setLoading(false)
    }
  }, [id, isNew])

  useEffect(() => { void load() }, [load])

  const busy = loading || stage !== 'idle'
  const editable = canEdit && !busy && !uncertain

  function setField<K extends keyof PortfolioInput>(key: K, value: PortfolioInput[K]) {
    setForm((current) => ({ ...current, [key]: value }))
    setSuccess('')
  }

  function setEnglish<K extends keyof PortfolioInput['english']>(key: K, value: PortfolioInput['english'][K]) {
    setForm((current) => ({ ...current, english: { ...current.english, [key]: value } }))
    setSuccess('')
  }

  async function pickImage(event: ChangeEvent<HTMLInputElement>, target: 'cover' | 'gallery') {
    const files = Array.from(event.target.files ?? [])
    event.target.value = ''
    if (!files.length) return
    if (target === 'gallery' && slides.length + files.length > 30) {
      setError('A project can have up to 30 gallery images.')
      return
    }
    setStage('preparing')
    setError('')
    setProgress(`Preparing ${files.length} image${files.length === 1 ? '' : 's'} in your browser…`)
    try {
      const prepared: ProjectAsset[] = []
      for (const file of files) {
        const ready = await prepareImage(file)
        const previewUrl = URL.createObjectURL(ready)
        ownedPreviewUrls.current.push(previewUrl)
        prepared.push({ key: newSubmissionId(), src: '', alt: '', caption: '', englishCaption: '', priority: false, file: ready, previewUrl })
      }
      if (target === 'cover') {
        revokePreview(cover.previewUrl)
        setCover((current) => ({ ...prepared[0], alt: current.alt }))
      }
      else setSlides((current) => [...current, ...prepared])
      setSuccess(`${prepared.length} image${prepared.length === 1 ? '' : 's'} ready. Files will upload when you save.`)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not prepare image.')
    } finally {
      setProgress('')
      setStage('idle')
    }
  }

  async function uploadAsset(asset: ProjectAsset, label: string): Promise<ProjectAsset> {
    if (!asset.file || asset.uploadedSrc) return asset
    if (!mediaConfigured) throw new Error('Media storage is not configured. Keep your selection and try again after setup.')
    setProgress(`Uploading ${label}…`)
    const data = new FormData()
    data.set('file', asset.file)
    data.set('submissionId', submissionId.current)
    data.set('uploadKey', asset.key)
    const res = await fetch('/api/admin/media', { method: 'POST', body: data })
    if (!res.ok) throw new Error(await responseMessage(res))
    const result = (await res.json()) as { src: string }
    if (!result.src) throw new Error('The image upload did not finish. Please try again.')
    return { ...asset, uploadedSrc: result.src }
  }

  function applySaved(project: PortfolioRecord) {
    setForm({ ...project, english: project.english ?? emptyProject().english })
    setCover(assetFromSaved(project.cover))
    setSlides((project.slides ?? []).map((slide, index) => assetFromSaved(slide, project.english?.slideCaptions?.[index])))
    setVersion(project.version)
    ownedPreviewUrls.current.forEach((url) => URL.revokeObjectURL(url))
    ownedPreviewUrls.current = []
    submissionId.current = newSubmissionId()
    saveSnapshot.current = null
    setUploadFailures(0)
    setSaveFailures(0)
    setCleanupNeeded(false)
    setUncertain(false)
    setError('')
    setSuccess('Saved. Changes are visible on the website.')
    if (isNew) router.replace(`/admin/cms/projects/${encodeURIComponent(project.id)}`)
    router.refresh()
  }

  async function lookupSubmission(): Promise<LookupResponse> {
    const res = await fetch(`/api/admin/projects?submissionId=${encodeURIComponent(submissionId.current)}`, { cache: 'no-store' })
    if (!res.ok) throw new Error(await responseMessage(res))
    return (await res.json()) as LookupResponse
  }

  function handleFailedSave(failures: number, message: string) {
    if (failures > MAX_RETRIES) {
      setUncertain(false)
      setCleanupNeeded(true)
      setError(`${message} Retry limit reached. Clean unused uploads before starting another attempt.`)
    } else {
      setUncertain(true)
      setCleanupNeeded(false)
      setError(`${message} Your uploaded images are kept. Retry the same save request.`)
    }
  }

  async function resolveUncertain() {
    if (inFlight.current) return
    inFlight.current = true
    setStage('checking')
    setProgress('Checking whether the project was saved…')
    setError('')
    try {
      const result = await lookupSubmission()
      if (result.status === 'saved' && result.project) applySaved(result.project)
      else if (result.status === 'missing') {
        setUncertain(false)
        if (saveFailures > MAX_RETRIES) {
          setCleanupNeeded(true)
          setError('No save was found. Retry limit reached. Clean unused uploads before starting another attempt.')
        } else setError('No save was found. You can retry with your images and fields intact.')
      } else if (result.status === 'failed') {
        handleFailedSave(saveFailures, 'The save did not finish.')
      } else if (result.status === 'abandoned') {
        setUncertain(false)
        setCleanupNeeded(true)
        setError('This save attempt was closed. Clean its unused uploads before saving again.')
      } else setError('The save has not finished. You can retry the exact same request safely.')
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not check save status.') }
    finally { setStage('idle'); setProgress(''); inFlight.current = false }
  }

  async function cleanupUploads() {
    if (inFlight.current) return
    inFlight.current = true
    setStage('cleanup')
    setProgress('Checking and cleaning unused uploads…')
    setError('')
    try {
      const lookup = await lookupSubmission()
      if (lookup.status === 'saved' && lookup.project) { applySaved(lookup.project); return }
      if (!['missing', 'failed', 'abandoned', 'uploading'].includes(lookup.status)) { setUncertain(true); throw new Error('Save status is still uncertain. Check it again before cleanup.') }
      const res = await fetch('/api/admin/media/cleanup', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ submissionId: submissionId.current }) })
      if (!res.ok) throw new Error(await responseMessage(res))
      const cleanup = (await res.json()) as { failed?: number }
      if ((cleanup.failed ?? 0) > 0) throw new Error(`${cleanup.failed} unused image${cleanup.failed === 1 ? '' : 's'} could not be deleted. Retry cleanup before another save.`)
      setCover((current) => ({ ...current, uploadedSrc: undefined }))
      setSlides((current) => current.map((slide) => ({ ...slide, uploadedSrc: undefined })))
      submissionId.current = newSubmissionId()
      saveSnapshot.current = null
      setUploadFailures(0)
      setSaveFailures(0)
      setCleanupNeeded(false)
      setUncertain(false)
      setSuccess('Unused uploads cleared. Your selected images and fields are still here.')
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not clean unused uploads. Try again.') }
    finally { setStage('idle'); setProgress(''); inFlight.current = false }
  }

  async function save() {
    if (inFlight.current || !canEdit || uncertain) return
    const validation = isValidProject(form, cover, slides)
    if (validation) { setError(validation); return }
    inFlight.current = true
    setError('')
    setSuccess('')
    let nextCover = cover
    const nextSlides = [...slides]
    try {
      setStage('uploading')
      nextCover = await uploadAsset(nextCover, 'cover image')
      setCover(nextCover)
      for (let index = 0; index < nextSlides.length; index++) {
        nextSlides[index] = await uploadAsset(nextSlides[index], `gallery image ${index + 1} of ${nextSlides.length}`)
        setSlides([...nextSlides])
      }
    } catch (cause) {
      const failures = uploadFailures + 1
      setUploadFailures(failures)
      setError(`${cause instanceof Error ? cause.message : 'Upload failed.'} ${failures <= MAX_RETRIES ? 'Press Save to retry only the remaining images.' : 'Retry limit reached. Clean up this attempt before starting again.'}`)
      if (failures > MAX_RETRIES) setCleanupNeeded(true)
      setStage('idle'); setProgress(''); inFlight.current = false
      return
    }

    let saveResponseStatus = 0
    try {
      setStage('saving')
      setProgress('Saving project…')
      const payload = makeInput(form, nextCover, nextSlides)
      const saveBody = { project: payload, submissionId: submissionId.current, ...(isNew ? {} : { expectedVersion: version }) }
      saveSnapshot.current = saveBody
      const res = await fetch(isNew ? '/api/admin/projects' : `/api/admin/projects/${encodeURIComponent(id)}`, {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(saveBody),
      })
      saveResponseStatus = res.status
      if (!res.ok) throw new Error(await responseMessage(res))
      const result = (await res.json()) as SaveResponse
      if (!result.project) throw new Error('Save returned no project. Checking status…')
      applySaved(result.project)
    } catch (cause) {
      const failures = saveFailures + 1
      setSaveFailures(failures)
      setStage('checking')
      setProgress('Checking whether the save finished…')
      try {
        const lookup = await lookupSubmission()
        if (lookup.status === 'saved' && lookup.project) applySaved(lookup.project)
        else if (lookup.status === 'failed') {
          handleFailedSave(failures, cause instanceof Error ? cause.message : 'Save failed.')
        } else if (lookup.status === 'abandoned' || (lookup.status === 'uploading' && saveResponseStatus >= 400 && saveResponseStatus < 500)) {
          setCleanupNeeded(true)
          setError(`${cause instanceof Error ? cause.message : 'Save rejected.'} Clean unused uploads, then correct the fields and save again.`)
        } else if (lookup.status === 'missing') {
          setError(`${cause instanceof Error ? cause.message : 'Save failed.'} ${failures <= MAX_RETRIES ? 'Press Save to retry; uploaded images will be reused.' : 'Retry limit reached. Clean up unused uploads to start again.'}`)
          if (failures > MAX_RETRIES) setCleanupNeeded(true)
        } else {
          setUncertain(true)
          setError('The save may still be running. Check status or retry the same save request. Inputs are locked until this resolves.')
        }
      } catch {
        setUncertain(true)
        setError('Save outcome is uncertain. Check status or retry the same save request. Inputs are locked until this resolves.')
      }
    } finally { setStage('idle'); setProgress(''); inFlight.current = false }
  }

  async function retryUncertainSave() {
    const snapshot = saveSnapshot.current
    if (!snapshot || inFlight.current || saveFailures > MAX_RETRIES) return
    inFlight.current = true
    setStage('saving')
    setProgress('Retrying the same save request…')
    setError('')
    try {
      const res = await fetch(isNew ? '/api/admin/projects' : `/api/admin/projects/${encodeURIComponent(id)}`, {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(snapshot),
      })
      if (!res.ok) throw new Error(await responseMessage(res))
      const result = (await res.json()) as SaveResponse
      if (!result.project) throw new Error('Save returned no project.')
      applySaved(result.project)
    } catch (cause) {
      const failures = saveFailures + 1
      setSaveFailures(failures)
      setStage('checking')
      setProgress('Checking the save outcome…')
      try {
        const lookup = await lookupSubmission()
        if (lookup.status === 'saved' && lookup.project) applySaved(lookup.project)
        else if (lookup.status === 'failed') {
          handleFailedSave(failures, cause instanceof Error ? cause.message : 'Save failed.')
        } else if (lookup.status === 'abandoned') {
          setUncertain(false)
          setCleanupNeeded(true)
          setError('This save attempt was closed. Clean unused uploads before saving again.')
        } else if (lookup.status === 'missing') {
          setUncertain(false)
          if (failures > MAX_RETRIES) {
            setCleanupNeeded(true)
            setError('No save was found. Retry limit reached. Clean unused uploads before starting another attempt.')
          } else setError('No save was found. Your images and fields are intact; press Save to try again.')
        } else {
          setUncertain(true)
          setError(`${cause instanceof Error ? cause.message : 'Save outcome is uncertain.'} Check status or retry the same request.`)
        }
      } catch { setUncertain(true); setError('Save status could not be checked. Try checking again.') }
    } finally { setStage('idle'); setProgress(''); inFlight.current = false }
  }

  async function moveToTrash() {
    if (!id || version == null || !canEdit || inFlight.current) return
    if (!window.confirm(`Move “${form.title}” to Trash? You can restore it for 30 days.`)) return
    inFlight.current = true
    setStage('deleting')
    setError('')
    try {
      const res = await fetch(`/api/admin/projects/${encodeURIComponent(id)}`, { method: 'DELETE', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ expectedVersion: version }) })
      if (!res.ok) throw new Error(await responseMessage(res))
      router.replace('/admin/cms/projects')
      router.refresh()
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not move project to Trash.') }
    finally { setStage('idle'); inFlight.current = false }
  }

  function moveSlide(index: number, direction: -1 | 1) {
    setSlides((current) => {
      const target = index + direction
      if (target < 0 || target >= current.length) return current
      const reordered = [...current]
      ;[reordered[index], reordered[target]] = [reordered[target], reordered[index]]
      return reordered
    })
  }

  if (loading) return <main className={styles.state} role="status">Loading project editor…</main>
  if (loadError) return <main className={styles.state} role="alert"><h1>Could not open project</h1><p>{loadError}</p><button type="button" className={styles.secondaryButton} onClick={() => void load()}>Try again</button></main>

  return (
    <main className={styles.page}>
      <div className={styles.breadcrumb}><Link href="/admin/cms/projects">Projects</Link><span aria-hidden="true">/</span><span>{isNew ? 'New project' : form.title || id}</span></div>
      <header className={styles.header}><div><div className={styles.eyebrow}>{isNew ? 'New project' : 'Project details'}</div><h1>{isNew ? 'Add a project' : form.title || 'Edit project'}</h1><p>Changes appear on the website immediately after you save.</p></div><div className={styles.headerActions}><Link className={styles.secondaryButton} href="/admin/cms/projects">Back to projects</Link>{canEdit && <button type="button" className={styles.primaryButton} onClick={() => void save()} disabled={busy || uncertain || cleanupNeeded}>{stage === 'uploading' || stage === 'saving' ? 'Saving…' : 'Save changes'}</button>}</div></header>
      {!canEdit && <div className={styles.notice}>Your account can view this project but cannot change it.</div>}
      {!mediaConfigured && <div className={styles.notice}>Media storage is not configured. Existing images can stay, but new images cannot be uploaded.</div>}
      {progress && <div className={styles.progress} role="status">{progress}</div>}
      {error && <div className={styles.error} role="alert"><strong>Action needed</strong><p>{error}</p><div className={styles.errorActions}>{uncertain && <button type="button" className={styles.secondaryButton} onClick={() => void resolveUncertain()}>Check save status</button>}{uncertain && saveFailures <= MAX_RETRIES && <button type="button" className={styles.primaryButton} onClick={() => void retryUncertainSave()}>Retry same save</button>}{cleanupNeeded && <button type="button" className={styles.secondaryButton} onClick={() => void cleanupUploads()}>Clean unused uploads</button>}</div></div>}
      {success && <div className={styles.success} role="status">{success}</div>}
      <div className={styles.layout}>
        <div className={styles.mainColumn}>
          <section className={styles.panel}><div className={styles.panelHeading}><span className={styles.step}>01</span><div><h2>Project basics</h2><p>Primary fields and portfolio placement</p></div></div><div className={styles.fields}>
            <label className={styles.field}><span>Project ID <em>Required</em></span><input value={form.id} disabled={!editable || !isNew} onChange={(e) => setField('id', e.target.value.toLowerCase().replace(/\s+/g, '-'))} placeholder="p-038-project-name" /><small>This ID stays fixed after you create the project.</small></label>
            <div className={styles.fieldPair}><label className={styles.field}><span>Year</span><input type="number" min="1900" max="2100" value={form.year} disabled={!editable} onChange={(e) => setField('year', Number(e.target.value))} /></label><label className={styles.field}><span>Category</span><select value={form.category} disabled={!editable} onChange={(e) => setField('category', e.target.value as ProjectCategory)}>{Object.entries(CATEGORY_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label></div>
            <div className={styles.fieldPair}><label className={styles.field}><span>Display order</span><input type="number" value={form.sortOrder} disabled={!editable} onChange={(e) => setField('sortOrder', Number(e.target.value))} /><small>Lower numbers appear first.</small></label><div className={styles.switches}><label><input type="checkbox" checked={form.isExample} disabled={!editable} onChange={(e) => setField('isExample', e.target.checked)} /><span>Featured project</span></label><label><input type="checkbox" checked={form.hasDetail} disabled={!editable} onChange={(e) => setField('hasDetail', e.target.checked)} /><span>Show detail modal</span></label></div></div>
          </div></section>
          <section className={styles.panel}><div className={styles.panelHeading}><span className={styles.step}>02</span><div><h2>Content</h2><p>Thai first, with separate English copy</p></div></div><div className={styles.languageColumns}>
            <div className={styles.languageCard}><div className={styles.languageTitle}><span>TH</span><h3>Thai · Primary</h3></div><label className={styles.field}><span>Project title <em>Required</em></span><input value={form.title} disabled={!editable} onChange={(e) => setField('title', e.target.value)} /></label><label className={styles.field}><span>Short description <em>Required</em></span><textarea rows={4} value={form.shortDesc} disabled={!editable} onChange={(e) => setField('shortDesc', e.target.value)} /></label><label className={styles.field}><span>Highlights <small>One per line</small></span><textarea rows={5} value={arrayToLines(form.highlights)} disabled={!editable} onChange={(e) => setField('highlights', linesToArray(e.target.value))} /></label></div>
            <div className={styles.languageCard}><div className={styles.languageTitle}><span>EN</span><h3>English</h3></div><label className={styles.field}><span>Project title</span><input value={form.english.title} disabled={!editable} onChange={(e) => setEnglish('title', e.target.value)} /></label><label className={styles.field}><span>Short description</span><textarea rows={4} value={form.english.shortDesc} disabled={!editable} onChange={(e) => setEnglish('shortDesc', e.target.value)} /></label><label className={styles.field}><span>Highlights <small>One per line</small></span><textarea rows={5} value={arrayToLines(form.english.highlights)} disabled={!editable} onChange={(e) => setEnglish('highlights', linesToArray(e.target.value))} /></label></div>
          </div><div className={styles.fields}><div className={styles.fieldPair}><label className={styles.field}><span>Technology stack · Thai <small>One per line</small></span><textarea rows={3} value={arrayToLines(form.stack)} disabled={!editable} onChange={(e) => setField('stack', linesToArray(e.target.value))} /></label><label className={styles.field}><span>Technology stack · English <small>One per line</small></span><textarea rows={3} value={arrayToLines(form.english.stack)} disabled={!editable} onChange={(e) => setEnglish('stack', linesToArray(e.target.value))} /></label></div></div></section>
          <section className={styles.panel}><div className={styles.panelHeading}><span className={styles.step}>03</span><div><h2>Gallery</h2><p>Images stay on this device until you press Save</p></div></div><div className={styles.fields}>
            <div className={styles.mediaHeader}><h3>Cover image</h3>{canEdit && <label className={styles.secondaryButton}>Choose cover<input type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" hidden disabled={!editable || !mediaConfigured} onChange={(e) => void pickImage(e, 'cover')} /></label>}</div>
            <div className={styles.coverRow}><div className={styles.coverPreview}>{cover.previewUrl || cover.src ? <Image unoptimized src={cover.previewUrl || cover.src} alt="Cover preview" width={640} height={400} /> : <span>No cover selected</span>}</div><div className={styles.coverFields}><label className={styles.field}><span>Thai image description <em>Required</em></span><input value={cover.alt} disabled={!editable} onChange={(e) => setCover((current) => ({ ...current, alt: e.target.value }))} /></label><label className={styles.field}><span>English image description</span><input value={form.english.coverAlt} disabled={!editable} onChange={(e) => setEnglish('coverAlt', e.target.value)} /></label>{cover.file && <p className={styles.fileHint}>Selected: {cover.file.name} · {(cover.file.size / 1024 / 1024).toFixed(2)} MB{cover.uploadedSrc ? ' · Ready to save' : ' · Uploads when you save'}</p>}</div></div>
            <div className={styles.mediaHeader}><h3>Gallery images</h3>{canEdit && <label className={styles.secondaryButton}>Add images<input type="file" multiple accept="image/jpeg,image/png,image/webp,image/gif,image/avif" hidden disabled={!editable || !mediaConfigured} onChange={(e) => void pickImage(e, 'gallery')} /></label>}</div>
            {slides.length === 0 && <div className={styles.emptyGallery}>No gallery images yet.</div>}
            <div className={styles.galleryList}>{slides.map((slide, index) => (
              <div className={styles.galleryItem} key={slide.key}>
                <div className={styles.galleryImage}><Image unoptimized src={slide.previewUrl || slide.src} alt="" width={320} height={320} /></div>
                <div className={styles.galleryFields}>
                  <div className={styles.galleryTop}>
                    <strong>Image {index + 1}</strong>
                    {canEdit && <div className={styles.galleryActions}>
                      <button type="button" className={styles.smallButton} disabled={!editable || index === 0} onClick={() => moveSlide(index, -1)} aria-label={`Move image ${index + 1} up`}>↑</button>
                      <button type="button" className={styles.smallButton} disabled={!editable || index === slides.length - 1} onClick={() => moveSlide(index, 1)} aria-label={`Move image ${index + 1} down`}>↓</button>
                      <button type="button" className={styles.removeButton} disabled={!editable} onClick={() => { revokePreview(slide.previewUrl); setSlides((current) => current.filter((item) => item.key !== slide.key)) }}>Remove</button>
                    </div>}
                  </div>
                  <label className={styles.field}><span>Thai image description <em>Required</em></span><input value={slide.alt} disabled={!editable} onChange={(e) => setSlides((current) => current.map((item) => item.key === slide.key ? { ...item, alt: e.target.value } : item))} /></label>
                  <div className={styles.fieldPair}>
                    <label className={styles.field}><span>Thai caption</span><input value={slide.caption} disabled={!editable} onChange={(e) => setSlides((current) => current.map((item) => item.key === slide.key ? { ...item, caption: e.target.value } : item))} /></label>
                    <label className={styles.field}><span>English caption</span><input value={slide.englishCaption} disabled={!editable} onChange={(e) => setSlides((current) => current.map((item) => item.key === slide.key ? { ...item, englishCaption: e.target.value } : item))} /></label>
                  </div>
                  <label className={styles.checkLabel}><input type="checkbox" checked={slide.priority} disabled={!editable} onChange={(e) => setSlides((current) => current.map((item) => item.key === slide.key ? { ...item, priority: e.target.checked } : item))} />Load this image first</label>
                </div>
              </div>
            ))}</div>
          </div></section>
        </div>
        <aside className={styles.sideColumn}><section className={styles.summary}><div className={styles.summaryTop}>Save changes</div><h2>Review and save</h2><p>Changes appear on the website immediately after saving.</p><ul><li>{form.title.trim() ? '✓' : '○'} Thai project title</li><li>{form.shortDesc.trim() ? '✓' : '○'} Thai summary</li><li>{cover.src || cover.file ? '✓' : '○'} Cover image</li><li>{cover.alt.trim() ? '✓' : '○'} Cover description</li></ul>{canEdit && <button type="button" className={styles.primaryButton} onClick={() => void save()} disabled={busy || uncertain || cleanupNeeded}>{stage === 'uploading' || stage === 'saving' ? 'Saving…' : 'Save changes'}</button>}{!isNew && canEdit && <button type="button" className={styles.dangerButton} disabled={busy} onClick={() => void moveToTrash()}>Move to Trash</button>}</section><div className={styles.sideHint}>If saving is interrupted, your text and selected images stay here so you can try again.</div></aside>
      </div>
    </main>
  )
}
