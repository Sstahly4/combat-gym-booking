export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Production: confirm Supabase Auth redirect URLs and email templates for change-email flows.
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { password, new_email } = await request.json()
    const nextEmail = String(new_email || '').trim().toLowerCase()

    if (typeof password !== 'string' || !nextEmail) {
      return NextResponse.json({ error: 'Password and new_email are required' }, { status: 400 })
    }

    if (nextEmail === user.email.toLowerCase()) {
      return NextResponse.json({ error: 'New email must be different from current email' }, { status: 400 })
    }

    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password,
    })

    if (verifyError) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 })
    }

    const { error: updateError } = await supabase.auth.updateUser({
      email: nextEmail,
    })

    if (updateError) {
      return NextResponse.json({ error: updateError.message || 'Failed to update email' }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: 'Email update initiated. Confirm the change from your inbox.',
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to update email' },
      { status: 500 }
    )
  }
}
