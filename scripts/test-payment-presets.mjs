import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { mkdtemp, rm } from 'node:fs/promises'
import path from 'node:path'
import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'

let checks = 0
function check(actual, expected, label) {
  assert.deepEqual(actual, expected, label)
  checks++
  console.log(`PASS ${label}`)
}
async function rejectsCode(run, code, label) {
  await assert.rejects(run, error => error?.code === code, label)
  checks++
  console.log(`PASS ${label}`)
}

// All database writes use a disposable local MongoDB. Never load .env.local.
let mongo
const dbPath = await mkdtemp(path.join(process.cwd(), '.payment-preset-test-mongo-'))
try {
  mongo = await MongoMemoryServer.create({ instance: { dbName: 'vetra_payment_presets_test', dbPath } })
  process.env.MONGODB_URI = mongo.getUri('vetra_payment_presets_test')
  process.env.NODE_ENV = 'production'
  process.env.PAYMENTS_ENABLED = 'false'
  process.env.STRIPE_SECRET_KEY = ''
  process.env.STRIPE_WEBHOOK_SECRET = ''

  const { connectMongo } = await import('../src/lib/db/mongoose.ts')
  const { User } = await import('../src/models/User/User.ts')
  const { PaymentRequest, PaymentAttempt } = await import('../src/lib/payments/models.ts')
  // Reproduce a long-running dev server that compiled the old required-field
  // model before the optional draft fields were added.
  process.env.NODE_ENV = 'development'
  const stalePresetModel = mongoose.model('PaymentPreset', new mongoose.Schema({
    details: new mongoose.Schema({
      title: { type: String, required: true }, amount: { type: String, required: true },
    }),
  }))
  const { PaymentPreset } = await import('../src/lib/payments/preset-model.ts')
  check(PaymentPreset !== stalePresetModel, true, 'Hot reload replaces the stale required-field preset model')
  check(!!PaymentPreset.schema.path('details.title')?.isRequired, false, 'Reloaded preset title is optional')
  check(!!PaymentPreset.schema.path('details.amount')?.isRequired, false, 'Reloaded preset amount is optional')
  process.env.NODE_ENV = 'production'
  const { createPaymentPreset, listPaymentPresets, updatePaymentPreset } = await import('../src/lib/payments/presets.ts')
  await connectMongo()

  const actors = {}
  for (const role of ['dev', 'admin', 'editor', 'viewer']) {
    const user = await User.create({
      username: `preset${role}`, email: `preset${role}@example.invalid`,
      passwordHash: 'isolated-test-password-hash', role, isActive: true,
    })
    actors[role] = { id: String(user._id), role }
  }

  const details = {
    gateway: 'stripe', kind: 'service', title: 'ค่าบริการเว็บไซต์รายเดือน',
    description: 'Monthly website maintenance / ดูแลเว็บไซต์', amount: '1250.50',
    customerName: 'ลูกค้าทดสอบ', customerEmail: 'customer@example.invalid',
    reference: 'CUSTOMER-REF-001', internalNote: 'Call customer before sending', expiresInDays: 90,
  }
  const input = { idempotencyKey: randomUUID(), name: 'Monthly maintenance', details }
  check((await listPaymentPresets(actors.admin)).presets, [], 'Empty preset library is readable')
  for (const role of ['editor', 'viewer']) {
    await rejectsCode(() => listPaymentPresets(actors[role]), 'PAYMENT_FORBIDDEN', `${role} cannot read saved customer information`)
    await rejectsCode(() => createPaymentPreset(actors[role], input), 'PAYMENT_FORBIDDEN', `${role} cannot save a payment preset`)
  }
  await rejectsCode(() => listPaymentPresets({ ...actors.editor, role: 'admin' }), 'PAYMENT_FORBIDDEN', 'Service rejects a forged privileged role')
  await rejectsCode(() => listPaymentPresets({ id: randomUUID(), role: 'admin' }), 'PAYMENT_FORBIDDEN', 'Service rejects an invalid actor id')

  const [created, replay] = await Promise.all([
    createPaymentPreset(actors.admin, input),
    createPaymentPreset(actors.admin, input),
  ])
  const preset = created.preset
  check(replay.preset.id, preset.id, 'Concurrent save retries return the same preset')
  check(await PaymentPreset.countDocuments({}), 1, 'Concurrent save retries store one preset')
  check(preset.details, details, 'All form details round-trip including customer, reference, note and expiry')
  check(preset.version, 0, 'New presets start at version zero')
  check(Number.isNaN(Date.parse(preset.createdAt)), false, 'Created timestamp is serializable')
  check(Object.keys(preset).sort(), ['id', 'name', 'details', 'version', 'createdAt', 'updatedAt'].sort(), 'Responses expose only preset view fields')
  check(Object.keys(preset.details).sort(), Object.keys(details).sort(), 'No payment ids, state or audit data enter preset details')
  check((await listPaymentPresets(actors.dev)).presets[0].id, preset.id, 'Developer sees administrator-created presets')
  const indexes = await PaymentPreset.collection.indexes()
  check(indexes.find(index => index.name === 'payment_preset_idempotency')?.unique, true, 'Retry uniqueness index is ensured with production autoIndex disabled')
  check((await createPaymentPreset(actors.admin, input)).preset.id, preset.id, 'Retry after a lost response recovers the original preset')
  await rejectsCode(() => createPaymentPreset(actors.admin, { ...input, name: 'Another preset' }), 'IDEMPOTENCY_CONFLICT', 'Create key cannot save different details')

  for (const invalid of [
    { ...input, unexpected: true },
    { ...input, name: 'A'.repeat(101) },
    { ...input, details: { ...details, status: 'paid' } },
    { ...input, details: { ...details, mode: 'live' } },
    { ...input, details: { ...details, idempotencyKey: randomUUID() } },
    { ...input, details: { ...details, gateway: 'ipay' } },
    { ...input, details: { ...details, customerEmail: 'invalid-email' } },
    { ...input, details: { ...details, expiresInDays: 365 } },
  ]) {
    await rejectsCode(() => createPaymentPreset(actors.admin, invalid), 'INVALID_PAYMENT_PRESET', 'Invalid or extra saved-payment fields are rejected')
  }
  for (const amount of ['9.99', '1000000', '10.001', '1e3']) {
    await rejectsCode(() => createPaymentPreset(actors.admin, { ...input, details: { ...details, amount } }), 'PAYMENT_ERROR', `Invalid saved amount ${amount} is rejected`)
  }
  check(await PaymentPreset.countDocuments({}), 1, 'Rejected saves create no preset')

  const blankDetails = {
    ...details, title: '', description: '', amount: '', customerName: '',
    customerEmail: '', reference: '', internalNote: '',
  }
  const blankInput = { idempotencyKey: randomUUID(), name: '', details: blankDetails }
  const blankPreset = (await createPaymentPreset(actors.admin, blankInput)).preset
  check(blankPreset.name, `Preset ${blankPreset.id.slice(0, 8)}`, 'An unnamed preset gets a generated selectable name')
  check(blankPreset.details, blankDetails, 'A preset can save every payment text field empty')
  check((await createPaymentPreset(actors.admin, blankInput)).preset.name,
    blankPreset.name, 'Retrying an unnamed save keeps its generated name')
  check((await listPaymentPresets(actors.dev)).presets.find(item => item.id === blankPreset.id)?.details,
    blankDetails, 'Another administrator can load a blank preset')
  const filledDraft = { ...blankDetails, title: 'Draft title', amount: '25.00' }
  const filledPreset = (await updatePaymentPreset(actors.admin, blankPreset.id, {
    expectedVersion: 0, name: '', details: filledDraft,
  })).preset
  check(filledPreset.details, filledDraft, 'An empty preset can be filled later')
  check(filledPreset.name, blankPreset.name, 'Blank name on update keeps the current preset name')
  check((await updatePaymentPreset(actors.admin, blankPreset.id, {
    expectedVersion: 1, name: '', details: blankDetails,
  })).preset.details, blankDetails, 'An existing preset can be cleared and saved')
  check(await PaymentPreset.countDocuments({}), 2, 'Blank details create one additional preset')

  const productDraft = {
    ...blankDetails, kind: 'product', title: 'ชำระค่าสินค้า และบริการ',
    description: 'ESHAN น้ำผึ้งดอกกาแฟ',
  }
  const productPreset = (await createPaymentPreset(actors.admin, {
    idempotencyKey: randomUUID(), name: 'น้ำผึ้งดอกกาแฟ', details: productDraft,
  })).preset
  check(productPreset.details, productDraft, 'Thai product draft with an empty amount saves and reloads')
  check(productPreset.name, 'น้ำผึ้งดอกกาแฟ', 'Thai preset name is retained')

  const update = { expectedVersion: 0, name: 'Updated maintenance', details: { ...details, kind: 'product', amount: '2500', expiresInDays: 7 } }
  await rejectsCode(() => updatePaymentPreset(actors.editor, preset.id, update), 'PAYMENT_FORBIDDEN', 'Editor cannot update a preset')
  const updated = await updatePaymentPreset(actors.dev, preset.id, update)
  check(updated.preset.details, update.details, 'Another privileged user can update every saved field')
  check(updated.preset.version, 1, 'Successful update increments the version')
  await rejectsCode(() => updatePaymentPreset(actors.admin, preset.id, update), 'PAYMENT_PRESET_CONFLICT', 'Stale edit cannot overwrite another user')
  check((await createPaymentPreset(actors.admin, input)).preset.version, 1, 'Original create retry recovers current preset after a later edit')
  check((await PaymentPreset.findById(preset.id).lean()).payloadFingerprint.length, 64, 'Original create fingerprint remains intact after edits')
  const raced = await Promise.allSettled([
    updatePaymentPreset(actors.admin, preset.id, { ...update, expectedVersion: 1, name: 'Race A' }),
    updatePaymentPreset(actors.dev, preset.id, { ...update, expectedVersion: 1, name: 'Race B' }),
  ])
  check(raced.filter(result => result.status === 'fulfilled').length, 1, 'Exactly one simultaneous edit succeeds')
  check(raced.find(result => result.status === 'rejected')?.reason.code, 'PAYMENT_PRESET_CONFLICT', 'Losing simultaneous edit reports a conflict')
  check((await PaymentPreset.findById(preset.id).lean()).version, 2, 'Simultaneous edits increment version only once')
  await rejectsCode(() => updatePaymentPreset(actors.admin, randomUUID(), update), 'PAYMENT_PRESET_NOT_FOUND', 'Unknown preset cannot be updated')
  await rejectsCode(() => updatePaymentPreset(actors.admin, 'invalid', update), 'PAYMENT_PRESET_NOT_FOUND', 'Malformed preset id is rejected')
  await rejectsCode(() => updatePaymentPreset(actors.admin, preset.id, { ...update, expectedVersion: -1 }), 'INVALID_PAYMENT_PRESET', 'Invalid edit version is rejected')
  await rejectsCode(() => updatePaymentPreset(actors.admin, preset.id, { ...update, expectedVersion: 2, details: { ...details, amount: '0' } }), 'PAYMENT_ERROR', 'Updates enforce amount validation')

  for (const state of [{ role: 'viewer' }, { role: 'admin', isActive: false }, { isActive: true, deletedAt: new Date() }]) {
    await User.updateOne({ _id: actors.admin.id }, { $set: state })
    await rejectsCode(() => listPaymentPresets(actors.admin), 'PAYMENT_FORBIDDEN', 'Current account state is revalidated before reading')
    await rejectsCode(() => createPaymentPreset(actors.admin, input), 'PAYMENT_FORBIDDEN', 'Current account state is revalidated before creating')
    await rejectsCode(() => updatePaymentPreset(actors.admin, preset.id, { ...update, expectedVersion: 2 }), 'PAYMENT_FORBIDDEN', 'Current account state is revalidated before updating')
  }
  await User.updateOne({ _id: actors.admin.id }, { $set: { role: 'admin', isActive: true, deletedAt: null } })

  const sameKeyOtherActor = await createPaymentPreset(actors.dev, { ...input, name: 'AAA first' })
  check(sameKeyOtherActor.preset.id !== preset.id, true, 'Creation keys are scoped to their original actor')
  await createPaymentPreset(actors.admin, { ...input, idempotencyKey: randomUUID(), name: 'AAA first' })
  check((await listPaymentPresets(actors.admin)).presets.map(item => item.name).slice(0, 2), ['AAA first', 'AAA first'], 'Names sort first and duplicate human labels remain supported')
  check(await PaymentRequest.countDocuments({}), 0, 'Saving and updating presets create no payment request')
  check(await PaymentAttempt.countDocuments({}), 0, 'Saving and updating presets create no payment attempt')
  console.log(`${checks} isolated payment preset checks passed.`)
} finally {
  await mongoose.disconnect()
  await mongo?.stop()
  if (path.dirname(path.resolve(dbPath)) === path.resolve(process.cwd())) {
    await rm(dbPath, { recursive: true, force: true })
  }
}
