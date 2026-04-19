export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getOwnerAccessContext } from '@/lib/auth/owner-guard'

const profileUpdateSchema = z.object({
  full_name: z.string().trim().max(120).optional().nullable(),
  preferred_language: z
    .string()
    .trim()
    .max(16)
    .regex(/^[A-Za-z]{2}(-[A-Za-z0-9]{2,8})?$/, { message: 'Invalid language tag' })
    .optional()
    .nullable(),
  backup_email: z
    .string()
    .trim()
    .email({ message: 'Invalid backup email' })
    .or(z.literal(''))
    .optional()
    .nullable(),
  account_holder_phone: z.string().trim().max(32).optional().nullable(),
})

export async function GET() {
  try {
    const access = await getOwnerAccessContext()
    if (access.status === 'no_user') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (access.status !== 'ok') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { data, error } = await access.supabase
      .from('profiles')
      .select('full_name, preferred_language, backup_email, account_holder_phone')
      .eq('id', access.userId)
      .single()

    if (error) return NextResponse.json({ error: 'Failed to load profile' }, { status: 500 })

    return NextResponse.json({
      profile: {
        full_name: data?.full_name ?? '',
        preferred_language: data?.preferred_language ?? '',
        backup_email: data?.backup_email ?? '',
        account_holder_phone: data?.account_holder_phone ?? '',
      },
      email: access.user?.email ?? null,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to load profile' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const access = await getOwnerAccessContext()
    if (access.status === 'no_user') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (access.status !== 'ok') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const parsed = profileUpdateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid profile fields', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const patch: Record<string, string | null> = {}
    const data = parsed.data
    if ('full_name' in data) patch.full_name = (data.full_name ?? '').trim() || null
    if ('preferred_language' in data)
      patch.preferred_language = (data.preferred_language ?? '').trim() || null
    if ('backup_email' in data) patch.backup_email = (data.backup_email ?? '').trim() || null
    if ('account_holder_phone' in data)
      patch.account_holder_phone = (data.account_holder_phone ?? '').trim() || null

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ success: true })
    }

    const { error } = await access.supabase
      .from('profiles')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('id', access.userId)

    if (error) return NextResponse.json({ error: 'Failed to save profile' }, { status: 500 })

    return NextResponse.json({ success: true, profile: patch })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to save profile' },
      { status: 500 }
    )
  }
}
