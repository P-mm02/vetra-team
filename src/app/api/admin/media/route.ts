import { NextResponse } from 'next/server'
import { cmsActor, cmsError, CmsError } from '@/lib/cms/http'
import { uploadImage } from '@/lib/cms/media'
import { submissionSchema } from '@/lib/portfolio'
export async function POST(req: Request) {
  try {
    const actor = await cmsActor(true)
    if (Number(req.headers.get('content-length') || 0) > 4400000) throw new CmsError('Prepare images smaller than 4 MB.', 413)
    const form = await req.formData()
    const file = form.get('file'), submission = submissionSchema.safeParse(form.get('submissionId')), key = submissionSchema.safeParse(form.get('uploadKey'))
    if (!(file instanceof File) || !submission.success || !key.success) throw new CmsError('Invalid upload request.')
    return NextResponse.json(await uploadImage(file, submission.data, key.data, actor.id))
  } catch (e) { return cmsError(e) }
}
