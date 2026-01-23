// src/app/api/admin/users/delete/[id]/route.ts
import { NextResponse } from 'next/server'
import mongoose from 'mongoose'
import { z } from 'zod'
import { connectMongo } from '@/lib/db/mongoose'
import {
  getCurrentUser,
  assertSameOriginStrict,
  revokeAllSessionsForUser,
} from '@/lib/auth/session'
import { User } from '@/models/User/User'

const ParamsSchema = z.object({
  id: z.string().min(1),
})

function canManageUsers(role: string) {
  return role === 'dev' || role === 'admin'
}

function json(
  status: number,
  message: string,
  extra?: Record<string, unknown>,
) {
  return NextResponse.json({ ok: false, message, ...(extra || {}) }, { status })
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  // ✅ strict same-origin for admin mutation
  try {
    await assertSameOriginStrict()
  } catch {
    return json(403, 'Bad origin')
  }

  const me = await getCurrentUser()
  if (!me) return json(401, 'Unauthorized')
  if (!canManageUsers(String(me.role))) return json(403, 'Forbidden')

  // ✅ Next.js 16: params is a Promise
  const { id } = await ctx.params

  const parsed = ParamsSchema.safeParse({ id })
  if (!parsed.success) return json(400, 'Invalid id')

  if (!mongoose.isValidObjectId(id)) return json(400, 'Invalid id')

  // ✅ prevent deleting yourself
  if (String(me.id) === String(id)) {
    return json(400, 'You cannot delete your own account.')
  }

  await connectMongo()

  // Need target role for policy: only dev can delete dev
  const target = await User.findById(id)
    .select({ role: 1 })
    .lean<{ _id: mongoose.Types.ObjectId; role?: string } | null>()

  if (!target) {
    // idempotent: already deleted
    return NextResponse.json({ ok: true, deleted: false, id })
  }

  const targetRole = String(target.role || 'viewer')
  const myRole = String(me.role)

  if (targetRole === 'dev' && myRole !== 'dev') {
    return json(403, 'Only dev can delete a dev user.')
  }

  await User.deleteOne({ _id: new mongoose.Types.ObjectId(id) })

  // Revoke all sessions for that user (best-effort)
  await revokeAllSessionsForUser(id).catch(() => null)

  return NextResponse.json({ ok: true, deleted: true, id })
}
