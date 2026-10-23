import crypto from 'node:crypto'
import { NextResponse } from 'next/server'
import { purgeExpiredProjects } from '@/lib/cms/projects'
import { purgeExpiredUsers } from '@/lib/cms/user-trash'
import { cmsError } from '@/lib/cms/http'
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET
  const actual = Buffer.from(req.headers.get('authorization') || '')
  const expected = Buffer.from(`Bearer ${secret || ''}`)
  if (!secret || actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try { return NextResponse.json({ projects: await purgeExpiredProjects(), users: await purgeExpiredUsers() }) }
  catch (e) { return cmsError(e) }
}
