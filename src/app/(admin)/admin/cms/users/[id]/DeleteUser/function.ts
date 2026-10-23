// src/app/(admin)/admin/cms/users/[id]/DeleteUser/function.ts
'use server'

import { redirect } from 'next/navigation'
import { assertSameOriginStrict, getCurrentUser } from '@/lib/auth/session'
import { softDeleteUser } from '@/lib/cms/user-trash'

export async function deleteUserAction(formData: FormData) {
  const id = String(formData.get('id') ?? '')
  const rawVersion = formData.get('version')
  const version = rawVersion === null ? NaN : Number(rawVersion)
  const back = `/admin/cms/users/${encodeURIComponent(id)}`

  try {
    await assertSameOriginStrict()
  } catch {
    redirect(`${back}?err=csrf`)
  }

  const me = await getCurrentUser()
  if (!me) redirect('/admin/login?next=/admin/cms/users')

  const result = await softDeleteUser(id, { id: me.id, role: me.role }, version)
  if (!result.ok) redirect(`${back}?err=${result.code ?? 'unknown'}`)

  redirect('/admin/cms/users?deleted=1')
}
