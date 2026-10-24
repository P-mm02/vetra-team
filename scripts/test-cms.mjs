import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'

export async function testCms(base, db) {
  assert.ok(['127.0.0.1', 'localhost', '[::1]'].includes(new URL(base).hostname), 'CMS tests require a local test server')
  assert.equal(db.databaseName, 'vetra_cms_isolated_test', 'CMS tests require the isolated temporary database')
  let checks = 0
  const request = async (path, { cookie, method = 'GET', body, origin = base } = {}) => {
    const response = await fetch(base + path, { method, headers: { ...(cookie ? { cookie } : {}), ...(body ? { 'content-type': 'application/json' } : {}), origin }, body: body ? JSON.stringify(body) : undefined, redirect: 'manual' })
    const text = await response.text()
    let data; try { data = JSON.parse(text) } catch { data = text }
    return { response, data }
  }
  const visibleText = html => html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '').replace(/<!--[\s\S]*?-->/g, '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
  const check = (actual, expected, label) => { assert.equal(actual, expected, label); checks++; console.log(`PASS ${label}`) }
  check((await request('/api/admin/projects')).response.status, 401, 'Unauthenticated portfolio access rejected')
  const login = async username => {
    const { response } = await request('/api/auth/login', { method: 'POST', body: { username, password: 'Test-cms-only-2026!' } })
    check(response.status, 200, `${username} login`)
    return response.headers.get('set-cookie').split(';')[0]
  }
  const dev = await login('testdev'), editor = await login('testeditor'), viewer = await login('testviewer')
  const emailSignIn = await request('/api/auth/login', { method: 'POST', body: { username: 'dev@example.invalid', password: 'Test-cms-only-2026!' } })
  check(emailSignIn.response.status, 200, 'Email can be used to sign in')
  const emailCookie = emailSignIn.response.headers.get('set-cookie').split(';')[0]
  check((await request('/admin/cms', { cookie: emailCookie })).response.status, 200, 'Session opens protected CMS')
  check((await request('/api/auth/logout', { cookie: emailCookie, method: 'POST' })).response.status, 200, 'Logout completes')
  check((await request('/admin/cms', { cookie: emailCookie })).response.status === 200, false, 'Logged-out session cannot reopen CMS')
  check((await request('/api/auth/login', { method: 'POST', body: { username: 'unknownuser', password: 'Test-cms-only-2026!' } })).response.status, 401, 'Unknown account receives generic rejection')
  for (let attempt = 0; attempt < 5; attempt++) {
    check((await request('/api/auth/login', { method: 'POST', body: { username: 'testadmin', password: 'Incorrect-test-password' } })).response.status, 401, `Incorrect password attempt ${attempt + 1} rejected`)
  }
  check((await request('/api/auth/login', { method: 'POST', body: { username: 'testadmin', password: 'Test-cms-only-2026!' } })).response.status, 401, 'Correct password is rejected while account is locked')
  await db.collection('users').updateOne({ username: 'testadmin' }, { $set: { lockUntil: new Date(Date.now() - 1000) } })
  const unlocked = await request('/api/auth/login', { method: 'POST', body: { username: 'testadmin', password: 'Test-cms-only-2026!' } })
  check(unlocked.response.status, 200, 'Account can sign in after lock expires')
  check((await db.collection('users').findOne({ username: 'testadmin' })).loginAttempts, 0, 'Successful sign-in resets failed attempts')
  const adminCookie = unlocked.response.headers.get('set-cookie').split(';')[0]
  await db.collection('users').updateOne({ username: 'testadmin' }, { $set: { passwordChangedAt: new Date(Date.now() + 1000) } })
  check((await request('/admin/cms', { cookie: adminCookie })).response.status === 200, false, 'Changing password invalidates older sessions')
  const list = await request('/api/admin/projects', { cookie: dev })
  check(list.data.projects.length, 37, 'All 37 original projects preserved by initialization')
  check((await request('/api/admin/projects', { cookie: dev })).data.projects.length, 37, 'Initialization is idempotent')
  const { version: _version, updatedAt: _updatedAt, ...source } = list.data.projects[0]
  const project = { ...source, id: 'cms-integration-test', title: 'CMS integration portfolio', english: { ...source.english, title: 'CMS integration English' } }
  const payload = { project, submissionId: randomUUID() }
  check((await request('/api/admin/projects', { cookie: viewer, method: 'POST', body: payload })).response.status, 403, 'Viewer cannot save')
  check((await request('/api/admin/projects', { cookie: dev, method: 'POST', body: payload, origin: 'https://untrusted.invalid' })).response.status, 403, 'Cross-origin save rejected')
  check((await request('/api/admin/projects', { cookie: editor, method: 'POST', body: payload })).response.status, 200, 'Editor can create directly')
  check((await request('/api/admin/projects', { cookie: editor, method: 'POST', body: payload })).response.status, 200, 'Create retry is idempotent')
  check(await db.collection('portfolioprojects').countDocuments({ _id: project.id }), 1, 'Retry created exactly one record')
  check((await request(`/api/admin/projects?submissionId=${payload.submissionId}`, { cookie: editor })).data.status, 'saved', 'Uncertain save lookup recovers successful outcome')
  const page = await request('/en/projects')
  check(page.response.status, 200, 'English public gallery renders')
  check(page.data.includes('CMS integration English'), true, 'New content immediately appears publicly in English')
  const updated = { project: { ...project, title: 'Updated directly' }, expectedVersion: 0, submissionId: randomUUID() }
  check((await request(`/api/admin/projects/${project.id}`, { cookie: dev, method: 'PUT', body: updated })).response.status, 200, 'Direct edit succeeds')
  check((await request(`/api/admin/projects/${project.id}`, { cookie: editor, method: 'PUT', body: { ...updated, submissionId: randomUUID() } })).response.status, 409, 'Stale edit rejected')
  check((await request(`/api/admin/projects/${project.id}`, { cookie: dev, method: 'DELETE', body: { expectedVersion: 1 } })).response.status, 200, 'Delete moves project to Trash')
  check((await request(`/api/admin/projects/${project.id}`, { cookie: dev })).response.status, 404, 'Trashed project absent from active endpoint')
  check((await request('/en/projects')).data.includes('CMS integration English'), false, 'Trashed content removed from public gallery')
  const trash = await request('/api/admin/trash', { cookie: editor })
  const item = trash.data.items.find(i => i.id === project.id)
  check(Boolean(item), true, 'Project visible in Trash')
  check(Math.round((Date.parse(item.purgeAt) - Date.parse(item.deletedAt)) / 86400000), 30, 'Trash retention is 30 days')
  check((await request('/api/admin/trash', { cookie: editor, method: 'POST', body: { ...item, action: 'restore', version: 0 } })).response.status, 409, 'Stale restore rejected')
  check((await request('/api/admin/trash', { cookie: editor, method: 'POST', body: { ...item, action: 'restore' } })).response.status, 200, 'Project can be restored')
  check((await request('/en/projects')).data.includes('CMS integration English'), true, 'Restored content returns publicly')
  await db.collection('portfolioprojects').updateOne({ _id: project.id }, { $set: { deletedAt: new Date(Date.now() - 31 * 86400000), purgeAt: new Date(Date.now() - 1000) } })
  check((await request('/api/cron/trash')).response.status, 401, 'Cron rejects unauthorized requests')
  const cron = await fetch(base + '/api/cron/trash', { headers: { authorization: 'Bearer cms-test-cron-secret' } })
  check(cron.status, 200, 'Scheduled expiry runs with its secret')
  check(await db.collection('portfolioprojects').countDocuments({ _id: project.id }), 0, 'Expired project permanently removed')
  check((await request('/api/admin/projects', { cookie: dev })).data.projects.some(p => p.id === project.id), false, 'Removed records do not reappear during initialization')
  const viewerDoc = await db.collection('users').findOne({ username: 'testviewer' })
  await db.collection('users').updateOne({ _id: viewerDoc._id }, { $set: { deletedAt: new Date(), purgeAt: new Date(Date.now() + 30 * 86400000) } })
  check((await request('/api/admin/projects', { cookie: viewer })).response.status, 401, 'Trashed account loses session access')
  check((await request('/api/auth/login', { method: 'POST', body: { username: 'testviewer', password: 'Test-cms-only-2026!' } })).response.status, 401, 'Trashed account cannot log in')
  const userTrash = (await request('/api/admin/trash', { cookie: dev })).data.items.find(i => i.kind === 'user')
  check((await request('/api/admin/trash', { cookie: editor, method: 'POST', body: { ...userTrash, action: 'restore' } })).response.status, 403, 'Editor cannot restore accounts')
  check((await request('/api/admin/trash', { cookie: dev, method: 'POST', body: { ...userTrash, action: 'restore' } })).response.status, 200, 'Administrator restores account')
  check((await request('/api/admin/bootstrap', { method: 'POST', body: {} })).response.status, 401, 'Bootstrap reaches token guard without an existing session')

  const devDoc = await db.collection('users').findOne({ username: 'testdev' })
  const devId = String(devDoc._id)
  const retryId = randomUUID()
  await db.collection('cmssubmissions').insertOne({ _id: retryId, userId: devId, status: 'failed', createdAt: new Date() })
  const retryProject = { ...source, id: 'cms-failed-retry-test', title: 'Recovered save' }
  check((await request('/api/admin/projects', { cookie: dev, method: 'POST', body: { project: retryProject, submissionId: retryId } })).response.status, 200, 'Known failed receipt can retry the same save')
  check((await db.collection('cmssubmissions').findOne({ _id: retryId })).status, 'saved', 'Successful retry closes its receipt')

  const recoveringSubmission = randomUUID()
  const recoveringSrc = 'https://res.cloudinary.com/test/image/upload/v1/recovering.webp'
  const recoveringProject = { ...source, id: 'cms-uncertain-retry-test', title: 'Recovered uncertain save', cover: { ...source.cover, src: recoveringSrc } }
  check((await request('/api/admin/projects', { cookie: dev, method: 'POST', body: { project: recoveringProject, submissionId: recoveringSubmission } })).response.status, 400, 'Missing media leaves a known failed save receipt')
  check((await db.collection('cmssubmissions').findOne({ _id: recoveringSubmission })).status, 'failed', 'Failed save is recorded before retry')
  const recoveringAssetId = `vetra-team/cms/${devId}/${recoveringSubmission}/${randomUUID()}`
  await db.collection('cmsmedias').insertOne({ _id: recoveringAssetId, src: recoveringSrc, userId: devId, submissionId: recoveringSubmission, status: 'ready', protectedUntil: new Date(Date.now() + 3600000), createdAt: new Date() })
  await db.collection('cmssubmissions').updateOne({ _id: recoveringSubmission }, { $set: { status: 'saving' } })
  check(await db.collection('portfolioprojects').countDocuments({ _id: recoveringProject.id }), 0, 'Uncertain receipt has no committed project yet')
  check((await request('/api/admin/projects', { cookie: dev, method: 'POST', body: { project: recoveringProject, submissionId: recoveringSubmission } })).response.status, 200, 'Matching save retries an uncertain receipt safely')
  check(await db.collection('portfolioprojects').countDocuments({ _id: recoveringProject.id }), 1, 'Uncertain retry creates exactly one project')

  const oldSubmission = randomUUID(), freshSubmission = randomUUID()
  const publicId = `vetra-team/cms/${devId}/${oldSubmission}/${randomUUID()}`
  const reusedSrc = 'https://res.cloudinary.com/test/image/upload/v1/cms-reuse.webp'
  await db.collection('cmssubmissions').insertOne({ _id: oldSubmission, userId: devId, status: 'failed', createdAt: new Date() })
  await db.collection('cmsmedias').insertOne({ _id: publicId, src: reusedSrc, userId: devId, submissionId: oldSubmission, status: 'ready', protectedUntil: new Date(Date.now() + 3600000), createdAt: new Date() })
  const reusedProject = { ...source, id: 'cms-media-reuse-test', title: 'Reused uploaded media', cover: { ...source.cover, src: reusedSrc } }
  check((await request('/api/admin/projects', { cookie: dev, method: 'POST', body: { project: reusedProject, submissionId: freshSubmission } })).response.status, 200, 'New submission reuses same-owner media from failed receipt')
  check((await db.collection('cmsmedias').findOne({ _id: publicId })).submissionId, freshSubmission, 'Media ownership transfers to new submission before save')
  check((await request('/api/admin/media/cleanup', { cookie: dev, method: 'POST', body: { submissionId: oldSubmission } })).data.deleted, 0, 'Old submission cleanup cannot claim transferred media')
  check((await request('/api/admin/media/cleanup', { cookie: dev, method: 'POST', body: { submissionId: freshSubmission } })).data.deleted, 0, 'Cleanup preserves images referenced by saved projects')
  check(await db.collection('cmsmedias').countDocuments({ _id: publicId }), 1, 'Referenced media remains available')

  const inflightSubmission = randomUUID(), inflightId = `vetra-team/cms/${devId}/${inflightSubmission}/${randomUUID()}`
  await db.collection('cmssubmissions').insertOne({ _id: inflightSubmission, userId: devId, status: 'uploading', createdAt: new Date() })
  await db.collection('cmsmedias').insertOne({ _id: inflightId, src: '', userId: devId, submissionId: inflightSubmission, status: 'uploading', protectedUntil: new Date(Date.now() + 300000), createdAt: new Date() })
  const inflightCleanup = await request('/api/admin/media/cleanup', { cookie: dev, method: 'POST', body: { submissionId: inflightSubmission } })
  check(inflightCleanup.data.failed, 1, 'Cleanup reports an in-flight upload instead of deleting it')
  check(await db.collection('cmsmedias').countDocuments({ _id: inflightId }), 1, 'In-flight upload remains reserved')
  check((await db.collection('cmssubmissions').findOne({ _id: inflightSubmission })).status, 'abandoned', 'Cleanup closes submission against a later save')

  const uncertainSubmission = randomUUID(), uncertainId = `vetra-team/cms/${devId}/${uncertainSubmission}/${randomUUID()}`
  await db.collection('cmssubmissions').insertOne({ _id: uncertainSubmission, userId: devId, status: 'saving', createdAt: new Date() })
  await db.collection('cmsmedias').insertOne({ _id: uncertainId, src: 'https://res.cloudinary.com/test/image/upload/v1/uncertain.webp', userId: devId, submissionId: uncertainSubmission, status: 'ready', protectedUntil: new Date(), createdAt: new Date() })
  check((await request('/api/admin/media/cleanup', { cookie: dev, method: 'POST', body: { submissionId: uncertainSubmission } })).response.status, 409, 'Cleanup refuses an uncertain database save')
  check(await db.collection('cmsmedias').countDocuments({ _id: uncertainId }), 1, 'Uncertain save media remains available')

  const referencedAssetIds = Array.from({ length: 105 }, (_, i) => `vetra-team/cms/${devId}/referenced-${String(i).padStart(3, '0')}`)
  await db.collection('cmsmedias').insertMany(referencedAssetIds.map(_id => ({ _id, src: source.cover.src, userId: devId, submissionId: randomUUID(), status: 'ready', protectedUntil: new Date(Date.now() - 86400000), createdAt: new Date(Date.now() - 2 * 86400000) })))
  const staleSubmission = randomUUID(), staleId = `vetra-team/cms/${devId}/${staleSubmission}/${randomUUID()}`
  await db.collection('cmssubmissions').insertOne({ _id: staleSubmission, userId: devId, status: 'uploading', createdAt: new Date(Date.now() - 2 * 86400000) })
  await db.collection('cmsmedias').insertOne({ _id: staleId, src: 'https://res.cloudinary.com/test/image/upload/v1/stale.webp', userId: devId, submissionId: staleSubmission, status: 'ready', protectedUntil: new Date(Date.now() - 86400000), createdAt: new Date(Date.now() - 2 * 86400000) })
  check((await request('/api/admin/media/cleanup', { cookie: dev, method: 'POST', body: {} })).response.status, 200, 'Administrator can run shared media cleanup')
  check((await db.collection('cmssubmissions').findOne({ _id: staleSubmission })).status, 'abandoned', 'Shared cleanup reaches orphan behind 105 referenced media records')
  check(await db.collection('cmsmedias').countDocuments({ _id: staleId }), 1, 'Media remains tracked when provider deletion is unavailable')

  const bulkUsers = Array.from({ length: 205 }, (_, i) => ({ username: `paginationtest${String(i).padStart(3, '0')}`, email: `paginationtest${String(i).padStart(3, '0')}@example.invalid`, passwordHash: 'test-only', role: 'viewer', isActive: true, deletedAt: null, purgeAt: null, createdAt: new Date(), updatedAt: new Date() }))
  const inserted = await db.collection('users').insertMany(bulkUsers)
  const bulkIds = Object.values(inserted.insertedIds)
  const englishCookie = `${dev}; vetra-cms-locale=en`
  const usersPage5 = await request('/admin/cms/users?page=5', { cookie: englishCookie })
  check(usersPage5.response.status, 200, 'Users list renders beyond 200 accounts')
  check(/Page\s*5\s*of\s*5/.test(visibleText(usersPage5.data)), true, 'Users list paginates 209 active accounts')
  const searchedUser = await request('/admin/cms/users?q=paginationtest199', { cookie: englishCookie })
  check(searchedUser.data.includes('paginationtest199@example.invalid'), true, 'User search finds an account beyond the first page')
  check(/Page\s*1\s*of\s*1/.test(visibleText(searchedUser.data)), true, 'Search counts only matching accounts')

  // Check the HTML sent to the browser, excluding embedded scripts so the
  // translation dictionaries themselves cannot make these assertions pass.
  const localizedRoutes = [
    { path: '/admin/cms', heading: ['A clear view of your content.', 'ดูแลเว็บไซต์ของคุณได้ในที่เดียว'], title: ['Dashboard', 'ภาพรวม'], label: ['Active portfolio entries', 'ผลงานบนเว็บไซต์'] },
    { path: '/admin/cms/users?q=paginationtest199&page=1', heading: ['Users', 'ผู้ใช้'], title: ['Users', 'ผู้ใช้'], label: ['Search users', 'ค้นหาผู้ใช้'] },
    { path: '/admin/cms/projects', heading: ['Projects', 'โปรเจกต์'], title: ['Projects', 'โปรเจกต์'], label: ['Search projects', 'ค้นหาโปรเจกต์'] },
    { path: '/admin/cms/payments', heading: ['Payment links', 'ลิงก์ชำระเงิน'], title: ['Payment links', 'ลิงก์ชำระเงิน'], label: ['Search payments', 'ค้นหาการชำระเงิน'] },
  ]
  for (const locale of ['th', 'en']) {
    const cookie = locale === 'en' ? englishCookie : dev
    const index = locale === 'en' ? 0 : 1
    for (const route of localizedRoutes) {
      const { response, data: html } = await request(route.path, { cookie })
      check(response.status, 200, `${locale}: ${route.path} renders without redirecting`)
      const returnedUrl = new URL(response.url)
      check(returnedUrl.pathname + returnedUrl.search, route.path, `${locale}: CMS path and query remain intact`)
      check(new RegExp(`<html\\b[^>]*\\blang="${locale}"`).test(html), true, `${locale}: document language matches the interface`)
      const headings = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)].map(match => visibleText(match[1]))
      check(headings.includes(route.heading[index]), true, `${locale}: ${route.path} has its translated page heading`)
      check(visibleText(html).includes(route.label[index]), true, `${locale}: ${route.path} has translated controls`)
      const title = visibleText(html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? '')
      check(title.includes(route.title[index]), true, `${locale}: ${route.path} has translated browser metadata`)
      if (route.path.includes('users?')) {
        check(visibleText(html).includes('paginationtest199@example.invalid'), true, `${locale}: user search still returns the requested account`)
        check(/<input\b[^>]*name="q"[^>]*value="paginationtest199"/.test(html), true, `${locale}: user search input retains its query`)
      }
    }
  }
  const fallback = await request('/admin/cms/users?q=paginationtest199', { cookie: `${dev}; vetra-cms-locale=invalid` })
  check(fallback.response.status, 200, 'Invalid language preference does not break a protected page')
  check(/<html\b[^>]*\blang="th"/.test(fallback.data), true, 'Invalid language preference falls back to Thai')
  check(visibleText(fallback.data).includes('ค้นหาผู้ใช้'), true, 'Invalid language preference receives Thai controls')
  await db.collection('users').deleteMany({ _id: { $in: bulkIds } })

  // Leave the serve-mode UI preview with the original public portfolio and
  // working assets; these records exist only to exercise recovery paths.
  await db.collection('portfolioprojects').deleteMany({ _id: { $in: [retryProject.id, recoveringProject.id, reusedProject.id] } })
  await db.collection('cmsmedias').deleteMany({ _id: { $in: [recoveringAssetId, publicId, inflightId, uncertainId, staleId, ...referencedAssetIds] } })
  check(await db.collection('portfolioprojects').countDocuments({}), 37, 'UI preview retains the original 37 projects')
  console.log(`${checks} integration checks passed using an isolated temporary database.`)
}
