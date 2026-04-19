export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getOwnerOrAdminAccessContext } from '@/lib/auth/owner-guard'
import { RESIDENCE_COUNTRIES } from '@/lib/constants/residence-countries'

const residenceNames = RESIDENCE_COUNTRIES.map((c) => c.name) as [string, ...string[]]

const accountHolderSchema = z.object({
  legal_first_name: z.string().trim().min(1, 'Legal first name is required').max(100),
  legal_last_name: z.string().trim().min(1, 'Legal last name is required').max(100),
  account_holder_phone: z
    .string()
    .trim()
    .min(8, 'Enter a valid direct phone number')
    .max(25)
    .regex(/^[\d\s+().-]+$/, 'Phone may only include digits, spaces, and + ( ) . -'),
  role_at_property: z.enum(['owner', 'manager', 'authorised_operator'], {
    errorMap: () => ({ message: 'Select your role at the property' }),
  }),
  country_of_residence: z.enum(residenceNames, {
    errorMap: () => ({ message: 'Select your country of residence' }),
  }),
})

export async function POST(request: NextRequest) {
  try {
    const access = await getOwnerOrAdminAccessContext()
    if (access.status === 'no_user') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (access.status !== 'ok' || !access.user) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const { supabase, user, profile } = access

    let json: unknown
    try {
      json = await request.json()
    } catch {
      return NextResponse.json(
        { error: 'JSON body required with account holder details' },
        { status: 400 }
      )
    }

    const parsedBody = accountHolderSchema.safeParse(json)
    if (!parsedBody.success) {
      const first = parsedBody.error.flatten().fieldErrors
      const msg =
        Object.values(first).flat()[0] ||
        parsedBody.error.issues[0]?.message ||
        'Invalid account holder details'
      return NextResponse.json({ error: msg, details: parsedBody.error.flatten() }, { status: 400 })
    }

    const a = parsedBody.data
    const displayFullName = `${a.legal_first_name} ${a.legal_last_name}`.trim()

    const { error: profileUpdateError } = await supabase
      .from('profiles')
      .update({
        legal_first_name: a.legal_first_name,
        legal_last_name: a.legal_last_name,
        account_holder_phone: a.account_holder_phone,
        role_at_property: a.role_at_property,
        country_of_residence: a.country_of_residence,
        full_name: profile?.full_name?.trim() ? profile.full_name : displayFullName,
        updated_at: new Date().toISOString(),
      })
      .eq('id', access.userId)

    if (profileUpdateError) {
      return NextResponse.json(
        { error: 'Failed to save account holder profile', details: profileUpdateError.message },
        { status: 500 }
      )
    }

    const { data: existingSession } = await supabase
      .from('owner_onboarding_sessions')
      .select('id')
      .eq('owner_id', access.userId)
      .eq('state', 'in_progress')
      .order('created_at', { ascending: false })
      .maybeSingle()

    let sessionId = existingSession?.id
    if (!sessionId) {
      const { data: createdSession, error: createSessionError } = await supabase
        .from('owner_onboarding_sessions')
        .insert({
          owner_id: access.userId,
          state: 'in_progress',
          started_at: new Date().toISOString(),
        })
        .select('id')
        .single()

      if (createSessionError || !createdSession) {
        return NextResponse.json({ error: 'Failed to create onboarding session' }, { status: 500 })
      }

      sessionId = createdSession.id
    }

    const now = new Date().toISOString()
    const { error: stepError } = await supabase
      .from('owner_onboarding_steps')
      .upsert(
        {
          session_id: sessionId,
          step_key: 'security',
          completed_at: now,
          metadata: {
            source: 'security_onboarding',
            email_confirmed: Boolean(user.email_confirmed_at),
            onboarding_entry: user.user_metadata?.onboarding_entry || null,
            onboarding_gym_name: user.user_metadata?.onboarding_gym_name || null,
            onboarding_phone: user.user_metadata?.onboarding_phone || null,
            account_holder_recorded: true,
            role_at_property: a.role_at_property,
            country_of_residence: a.country_of_residence,
          },
        },
        { onConflict: 'session_id,step_key' }
      )

    if (stepError) {
      return NextResponse.json({ error: 'Failed to persist onboarding step' }, { status: 500 })
    }

    await supabase.from('security_events').insert({
      user_id: access.userId,
      event_type: 'security_onboarding_completed',
      metadata: { completed_at: now, account_holder_recorded: true },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to complete security step' }, { status: 500 })
  }
}
