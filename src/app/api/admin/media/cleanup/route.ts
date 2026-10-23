import { NextResponse } from 'next/server'
import { cmsActor, cmsError, CmsError, readJson } from '@/lib/cms/http'
import { cleanupMedia } from '@/lib/cms/media'
import { canManageUsers, submissionSchema } from '@/lib/portfolio'
export async function POST(req: Request) {
  try {
    const actor = await cmsActor(true), body = await readJson(req)
    const parsed = body.submissionId === undefined ? null : submissionSchema.safeParse(body.submissionId)
    if (parsed && !parsed.success) throw new CmsError('Invalid submission ID.')
    const submission = parsed?.success ? parsed.data : undefined
    if (!submission && !canManageUsers(actor.role)) throw new CmsError('Only administrators can clean up shared media.', 403)
    return NextResponse.json(await cleanupMedia(actor.id, submission))
  } catch (e) { return cmsError(e) }
}
