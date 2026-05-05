import { Resend } from 'resend'

import {
  APP_URL,
  BRAND,
  escape,
  heading,
  paragraph,
  PARTNER_LIFECYCLE_SIGNOFF_LINE,
  partnerAccentSectionLabel,
  partnerFounderSignoff,
  partnerHelpCallout,
  partnerStatTilesRow,
  renderEmail,
} from '@/lib/email-layout'

function opsInbox(): string | null {
  const direct = process.env.OPS_PARTNER_AGREEMENT_EMAIL?.trim()
  if (direct) return direct
  const admin = process.env.ADMIN_EMAIL?.trim()
  if (admin) return admin
  return null
}

function manageOrigin(): string {
  return `${APP_URL().replace(/\/$/, '')}/manage`
}

function partnerEmailInnerHtml(params: { signatoryName: string; gymName: string }): string {
  const first = escape(params.signatoryName.split(/\s+/)[0] || 'there')
  const hub = manageOrigin()
  return [
    heading('Your signed Partner Agreement'),
    paragraph(
      `Hi ${first}, attached is the <strong>executed PDF</strong> of your CombatStay Partner Agreement for <strong>${escape(params.gymName)}</strong>. It matches the terms you scrolled through in Partner Hub, with your legal name, acceptance time (UTC), and IP address recorded so both sides have a clear audit trail.`,
    ),
    paragraph(
      'Save the attachment with your other business records. If you replace devices or need another copy later, reply to this email and we will re-send it.',
    ),
    partnerAccentSectionLabel('While you have the PDF open'),
    partnerStatTilesRow([
      { figure: '15%', caption: 'Commission only. No monthly fees.' },
      { figure: '0', caption: 'Upfront costs to get listed.' },
      { figure: '1', caption: 'Platform built for combat sports.' },
    ]),
    partnerHelpCallout(
      `<strong style="color:#1e40af;">Questions about clauses or payouts?</strong> Reply to this email — we help founding partners interpret Stripe setup, settlement timing, and anything in the agreement that feels unclear. You can also browse the <a href="${manageOrigin()}/help" style="color:${BRAND.linkColor};font-weight:600;text-decoration:none;">Partner Help Centre</a>.`,
    ),
    paragraph(
      `When you are ready, jump back into <a href="${hub}" style="color:${BRAND.linkColor};font-weight:600;text-decoration:none;">Partner Hub</a> to manage your listing, packages, and payout settings.`,
    ),
    partnerFounderSignoff(PARTNER_LIFECYCLE_SIGNOFF_LINE),
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
      `<strong>${escape(params.signatoryName)}</strong> (${escape(params.signatoryEmail)}) accepted version <strong>${escape(params.version)}</strong> for listing <strong>${escape(params.gymName)}</strong>. The executed PDF is attached for your records.`,
    ),
    paragraph(
      'If anything looks off (wrong gym, wrong signatory), investigate in Partner Hub before the partner goes live.',
      { muted: true },
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
    title: 'Your signed Partner Agreement',
    preheader: `Executed PDF for ${params.gymName} — keep this for your records.`,
    innerHtml: partnerEmailInnerHtml({
      signatoryName: params.signatoryName,
      gymName: params.gymName,
    }),
  })

  const partnerText = `Hi ${params.signatoryName.split(/\s+/)[0] || 'there'},

Your executed CombatStay Partner Agreement for ${params.gymName} is attached (PDF). It records your legal name, acceptance time (UTC), and IP.

Save it with your business records. Questions? Reply to this email.
${PARTNER_LIFECYCLE_SIGNOFF_LINE}

Partner Hub: ${manageOrigin()}`

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
