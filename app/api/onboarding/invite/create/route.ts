export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { createClient } from '@/lib/supabase/server'

function generateInviteToken() {
  return randomBytes(24).toString('hex')
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const email = String(body?.email || '').trim().toLowerCase()
    const gymId = body?.gym_id ? String(body.gym_id) : null

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const token = generateInviteToken()
    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString()

    const { error: insertError } = await supabase.from('owner_invite_tokens').insert({
      token,
      email,
      gym_id: gymId,
      expires_at: expiresAt,
      created_by: user.id,
    })

    if (insertError) {
      return NextResponse.json({ error: 'Failed to create invite token' }, { status: 500 })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin
    const inviteUrl = `${appUrl}/manage/invite/${token}`

    return NextResponse.json({
      success: true,
      token,
      invite_url: inviteUrl,
      expires_at: expiresAt,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to create invite' },
      { status: 500 }
    )
  }
}
