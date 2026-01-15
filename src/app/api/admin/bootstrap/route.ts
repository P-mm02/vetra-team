// src/app/api/admin/bootstrap/route.ts
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { connectMongo } from '@/lib/db/mongoose'
import { User } from '@/models/User/User'
import { hashPassword } from '@/lib/auth/password'

const BodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(10).max(200), // stronger than 8
})

export async function POST(req: Request) {
  const token = req.headers.get('x-bootstrap-token')
  const expected = process.env.CMS_BOOTSTRAP_TOKEN

  // ✅ Must have a server-side token set
  if (!expected) {
    return NextResponse.json(
      { ok: false, message: 'Bootstrap disabled' },
      { status: 403 }
    )
  }

  // ✅ Must provide correct token
  if (!token || token !== expected) {
    return NextResponse.json(
      { ok: false, message: 'Unauthorized' },
      { status: 401 }
    )
  }

  const json = await req.json().catch(() => null)
  const parsed = BodySchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, message: 'Invalid input' },
      { status: 400 }
    )
  }

  const { email, password } = parsed.data

  await connectMongo()

  // ✅ Only allow bootstrap when there are NO users
  const userCount = await User.estimatedDocumentCount()
  if (userCount > 0) {
    return NextResponse.json(
      { ok: false, message: 'Users already exist' },
      { status: 409 }
    )
  }

  const passwordHash = await hashPassword(password)

  const owner = await User.create({
    email: email.toLowerCase(),
    passwordHash,
    role: 'owner',
    isActive: true,
  })

  return NextResponse.json({
    ok: true,
    userId: String(owner._id),
    email: owner.email,
    role: owner.role,
  })
}
