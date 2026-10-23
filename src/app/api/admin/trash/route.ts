import { NextResponse } from 'next/server'
import { cmsActor, cmsError, CmsError, readJson } from '@/lib/cms/http'
import { Project } from '@/lib/cms/models'
import { purgeExpiredProjects } from '@/lib/cms/projects'
import { listTrashedUsers, purgeExpiredUsers, restoreTrashedUser } from '@/lib/cms/user-trash'
import { canEditPortfolio, canManageUsers, versionSchema } from '@/lib/portfolio'
export const dynamic = 'force-dynamic'
export async function GET() {
  try {
    const actor = await cmsActor()
    if (!canEditPortfolio(actor.role)) throw new CmsError('Trash is available to editors and administrators.', 403)
    await purgeExpiredProjects(); await purgeExpiredUsers()
    const projects = await Project.find({ deletedAt: { $ne: null }, purgeAt: { $gt: new Date() } }).lean()
    const users = canManageUsers(actor.role) ? await listTrashedUsers(actor) : []
    const items = [...projects.map(p => ({ id: p._id, kind: 'project', title: p.data.title, deletedAt: p.deletedAt!.toISOString(), purgeAt: p.purgeAt!.toISOString(), version: p.version })), ...users]
    items.sort((a, b) => b.deletedAt.localeCompare(a.deletedAt))
    return NextResponse.json({ items, canRestore: true })
  } catch (e) { return cmsError(e) }
}
export async function POST(req: Request) {
  try {
    const actor = await cmsActor(true), body = await readJson(req)
    const version = versionSchema.safeParse(body.version)
    if (body.action !== 'restore' || !version.success || typeof body.id !== 'string') throw new CmsError('Invalid restore request.')
    if (body.kind === 'project') {
      const restored = await Project.findOneAndUpdate({ _id: body.id, version: version.data, deletedAt: { $ne: null }, purgeAt: { $gt: new Date() } }, { $set: { deletedAt: null, purgeAt: null, updatedAt: new Date() }, $inc: { version: 1 } })
      if (!restored) throw new CmsError('This item changed or its restoration period expired. Refresh Trash.', 409)
    } else if (body.kind === 'user') {
      const result = await restoreTrashedUser(body.id, actor, version.data)
      if (!result.ok) throw new CmsError(`Could not restore this account (${result.code || 'conflict'}). Refresh Trash.`, result.code === 'forbidden' ? 403 : 409)
    } else throw new CmsError('Unknown item type.')
    return NextResponse.json({ ok: true })
  } catch (e) { return cmsError(e) }
}
