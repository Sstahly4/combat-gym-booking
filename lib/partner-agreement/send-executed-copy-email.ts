import { Resend } from 'resend'

import { BRAND, escape, heading, paragraph, renderEmail } from '@/lib/email-layout'

function opsInbox(): string | null {
  const direct = process.env.OPS_PARTNER_AGREEMENT_EMAIL?.trim()
  if (direct) return direct
  const admin = process.env.ADMIN_EMAIL?.trim()
  if (admin) return admin
  return null
}

function partnerEmailInnerHtml(params: {
  signatoryName: string
  gymName: string
}): string {
  return [
    heading('Your signed partner agreement'),
    paragraph(
      `Hi ${escape(params.signatoryName.split(/\s+/)[0] || 'there')}, attached is the executed copy of your CombatStay Partner Agreement for <strong>${escape(params.gymName)}</strong>. Keep this for your records.`,
    ),
    paragraph(
      'You can always return to Partner Hub to manage your listing, payouts, and policies.',
      { muted: true },
    ),
  ].join('')
}

function opsEmailInnerHtml(params: {
  signatoryName: string
  signatoryEmail: string
  gymName: string
  version: string
}): string {
  return [
    heading('Partner agreement executed'),
    paragraph(
      `<strong>${escape(params.signatoryName)}</strong> (${escape(params.signatoryEmail)}) accepted version ${escape(params.version)} for listing <strong>${escape(params.gymName)}</strong>. See attached PDF.`,
    ),
  ].join('')
}

/**
 * Emails executed PDF to the partner and the ops inbox (when configured).
 */
export async function sendExecutedPartnerAgreementEmails(params: {
  partnerEmail: string
  signatoryName: string
  gymName: string
  pdfBytes: Uint8Array
  agreementVersion: string
}): Promise<{ partnerOk: boolean; opsOk: boolean | null }> {
  const apiKey = process.env.RESEND_API_KEY
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'
  const filename = `CombatStay-partner-agreement-${params.agreementVersion.replace(/[^a-zA-Z0-9._-]+/g, '_')}.pdf`
  const attachment = {
    filename,
    content: Buffer.from(params.pdfBytes),
    content_type: 'application/pdf' as const,
  }

  if (!apiKey) {
    console.log(
      `\n📧 [partner-agreement-executed] (no RESEND_API_KEY) would email ${params.partnerEmail} + ops with PDF ${filename}\n`,
    )
    return { partnerOk: true, opsOk: true }
  }

  const resend = new Resend(apiKey)
  const ops = opsInbox()

  const partnerHtml = renderEmail({
    eyebrow: 'Partner Hub',
    title: 'Your signed partner agreement',
    preheader: `Executed copy for ${params.gymName}.`,
    innerHtml: partnerEmailInnerHtml({
      signatoryName: params.signatoryName,
      gymName: params.gymName,
    }),
  })

  const partnerText = `Your signed CombatStay Partner Agreement (executed copy) is attached for ${params.gymName}.

— ${BRAND.name}`

  const partnerResult = await resend.emails.send({
    from: fromEmail,
    to: params.partnerEmail,
    subject: `Your signed CombatStay partner agreement · ${params.gymName}`,
    html: partnerHtml,
    text: partnerText,
    tags: [{ name: 'category', value: 'partner-agreement-executed' }],
    attachments: [attachment],
  })

  const partnerOk = !partnerResult.error
  if (partnerResult.error) {
    console.error('[partner-agreement] partner email failed', partnerResult.error)
  }

  let opsOk: boolean | null = null
  if (ops && ops.toLowerCase() !== params.partnerEmail.toLowerCase()) {
    const opsHtml = renderEmail({
      eyebrow: 'Operations',
      title: 'Partner agreement executed',
      preheader: `${params.partnerEmail} · ${params.gymName}`,
      innerHtml: opsEmailInnerHtml({
        signatoryName: params.signatoryName,
        signatoryEmail: params.partnerEmail,
        gymName: params.gymName,
        version: params.agreementVersion,
      }),
    })
    const opsResult = await resend.emails.send({
      from: fromEmail,
      to: ops,
      subject: `[CombatStay] Partner agreement signed · ${params.gymName}`,
      html: opsHtml,
      text: `Partner agreement executed.\nName: ${params.signatoryName}\nEmail: ${params.partnerEmail}\nGym: ${params.gymName}\nVersion: ${params.agreementVersion}\n`,
      tags: [{ name: 'category', value: 'partner-agreement-ops-copy' }],
      attachments: [attachment],
    })
    opsOk = !opsResult.error
    if (opsResult.error) {
      console.error('[partner-agreement] ops email failed', opsResult.error)
    }
  } else if (!ops) {
    opsOk = null
    console.warn('[partner-agreement] OPS_PARTNER_AGREEMENT_EMAIL and ADMIN_EMAIL unset; ops copy skipped')
  } else {
    opsOk = true
  }

  return { partnerOk, opsOk }
}
