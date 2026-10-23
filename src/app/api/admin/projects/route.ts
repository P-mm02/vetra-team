import { NextResponse } from 'next/server'
import { cmsActor, cmsError, readJson } from '@/lib/cms/http'
import { getPortfolioRecords, getSubmission } from '@/lib/cms/projects'
import { mediaConfigured } from '@/lib/cms/media'
import { canEditPortfolio, submissionSchema } from '@/lib/portfolio'
import { saveProject } from '@/lib/cms/save-project'
export const dynamic = 'force-dynamic'
export async function GET(req: Request) {
  try {
    const actor = await cmsActor()
    const submissionId = new URL(req.url).searchParams.get('submissionId')
    if (submissionId && submissionSchema.safeParse(submissionId).success) return NextResponse.json(await getSubmission(submissionId, actor.id))
    return NextResponse.json({ projects: await getPortfolioRecords(), canEdit: canEditPortfolio(actor.role), mediaConfigured: mediaConfigured() })
  } catch (e) { return cmsError(e) }
}
export async function POST(req: Request) {
  try { const actor = await cmsActor(true); return NextResponse.json({ project: await saveProject(await readJson(req), actor.id) }) }
  catch (e) { return cmsError(e) }
}
