export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validatePasswordRules } from '@/lib/auth/password-rules'

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

    const { password } = await request.json()
    if (typeof password !== 'string' || password.length === 0) {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 })
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: user.email,
      password,
    })

    if (error) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
    }

    const passwordValidation = validatePasswordRules(password)
    if (!passwordValidation.valid) {
      return NextResponse.json(
        {
          error: 'Password does not meet security requirements',
          code: 'PASSWORD_RULES_FAILED',
          details: passwordValidation.errors,
        },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true, password_rules_ok: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to verify password' },
      { status: 500 }
    )
  }
}
