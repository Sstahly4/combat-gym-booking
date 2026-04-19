export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const email = String(body?.email || '').trim().toLowerCase()
    const fullName = String(body?.full_name || '').trim()
    const gymName = String(body?.gym_name || '').trim()
    const phone = String(body?.phone || '').trim()

    if (!email || !fullName || !gymName || !phone) {
      return NextResponse.json(
        { error: 'Email, full name, gym name, and phone are required' },
        { status: 400 }
      )
    }

    const admin = createAdminClient()
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin
    const redirectTo = `${appUrl}/auth/callback?redirect=${encodeURIComponent('/manage/security-onboarding?entry=self-serve')}`
    const issuedAt = new Date()
    const expiresAt = new Date(issuedAt.getTime() + 24 * 60 * 60 * 1000)

    const { error } = await admin.auth.admin.inviteUserByEmail(email, {
      redirectTo,
      data: {
        full_name: fullName,
        role_intent: 'owner',
        onboarding_gym_name: gymName,
        onboarding_phone: phone,
        onboarding_entry: 'self_serve',
        onboarding_link_issued_at: issuedAt.toISOString(),
        onboarding_link_expires_at: expiresAt.toISOString(),
      },
    })

    if (error) {
      return NextResponse.json({ error: error.message || 'Failed to send verification email' }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      expires_at: expiresAt.toISOString(),
      ttl_hours: 24,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to start self-serve onboarding' },
      { status: 500 }
    )
  }
}
