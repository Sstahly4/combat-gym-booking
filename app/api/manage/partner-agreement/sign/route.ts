export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { CURRENT_PARTNER_AGREEMENT_VERSION } from '@/lib/legal/partner-agreement-document'
import { generateExecutedPartnerAgreementPdf } from '@/lib/partner-agreement/generate-executed-pdf'
import { sendExecutedPartnerAgreementEmails } from '@/lib/partner-agreement/send-executed-copy-email'

const bodySchema = z.object({
  legal_name: z.string().min(2).max(200),
  i_agree: z.literal(true),
  gym_id: z.string().uuid().optional(),
})

function normName(s: string): string {
  return s.trim().replace(/\s+/g, ' ').toLowerCase()
}

function clientIp(request: NextRequest): string | null {
  const xf = request.headers.get('x-forwarded-for')
  if (xf) {
    const first = xf.split(',')[0]?.trim()
    if (first) return first.slice(0, 80)
  }
  const real = request.headers.get('x-real-ip')
  if (real) return real.trim().slice(0, 80)
  return null
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser()
    if (authErr || !user?.id || !user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const json = await request.json().catch(() => null)
    const parsed = bodySchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Legal name and acceptance are required.', details: parsed.error.flatten() },
        { status: 400 },
      )
    }
    const { legal_name: legalName, i_agree: _iAgree, gym_id: gymIdBody } = parsed.data

    const admin = createAdminClient()
    const { data: profile, error: profErr } = await admin
      .from('profiles')
      .select(
        'id, role, full_name, placeholder_account, partner_agreement_signed_at, partner_agreement_version',
      )
      .eq('id', user.id)
      .maybeSingle()

    if (profErr || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    if (profile.role !== 'owner') {
      return NextResponse.json(
        { error: 'Only listing owners can accept the partner agreement here.' },
        { status: 403 },
      )
    }

    if (profile.placeholder_account) {
      return NextResponse.json(
        { error: 'Finish claiming your account first, then accept the partner agreement.' },
        { status: 400 },
      )
    }

    const profileName = (profile.full_name || '').trim()
    if (profileName) {
      if (normName(legalName) !== normName(profileName)) {
        return NextResponse.json(
          {
            error:
              'The name you typed must match the legal name on your account (Basic Info). Update Basic Info if your legal name changed.',
            code: 'LEGAL_NAME_MISMATCH',
          },
          { status: 400 },
        )
      }
    } else if (legalName.trim().length < 4) {
      return NextResponse.json(
        { error: 'Add your full legal name in Basic Info first, then try again.' },
        { status: 400 },
      )
    }

    const alreadyCurrent =
      profile.partner_agreement_signed_at &&
      profile.partner_agreement_version === CURRENT_PARTNER_AGREEMENT_VERSION
    if (alreadyCurrent) {
      return NextResponse.json({
        success: true,
        already_signed: true,
        version: CURRENT_PARTNER_AGREEMENT_VERSION,
      })
    }

    const { data: gym, error: gymErr } = gymIdBody
      ? await admin
          .from('gyms')
          .select('id, name, country')
          .eq('owner_id', user.id)
          .eq('id', gymIdBody)
          .maybeSingle()
      : await admin
          .from('gyms')
          .select('id, name, country')
          .eq('owner_id', user.id)
          .order('created_at', { ascending: true })
          .limit(1)
          .maybeSingle()

    if (gymErr || !gym?.name) {
      return NextResponse.json(
        { error: 'Create your listing draft first (Basic Info), then accept the partner agreement.' },
        { status: 400 },
      )
    }

    const signedAt = new Date().toISOString()
    const ip = clientIp(request)

    const { error: updErr } = await admin
      .from('profiles')
      .update({
        partner_agreement_signed_at: signedAt,
        partner_agreement_ip: ip,
        partner_agreement_version: CURRENT_PARTNER_AGREEMENT_VERSION,
        partner_agreement_signatory_name: legalName.trim(),
        updated_at: signedAt,
      })
      .eq('id', user.id)

    if (updErr) {
      console.error('[partner-agreement/sign]', updErr)
      return NextResponse.json({ error: 'Could not save acceptance. Try again.' }, { status: 500 })
    }

    await admin.from('security_events').insert({
      user_id: user.id,
      event_type: 'partner_agreement_signed',
      metadata: {
        version: CURRENT_PARTNER_AGREEMENT_VERSION,
        gym_id: gym.id,
      },
    })

    let emailOk = true
    try {
      const pdfBytes = await generateExecutedPartnerAgreementPdf({
        signatoryName: legalName.trim(),
        signatoryEmail: user.email,
        gymName: gym.name,
        gymCountry: gym.country ?? null,
        signedAtIso: signedAt,
        clientIp: ip,
      })
      const { partnerOk, opsOk } = await sendExecutedPartnerAgreementEmails({
        partnerEmail: user.email,
        signatoryName: legalName.trim(),
        gymName: gym.name,
        pdfBytes,
        agreementVersion: CURRENT_PARTNER_AGREEMENT_VERSION,
      })
      emailOk = partnerOk && (opsOk !== false)
    } catch (e) {
      console.error('[partner-agreement/sign] pdf/email', e)
      emailOk = false
    }

    return NextResponse.json({
      success: true,
      already_signed: false,
      version: CURRENT_PARTNER_AGREEMENT_VERSION,
      email_sent: emailOk,
    })
  } catch (e: unknown) {
    console.error('[partner-agreement/sign]', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Unexpected error' },
      { status: 500 },
    )
  }
}
