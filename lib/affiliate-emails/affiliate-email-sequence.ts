/**
 * Affiliate lifecycle emails: immediate welcome after setup, then promoter tips ~36h later.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import type { AffiliatePayoutMethod, AffiliatePayoutRegion, AffiliateTier } from '@/lib/types/database'
import { AFFILIATE_MIN_PAYOUT_AUD } from '@/lib/affiliates/constants'
import { payoutRailLabel } from '@/lib/affiliates/payout-region'
import {
  tierCommissionPercent,
  tierProgramTitle,
  tierWelcomeHeadline,
} from '@/lib/affiliates/program-copy'
import { affiliateReferralShareUrl, affiliateReferralUrl } from '@/lib/affiliates/urls'
import {
  APP_URL,
  BRAND,
  callout,
  checkList,
  divider,
  escape,
  heading,
  linkFallback,
  panel,
  paragraph,
  partnerAccentSectionLabel,
  partnerFounderSignoff,
  partnerHelpCallout,
  partnerNumberedStepCard,
  partnerStatTilesRow,
  PARTNER_LIFECYCLE_SIGNOFF_LINE,
  primaryButton,
  renderEmail,
  sectionLabel,
  sendEmail,
  uppercaseLabel,
  detailRows,
  numberedList,
} from '@/lib/email-layout'

const TAG_WELCOME = 'affiliate-welcome'
const TAG_TIPS = 'affiliate-tips'

/** Shared copy — balance checks until self-serve dashboard ships. */
const BALANCE_UPDATE_HTML =
  "We're building out a full affiliate dashboard — in the meantime, just reply to this email anytime and we'll send you a balance update within 24 hours."

const BALANCE_UPDATE_TEXT =
  "We're building out a full affiliate dashboard — in the meantime, just reply to this email anytime and we'll send you a balance update within 24 hours."

const QUESTIONS_HELP_HTML = `<strong style="color:#1e40af;">Questions?</strong> Reply to this email anytime — a real person on our team will get back to you, usually within one business day. Founding Partners get priority.`

const CAPTION_HELP_HTML = (tierLabel: string) =>
  `<strong style="color:#1e40af;">Want help with a caption?</strong> Reply with your platform (Instagram, TikTok, or YouTube) and we'll suggest a line that fits your voice — especially for ${escape(tierLabel)}s in the early cohort.`

/** ~36 hours after welcome — cron runs daily so delivery is typically 36–48h. */
const TIPS_DELAY_MS = 36 * 60 * 60 * 1000

export type AffiliateEmailPayload = {
  affiliateId: string
  name: string
  email: string
  code: string
  tier: AffiliateTier
  payoutCountry: string
  payoutRegion: AffiliatePayoutRegion
  payoutMethod: AffiliatePayoutMethod
}

function firstName(fullName: string): string {
  const t = fullName.trim()
  if (!t) return 'there'
  return t.split(/\s+/)[0] || 'there'
}

function absUrl(path: string): string {
  const base = APP_URL().replace(/\/$/, '')
  const p = path.startsWith('/') ? path : `/${path}`
  return `${base}${p}`
}

function programLabel(tier: AffiliateTier): string {
  return tierWelcomeHeadline(tier)
}

function welcomeSubject(tier: AffiliateTier, shareUrl: string): string {
  if (tier === 'founding') {
    return `You're in — your Founding Partner link (${shareUrl})`
  }
  return `You're in — your CombatStay affiliate link is ready`
}

function tipsSubject(tier: AffiliateTier): string {
  if (tier === 'founding') {
    return 'How Founding Partners are sharing their link (quick wins)'
  }
  return '3 ways to turn your CombatStay link into bookings'
}

function sampleBioLine(tier: AffiliateTier, shareUrl: string): string {
  if (tier === 'founding') {
    return `Founding Partner @CombatStay — book Muay Thai & BJJ camps worldwide → ${shareUrl}`
  }
  return `Training abroad? I book camps through CombatStay → ${shareUrl}`
}

export async function sendAffiliateWelcomeEmail(data: AffiliateEmailPayload): Promise<boolean> {
  const name = firstName(data.name)
  const tier = data.tier
  const pct = tierCommissionPercent(tier)
  const shareUrl = affiliateReferralShareUrl(data.code)
  const refUrl = affiliateReferralUrl(data.code)
  const rail = payoutRailLabel(data.payoutRegion === 'international' ? 'international' : 'au')
  const isFounding = tier === 'founding'

  const inner = [
    heading(
      isFounding
        ? `Welcome to the founding cohort, ${escape(name)}.`
        : `You're in, ${escape(name)} — let's get you earning.`,
    ),
    paragraph(
      isFounding
        ? `You are officially a <strong>Founding Partner</strong> on CombatStay — the booking platform built for fighters, coaches, and combat sports creators. Your referral link is live. Anyone who books within 30 days of clicking it earns you <strong>${pct}% of our commission</strong> on that trip.`
        : `Your <strong>CombatStay affiliate</strong> account is set up. Your referral link is live — share it anywhere you talk about training trips and earn <strong>${pct}% of our commission</strong> when someone books within 30 days of clicking.`,
    ),
    ...(isFounding
      ? [
          callout({
            tone: 'info',
            title: 'Founding Partner',
            bodyHtml: `You're in our founding partner cohort — higher commission, early access to new gyms, and a direct line to our team. We're building this with people who live combat sports, not generic influencers.`,
          }),
        ]
      : []),
    panel(
      uppercaseLabel('Your referral link') +
        `<p style="margin:0 0 12px 0;color:${BRAND.headingText};font-size:18px;font-weight:700;font-family:ui-monospace,Menlo,monospace;letter-spacing:-0.3px;word-break:break-all;">${escape(shareUrl)}</p>` +
        detailRows([
          { label: 'Program', value: escape(tierProgramTitle(tier)) },
          { label: 'Commission', value: escape(`${pct}% of CombatStay's commission per referred booking`) },
          { label: 'Attribution', value: 'First click wins · 30-day window' },
          {
            label: 'Payouts',
            value: escape(`${rail} · ${data.payoutCountry} (details on file — encrypted)`),
          },
        ]),
    ),
    primaryButton(refUrl, 'Open your referral link'),
    linkFallback(refUrl, 'Your link:'),
    partnerAccentSectionLabel('What to do right now'),
    partnerNumberedStepCard(
      1,
      'Drop the link in your bio',
      `Paste ${shareUrl} in your Instagram, TikTok, or Linktree bio — clean, no tracking junk, easy to remember.`,
      refUrl,
      'View link',
    ),
    partnerNumberedStepCard(
      2,
      'Share when you talk trips',
      'Post about camps you have done, gyms you rate, or "where I book training holidays" — your personal recommendation converts better than a cold ad.',
      absUrl('/affiliate'),
      'Affiliate program',
    ),
    partnerNumberedStepCard(
      3,
      'Keep it visible for 30 days',
      'Attribution lasts 30 days from first click. Someone can discover you today and book next week — you still get credit.',
      refUrl,
      'Your link',
    ),
    divider(),
    sectionLabel('What happens next'),
    numberedList([
      `When a referred booking completes, commission is <strong>confirmed 14 days after the cancellation window closes</strong> — our standard hold for chargebacks and date changes.`,
      `We run <strong>monthly payouts</strong> once your approved balance clears <strong>$${AFFILIATE_MIN_PAYOUT_AUD} AUD</strong>. Smaller amounts roll forward to the next month.`,
      `${BALANCE_UPDATE_HTML} You'll also get a follow-up email in the next day or two with caption ideas for your bio.`,
    ]),
    partnerStatTilesRow([
      { figure: `${pct}%`, caption: 'Of our commission on each referred booking.' },
      { figure: '30d', caption: 'Attribution window from first click.' },
      { figure: `$${AFFILIATE_MIN_PAYOUT_AUD}`, caption: 'Minimum monthly payout (AUD).' },
    ]),
    partnerHelpCallout(QUESTIONS_HELP_HTML),
    partnerFounderSignoff(PARTNER_LIFECYCLE_SIGNOFF_LINE),
  ].join('')

  const html = renderEmail({
    eyebrow: isFounding ? 'Founding Partner' : 'Affiliate program',
    title: tierProgramTitle(tier),
    preheader: `${name}, your link ${shareUrl} is live — here's how to share it.`,
    innerHtml: inner,
  })

  const text = `Hi ${name},

You're in — ${tierProgramTitle(tier)}

Your link: ${shareUrl}
Full URL: ${refUrl}

Commission: ${pct}% of CombatStay's commission per referred booking
Attribution: first click wins, 30-day window
Payouts: ${rail}, ${data.payoutCountry}

What to do now:
1) Add ${shareUrl} to your bio
2) Share when you talk about training trips
3) Attribution lasts 30 days from first click

What happens next:
- Commissions confirm 14 days after the cancellation window closes
- Monthly payouts when balance clears $${AFFILIATE_MIN_PAYOUT_AUD} AUD
- ${BALANCE_UPDATE_TEXT}

${PARTNER_LIFECYCLE_SIGNOFF_LINE}`

  return sendEmail({
    to: data.email,
    subject: welcomeSubject(tier, shareUrl),
    html,
    text,
    tag: TAG_WELCOME,
  })
}

export async function sendAffiliateTipsEmail(data: AffiliateEmailPayload): Promise<boolean> {
  const name = firstName(data.name)
  const tier = data.tier
  const pct = tierCommissionPercent(tier)
  const shareUrl = affiliateReferralShareUrl(data.code)
  const refUrl = affiliateReferralUrl(data.code)
  const isFounding = tier === 'founding'
  const bioSample = sampleBioLine(tier, shareUrl)

  const inner = [
    heading(isFounding ? `${escape(name)}, here's what converts.` : `Quick wins for your link, ${escape(name)}.`),
    paragraph(
      isFounding
        ? `Founding Partners who earn consistently don't spam their link — they <strong>recommend specific gyms and trips</strong> they believe in, then leave ${escape(shareUrl)} where people can act. A few patterns that work in combat sports:`
        : `The affiliates who earn aren't passive link-droppers. They talk about <strong>real trips and gyms</strong>, then leave ${escape(shareUrl)} where followers can book. Here's what works:`,
    ),
    checkList([
      `<strong>Personal proof</strong> — "I trained at [gym] in [city] last month — booked through my link below." Fighters trust fighters.`,
      `<strong>Specific over generic</strong> — "Best beginner Muay Thai camp in Chiang Mai" beats "check out this booking site."`,
      `<strong>One clear CTA</strong> — bio link, pinned comment, or end of a reel — not buried in paragraph seven.`,
      `<strong>Repeat gently</strong> — mention it when you post trip content, not every single story. Consistency beats noise.`,
    ]),
    partnerAccentSectionLabel('Sample bio line — copy and tweak'),
    panel(
      `<p style="margin:0;color:${BRAND.bodyText};font-size:14px;line-height:1.65;font-family:ui-monospace,Menlo,monospace;">${escape(bioSample)}</p>`,
    ),
    paragraph(
      `You earn <strong>${pct}% of CombatStay's commission</strong> on every booking that clears — same terms as your welcome email. First click within 30 days gets you the credit.`,
      { muted: true },
    ),
    divider(),
    sectionLabel('Tracking & payouts'),
    numberedList([
      `We log clicks and bookings against <strong>${escape(data.code)}</strong> automatically on our side.`,
      `Commissions confirm after the cancellation window plus 14 days. Payouts run monthly once your balance clears <strong>$${AFFILIATE_MIN_PAYOUT_AUD} AUD</strong>.`,
      BALANCE_UPDATE_HTML,
    ]),
    primaryButton(refUrl, 'Open your referral link'),
    linkFallback(refUrl),
    partnerHelpCallout(CAPTION_HELP_HTML(programLabel(tier))),
    partnerFounderSignoff(PARTNER_LIFECYCLE_SIGNOFF_LINE),
  ].join('')

  const html = renderEmail({
    eyebrow: isFounding ? 'Founding Partner' : 'Affiliate program',
    title: 'Make the most of your link',
    preheader: `Caption ideas, what converts, and how payouts work — ${shareUrl}`,
    innerHtml: inner,
  })

  const text = `Hi ${name},

${isFounding ? 'Founding Partner tips' : 'Affiliate tips'}

Your link: ${shareUrl}

What converts:
- Personal proof from trips you have done
- Specific gym/city recommendations
- One clear CTA in bio or pinned comment
- Mention when you post trip content, not every story

Sample bio:
${bioSample}

Tracking & payouts:
- We log clicks and bookings for code ${data.code} automatically
- Commissions confirm after the cancellation window plus 14 days; monthly payouts above $${AFFILIATE_MIN_PAYOUT_AUD} AUD
- ${BALANCE_UPDATE_TEXT}

${refUrl}

${PARTNER_LIFECYCLE_SIGNOFF_LINE}`

  return sendEmail({
    to: data.email,
    subject: tipsSubject(tier),
    html,
    text,
    tag: TAG_TIPS,
  })
}

/** Send welcome email once after setup completes. Best-effort — never throws. */
export async function trySendAffiliateWelcomeAfterSetup(
  admin: SupabaseClient,
  payload: AffiliateEmailPayload,
): Promise<void> {
  const { data: row } = await admin
    .from('affiliates')
    .select('welcome_email_sent_at, setup_completed_at')
    .eq('id', payload.affiliateId)
    .maybeSingle()

  if (!row?.setup_completed_at || row.welcome_email_sent_at) return

  const ok = await sendAffiliateWelcomeEmail(payload)
  if (!ok) {
    console.warn('[affiliate-email] welcome send failed', { affiliateId: payload.affiliateId })
    return
  }

  const now = new Date().toISOString()
  const { error } = await admin
    .from('affiliates')
    .update({
      welcome_email_sent_at: now,
      email_sequence_anchor_at: now,
      updated_at: now,
    })
    .eq('id', payload.affiliateId)
    .is('welcome_email_sent_at', null)

  if (error) {
    console.warn('[affiliate-email] welcome stamp failed', {
      affiliateId: payload.affiliateId,
      message: error.message,
    })
  }
}

export async function runAffiliateOnboardingEmailCron(admin: SupabaseClient): Promise<{
  tips_sent: number
  errors: number
}> {
  let tips_sent = 0
  let errors = 0

  const tipsCutoff = new Date(Date.now() - TIPS_DELAY_MS).toISOString()

  const { data: rows, error: qErr } = await admin
    .from('affiliates')
    .select(
      'id, name, email, code, tier, payout_country, payout_region, payout_method, welcome_email_sent_at, tips_email_sent_at, email_sequence_anchor_at, setup_completed_at',
    )
    .not('welcome_email_sent_at', 'is', null)
    .is('tips_email_sent_at', null)
    .not('email_sequence_anchor_at', 'is', null)
    .lte('email_sequence_anchor_at', tipsCutoff)
    .not('setup_completed_at', 'is', null)
    .limit(80)

  if (qErr) {
    console.error('[affiliate-email] cron tips query', qErr)
    return { tips_sent: 0, errors: 1 }
  }

  for (const row of rows || []) {
    try {
      if (!row.email || !row.code || !row.name) continue

      const tier: AffiliateTier = row.tier === 'standard' ? 'standard' : 'founding'
      const payoutRegion: AffiliatePayoutRegion =
        row.payout_region === 'international' ? 'international' : 'au'
      const payoutMethod: AffiliatePayoutMethod = row.payout_method === 'paypal' ? 'paypal' : 'bank'

      const ok = await sendAffiliateTipsEmail({
        affiliateId: row.id,
        name: row.name,
        email: row.email,
        code: row.code,
        tier,
        payoutCountry: row.payout_country || 'Australia',
        payoutRegion,
        payoutMethod,
      })

      if (!ok) {
        errors++
        continue
      }

      const now = new Date().toISOString()
      const { error: uErr } = await admin
        .from('affiliates')
        .update({ tips_email_sent_at: now, updated_at: now })
        .eq('id', row.id)
        .is('tips_email_sent_at', null)

      if (uErr) {
        errors++
        continue
      }

      tips_sent++
    } catch (e) {
      console.error('[affiliate-email] tips row', row.id, e)
      errors++
    }
  }

  return { tips_sent, errors }
}
