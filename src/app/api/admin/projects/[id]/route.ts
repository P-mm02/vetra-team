import { NextResponse } from 'next/server'
import { cmsActor, cmsError, CmsError, readJson } from '@/lib/cms/http'
import { initializePortfolio, moveProjectToTrash, toPortfolioRecord } from '@/lib/cms/projects'
import { mediaConfigured } from '@/lib/cms/media'
import { canEditPortfolio, versionSchema } from '@/lib/portfolio'
import { Project } from '@/lib/cms/models'
import { saveProject } from '@/lib/cms/save-project'
type Context = { params: Promise<{ id: string }> }
export async function GET(_req: Request, ctx: Context) {
  try {
    const actor = await cmsActor(); await initializePortfolio()
    const project = await Project.findOne({ _id: (await ctx.params).id, deletedAt: null }).lean()
    if (!project) throw new CmsError('This project could not be found.', 404)
    return NextResponse.json({ project: toPortfolioRecord(project), canEdit: canEditPortfolio(actor.role), mediaConfigured: mediaConfigured() })
  } catch (e) { return cmsError(e) }
}
export async function PUT(req: Request, ctx: Context) {
  try { const actor = await cmsActor(true); return NextResponse.json({ project: await saveProject(await readJson(req), actor.id, (await ctx.params).id) }) }
  catch (e) { return cmsError(e) }
}
export async function DELETE(req: Request, ctx: Context) {
  try {
    await cmsActor(true)
    const version = versionSchema.safeParse((await readJson(req)).expectedVersion)
    if (!version.success) throw new CmsError('Reload before moving this project to Trash.', 409)
    await moveProjectToTrash((await ctx.params).id, version.data)
    return NextResponse.json({ ok: true })
  } catch (e) { return cmsError(e) }
}
