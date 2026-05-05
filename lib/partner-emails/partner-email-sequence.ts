/**
 * Partner gym lifecycle emails: welcome, dynamic checklist (from getGymReadiness),
 * and a nudge when still not live. Sends via Resend through ./email-layout.
 */
import type { SupabaseClient } from '@supabase/supabase-js'

import { getGymReadiness, type GymReadinessResult } from '@/lib/onboarding/readiness'
import { buildOnboardingWizardUrl } from '@/lib/onboarding/owner-wizard'
import { manageSettingsPayoutsHref } from '@/lib/manage/settings-payouts-href'
import {
  APP_URL,
  BRAND,
  divider,
  escape,
  heading,
  linkFallback,
  paragraph,
  partnerAccentSectionLabel,
  PARTNER_LIFECYCLE_SIGNOFF_LINE,
  partnerFounderSignoff,
  partnerHelpCallout,
  partnerNumberedStepCard,
  partnerStatTilesRow,
  primaryButton,
  renderEmail,
  sendEmail,
} from '@/lib/email-layout'

const TAG_WELCOME = 'partner-welcome'
const TAG_CHECKLIST = 'partner-checklist'
const TAG_NUDGE = 'partner-nudge'

function appOrigin(): string {
  return APP_URL().replace(/\/$/, '')
}

function absUrl(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`
  return `${appOrigin()}${p}`
}

function firstName(fullName: string | null | undefined, fallback: string): string {
  const t = (fullName || '').trim()
  if (!t) return fallback
  return t.split(/\s+/)[0] || fallback
}

function readinessChecklistHtml(readiness: GymReadinessResult, gymName: string): string {
  const required = readiness.required
  const passed = required.filter((r) => r.passed).length
  const total = required.length
  const rows = required.map((r) => {
    const mark = r.passed ? '✅' : '⬜'
    const line = r.passed
      ? `${mark} <strong>${escape(r.label)}</strong>`
      : `${mark} <strong>${escape(r.label)}</strong> — <a href="${absUrl(r.deepLink)}" style="color:${BRAND.linkColor};font-weight:600;">Continue</a>`
    return `<tr><td style="padding:0 0 12px 0;color:${BRAND.bodyText};font-size:14px;line-height:1.55;">${line}</td></tr>`
  })
  return `${partnerAccentSectionLabel('Your checklist — live status')}
  ${paragraph(
    `<strong>${escape(gymName)}</strong> — ${passed} of ${total} required checks are complete. This list mirrors what Partner Hub uses for go-live, so you can trust every line.`,
  )}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${rows.join('')}</table>`
}

function firstIncompleteCta(readiness: GymReadinessResult): { href: string; label: string } {
  const miss = readiness.required.find((r) => !r.passed)
  if (miss) return { href: absUrl(miss.deepLink), label: `Continue: ${miss.label}` }
  return { href: absUrl('/manage'), label: 'Open Partner Hub' }
}

function welcomeStepLinks(gymId: string | null) {
  const g = gymId
  return {
    profile: absUrl(buildOnboardingWizardUrl('step-1', g)),
    photos: absUrl(buildOnboardingWizardUrl('step-3', g)),
    packages: absUrl(buildOnboardingWizardUrl('step-2', g)),
    payouts: absUrl(manageSettingsPayoutsHref(g, 'partner-agreement')),
  }
}

export async function sendPartnerWelcomeEmail(params: {
  to: string
  fullName: string | null
  /** When a draft gym already exists, deep links go straight into the right wizard step. */
  gymId: string | null
}): Promise<boolean> {
  const name = firstName(params.fullName, 'there')
  const hub = absUrl('/manage')
  const links = welcomeStepLinks(params.gymId)
  const helpHref = absUrl('/manage/help')

  const inner = [
    heading(`Welcome, ${escape(name)}. Let's get your gym in front of fighters.`),
    paragraph(
      `You are now part of the first platform built specifically for combat sports training — connecting fighters, grapplers, and coaches with serious gyms worldwide. Your <strong>Partner Hub</strong> is ready: finish the steps below and you will be set up to receive real bookings, not just another generic listing form.`,
    ),
    partnerAccentSectionLabel('Your go-live checklist'),
    partnerNumberedStepCard(
      1,
      'Complete your gym profile',
      'Add your listing name, address, disciplines, and a description fighters actually read before they book. This is the first impression they see — make it sharp.',
      links.profile,
      'Open Basic Info',
    ),
    partnerNumberedStepCard(
      2,
      'Upload at least 3 photos',
      'Show your mats, equipment, coaches, and the energy of your gym. Strong photos are one of the highest‑leverage things you can do for conversion.',
      links.photos,
      'Open Photos step',
    ),
    partnerNumberedStepCard(
      3,
      'Create your first package',
      'Set up a training camp or package with clear pricing. You can add more any time — one solid offer is enough to go live.',
      links.packages,
      'Packages & pricing',
    ),
    partnerNumberedStepCard(
      4,
      'Connect payouts & sign your Partner Agreement',
      'Connect Stripe (or complete Wise details) so we can pay you, then review and sign your Partner Agreement under Settings → Payouts. Both are required before go‑live.',
      links.payouts,
      'Payouts & agreement',
    ),
    partnerAccentSectionLabel('Why CombatStay'),
    partnerStatTilesRow([
      { figure: '15%', caption: 'Commission only. No monthly fees.' },
      { figure: '0', caption: 'Upfront costs to get listed.' },
      { figure: '1', caption: 'Platform built for combat sports.' },
    ]),
    partnerHelpCallout(
      `<strong style="color:#1e40af;">Questions? We are here.</strong> Reply to this email — a real person will get back to you quickly. We are actively onboarding founding gyms and want Stripe, packages, or listing setup to feel straightforward. You can also use the <a href="${helpHref}" style="color:${BRAND.linkColor};font-weight:600;text-decoration:none;">Partner Help Centre</a>.`,
    ),
    primaryButton(hub, 'Open Partner Hub'),
    linkFallback(hub),
    partnerFounderSignoff(PARTNER_LIFECYCLE_SIGNOFF_LINE),
  ].join('')

  const html = renderEmail({
    eyebrow: 'Partner Hub',
    title: 'Welcome to CombatStay',
    preheader: `${name}, your Partner Hub is ready — here is your go-live checklist.`,
    innerHtml: inner,
  })

  const text = `Welcome, ${name}

Let's get your gym in front of fighters.

CombatStay is built specifically for combat sports — your Partner Hub is ready at:
${hub}

Your go-live checklist:
1) Complete gym profile — ${links.profile}
2) Upload at least 3 photos — ${links.photos}
3) Create your first package — ${links.packages}
4) Connect payouts & sign Partner Agreement — ${links.payouts}

Why CombatStay: 15% commission (no monthly fees), no upfront listing fees, one platform focused on combat sports.

Questions? Reply to this email. Help: ${helpHref}

${PARTNER_LIFECYCLE_SIGNOFF_LINE}`

  return sendEmail({
    to: params.to,
    subject: "Welcome to CombatStay — let's get your gym in front of fighters",
    html,
    text,
    tag: TAG_WELCOME,
  })
}

export async function sendPartnerChecklistEmail(params: {
  to: string
  fullName: string | null
  gymName: string
  readiness: GymReadinessResult
}): Promise<boolean> {
  const name = firstName(params.fullName, 'there')
  const cta = firstIncompleteCta(params.readiness)
  const inner = [
    heading(`Your personalised checklist, ${escape(name)}`),
    paragraph(
      `You have already taken the first step by joining CombatStay. Below is exactly what Partner Hub still needs for <strong>${escape(params.gymName)}</strong> before you can flip the switch to live — same checks our go‑live engine uses, in plain language.`,
    ),
    paragraph(
      `Open any item that is not done yet; each link drops you on the right screen so you are not hunting through menus.`,
    ),
    readinessChecklistHtml(params.readiness, params.gymName),
    divider(),
    paragraph(
      `The <strong>Partner Agreement</strong> lives under <strong>Settings → Payouts</strong> (and in onboarding Step 4). It is required before go‑live so both sides have a clear record.`,
      { muted: true },
    ),
    partnerStatTilesRow([
      { figure: '15%', caption: 'Commission only. No monthly fees.' },
      { figure: '0', caption: 'Upfront costs to get listed.' },
      { figure: '1', caption: 'Platform built for combat sports.' },
    ]),
    partnerHelpCallout(
      `<strong style="color:#1e40af;">Stuck on Stripe or Wise?</strong> Reply to this email and tell us what screen you are on — we help founding partners with payouts and verification every week. For self‑serve answers, visit the <a href="${absUrl('/manage/help')}" style="color:${BRAND.linkColor};font-weight:600;text-decoration:none;">Partner Help Centre</a>.`,
    ),
    primaryButton(cta.href, cta.label),
    linkFallback(cta.href),
    partnerFounderSignoff(PARTNER_LIFECYCLE_SIGNOFF_LINE),
  ].join('')

  const html = renderEmail({
    eyebrow: 'Partner Hub',
    title: `Next steps for ${params.gymName}`,
    preheader: `Personalised go-live checklist for ${params.gymName} — tap any open item.`,
    innerHtml: inner,
  })

  const lines = params.readiness.required
    .map((r) => `${r.passed ? '[x]' : '[ ]'} ${r.label}${r.passed ? '' : ` — ${absUrl(r.deepLink)}`}`)
    .join('\n')

  const text = `Hi ${name},

Here is your current go-live checklist for ${params.gymName} (same items Partner Hub uses):

${lines}

Open Partner Hub: ${absUrl('/manage')}

Primary next step: ${cta.label}
${cta.href}

15% commission, no monthly fees. Questions? Reply to this email.
${PARTNER_LIFECYCLE_SIGNOFF_LINE}`

  return sendEmail({
    to: params.to,
    subject: `Your go-live checklist — ${params.gymName}`,
    html,
    text,
    tag: TAG_CHECKLIST,
  })
}

export async function sendPartnerNudgeEmail(params: {
  to: string
  fullName: string | null
  gymName: string
  readiness: GymReadinessResult
}): Promise<boolean> {
  const name = firstName(params.fullName, 'there')
  const open = params.readiness.required.filter((r) => !r.passed)
  const cta = firstIncompleteCta(params.readiness)

  const inner = [
    heading(`We would love to see ${escape(params.gymName)} live`),
    paragraph(
      open.length > 0
        ? `Hi ${escape(name)} — you are closer than you think. Most gyms finish the remaining steps in one focused session. Here is what is still open today:`
        : `Hi ${escape(name)} — your core checklist looks complete from here. Head into Partner Hub to confirm everything looks right, submit for review if needed, and flip your listing live when you are ready.`,
    ),
    open.length > 0
      ? `${partnerAccentSectionLabel('Still to complete')}<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${open
          .map(
            (r) =>
              `<tr><td style="padding:0 0 12px 0;color:${BRAND.bodyText};font-size:14px;line-height:1.55;">⬜ <strong>${escape(r.label)}</strong> — <a href="${absUrl(r.deepLink)}" style="color:${BRAND.linkColor};font-weight:600;">Open in Partner Hub</a></td></tr>`,
          )
          .join('')}</table>`
      : paragraph(`Everything in your core checklist is ticked off.`, { muted: true }),
    partnerStatTilesRow([
      { figure: '15%', caption: 'Commission only. No monthly fees.' },
      { figure: '0', caption: 'Upfront costs to get listed.' },
      { figure: '1', caption: 'Platform built for combat sports.' },
    ]),
    primaryButton(cta.href, open.length ? `Finish: ${open[0].label}` : 'Open Partner Hub'),
    linkFallback(cta.href),
    divider(),
    partnerHelpCallout(
      `<strong style="color:#1e40af;">Need a hand?</strong> Reply to this email with a screenshot or a one‑liner on what feels blocked — we answer founding partners personally. Stripe, Wise, packages, or copy: we have seen it all.`,
    ),
    partnerFounderSignoff(PARTNER_LIFECYCLE_SIGNOFF_LINE),
  ].join('')

  const html = renderEmail({
    eyebrow: 'Partner Hub',
    title: `${params.gymName} is almost there`,
    preheader: `Friendly nudge from CombatStay — finish the last steps when you have a moment.`,
    innerHtml: inner,
  })

  const text = `Hi ${name},

We would love to see ${params.gymName} live on CombatStay.

${open.length ? `Still open:\n${open.map((r) => `- ${r.label}: ${absUrl(r.deepLink)}`).join('\n')}` : 'Your checklist looks complete — open Partner Hub to go live.'}

${cta.href}

15% commission, no monthly fees. Reply to this email if you want a second pair of eyes on Stripe, Wise, or your listing.

${PARTNER_LIFECYCLE_SIGNOFF_LINE}`

  return sendEmail({
    to: params.to,
    subject: `Let's get ${params.gymName} live on CombatStay`,
    html,
    text,
    tag: TAG_NUDGE,
  })
}

async function pickPrimaryGymId(admin: SupabaseClient, ownerId: string): Promise<string | null> {
  const { data, error } = await admin
    .from('gyms')
    .select('id')
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()
  if (error || !data?.id) return null
  return data.id
}

/** First non-live gym (oldest), else oldest gym — for nudge/readiness when a draft remains. */
async function pickTargetGymIdForNudge(admin: SupabaseClient, ownerId: string): Promise<string | null> {
  const { data: nonLive, error: nlErr } = await admin
    .from('gyms')
    .select('id')
    .eq('owner_id', ownerId)
    .eq('is_live', false)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()
  if (!nlErr && nonLive?.id) return nonLive.id
  return pickPrimaryGymId(admin, ownerId)
}

/** Owner has at least one gym where is_live is false. */
async function ownerHasNonLiveGym(admin: SupabaseClient, ownerId: string): Promise<boolean> {
  const { count, error } = await admin
    .from('gyms')
    .select('id', { count: 'exact', head: true })
    .eq('owner_id', ownerId)
    .eq('is_live', false)
  if (error) return false
  return (count ?? 0) > 0
}

/**
 * Sends the welcome email once per owner and sets sequence anchor timestamps.
 * Skips placeholder claim accounts and non-owners.
 */
export async function trySendPartnerWelcomeSequenceStart(admin: SupabaseClient, userId: string): Promise<void> {
  const { data: profile, error: pErr } = await admin
    .from('profiles')
    .select('id, role, full_name, placeholder_account, partner_welcome_email_sent_at')
    .eq('id', userId)
    .maybeSingle()

  if (pErr || !profile || profile.role !== 'owner') return
  if (profile.placeholder_account) return
  if (profile.partner_welcome_email_sent_at) return

  const { data: authUser, error: aErr } = await admin.auth.admin.getUserById(userId)
  if (aErr || !authUser?.user?.email) return
  const email = authUser.user.email
  if (!authEmailIsConfirmed(authUser.user)) return

  const gymId = await pickPrimaryGymId(admin, userId)

  const ok = await sendPartnerWelcomeEmail({
    to: email,
    fullName: profile.full_name,
    gymId,
  })
  if (!ok) {
    console.warn('[partner-email] welcome send failed', { userId })
    return
  }

  const now = new Date().toISOString()
  const { error: uErr } = await admin
    .from('profiles')
    .update({
      partner_welcome_email_sent_at: now,
      partner_email_sequence_anchor_at: now,
      updated_at: now,
    })
    .eq('id', userId)
    .is('partner_welcome_email_sent_at', null)

  if (uErr) {
    console.warn('[partner-email] welcome profile stamp failed', { userId, message: uErr.message })
  }
}

function authEmailIsConfirmed(user: { email_confirmed_at?: string | null }): boolean {
  return Boolean(user.email_confirmed_at)
}

const CHECKLIST_DELAY_MS = 60 * 60 * 1000 // 1 hour after anchor before first checklist send
const NUDGE_MIN_MS = 3 * 24 * 60 * 60 * 1000 // 3 days after anchor

/**
 * Cron: send checklist email (once) after delay, and nudge (once) if still not live after 3 days.
 */
export async function runPartnerOnboardingEmailCron(admin: SupabaseClient): Promise<{
  checklist_sent: number
  nudge_sent: number
  errors: number
}> {
  let checklist_sent = 0
  let nudge_sent = 0
  let errors = 0

  const now = Date.now()
  const checklistCutoff = new Date(now - CHECKLIST_DELAY_MS).toISOString()
  const nudgeCutoff = new Date(now - NUDGE_MIN_MS).toISOString()

  const { data: checklistCandidates, error: cErr } = await admin
    .from('profiles')
    .select('id, full_name, partner_welcome_email_sent_at, partner_checklist_email_sent_at, partner_email_sequence_anchor_at')
    .eq('role', 'owner')
    .or('placeholder_account.eq.false,placeholder_account.is.null')
    .not('partner_welcome_email_sent_at', 'is', null)
    .is('partner_checklist_email_sent_at', null)
    .not('partner_email_sequence_anchor_at', 'is', null)
    .lte('partner_email_sequence_anchor_at', checklistCutoff)
    .limit(80)

  if (cErr) {
    console.error('[partner-email] cron checklist query', cErr)
    errors++
  } else {
    for (const row of checklistCandidates || []) {
      try {
        const sent = await trySendChecklistForProfile(admin, row.id, row.full_name)
        if (sent) checklist_sent++
      } catch (e) {
        console.error('[partner-email] checklist row', row.id, e)
        errors++
      }
    }
  }

  const { data: nudgeCandidates, error: nErr } = await admin
    .from('profiles')
    .select('id, full_name, partner_checklist_email_sent_at, partner_nudge_email_sent_at, partner_email_sequence_anchor_at')
    .eq('role', 'owner')
    .or('placeholder_account.eq.false,placeholder_account.is.null')
    .not('partner_checklist_email_sent_at', 'is', null)
    .is('partner_nudge_email_sent_at', null)
    .not('partner_email_sequence_anchor_at', 'is', null)
    .lte('partner_email_sequence_anchor_at', nudgeCutoff)
    .limit(80)

  if (nErr) {
    console.error('[partner-email] cron nudge query', nErr)
    errors++
  } else {
    for (const row of nudgeCandidates || []) {
      try {
        const hasNonLive = await ownerHasNonLiveGym(admin, row.id)
        if (!hasNonLive) {
          const nowIso = new Date().toISOString()
          await admin
            .from('profiles')
            .update({ partner_nudge_email_sent_at: nowIso, updated_at: nowIso })
            .eq('id', row.id)
            .is('partner_nudge_email_sent_at', null)
          continue
        }
        const sent = await trySendNudgeForProfile(admin, row.id, row.full_name)
        if (sent) nudge_sent++
      } catch (e) {
        console.error('[partner-email] nudge row', row.id, e)
        errors++
      }
    }
  }

  return { checklist_sent, nudge_sent, errors }
}

async function trySendChecklistForProfile(
  admin: SupabaseClient,
  userId: string,
  fullName: string | null,
): Promise<boolean> {
  const gymId = await pickPrimaryGymId(admin, userId)
  if (!gymId) {
    // No draft gym yet (e.g. self-serve before wizard creates one) — try again on the next cron run.
    return false
  }

  const { data: gym, error: gErr } = await admin.from('gyms').select('id, name').eq('id', gymId).maybeSingle()
  if (gErr || !gym?.name) return false

  const readiness = await getGymReadiness({ supabase: admin, gymId, ownerId: userId })

  const { data: authUser, error: aErr } = await admin.auth.admin.getUserById(userId)
  if (aErr || !authUser?.user?.email || !authEmailIsConfirmed(authUser.user)) return false

  const ok = await sendPartnerChecklistEmail({
    to: authUser.user.email,
    fullName,
    gymName: gym.name,
    readiness,
  })
  if (!ok) return false

  const now = new Date().toISOString()
  const { error: uErr } = await admin
    .from('profiles')
    .update({ partner_checklist_email_sent_at: now, updated_at: now })
    .eq('id', userId)
    .is('partner_checklist_email_sent_at', null)

  return !uErr
}

async function trySendNudgeForProfile(
  admin: SupabaseClient,
  userId: string,
  fullName: string | null,
): Promise<boolean> {
  const gymId = await pickTargetGymIdForNudge(admin, userId)
  if (!gymId) return false

  const { data: liveRow } = await admin.from('gyms').select('is_live').eq('id', gymId).maybeSingle()
  if (liveRow?.is_live) {
    const now = new Date().toISOString()
    await admin
      .from('profiles')
      .update({ partner_nudge_email_sent_at: now, updated_at: now })
      .eq('id', userId)
      .is('partner_nudge_email_sent_at', null)
    return false
  }

  const { data: gym, error: gErr } = await admin.from('gyms').select('id, name').eq('id', gymId).maybeSingle()
  if (gErr || !gym?.name) return false

  const readiness = await getGymReadiness({ supabase: admin, gymId, ownerId: userId })

  const { data: authUser, error: aErr } = await admin.auth.admin.getUserById(userId)
  if (aErr || !authUser?.user?.email || !authEmailIsConfirmed(authUser.user)) return false

  const ok = await sendPartnerNudgeEmail({
    to: authUser.user.email,
    fullName,
    gymName: gym.name,
    readiness,
  })
  if (!ok) return false

  const now = new Date().toISOString()
  const { error: uErr } = await admin
    .from('profiles')
    .update({ partner_nudge_email_sent_at: now, updated_at: now })
    .eq('id', userId)
    .is('partner_nudge_email_sent_at', null)

  return !uErr
}
