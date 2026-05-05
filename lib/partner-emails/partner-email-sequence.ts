/**
 * Partner gym lifecycle emails: welcome, dynamic checklist (from getGymReadiness),
 * and a nudge when still not live. Sends via Resend through ./email-layout.
 */
import type { SupabaseClient } from '@supabase/supabase-js'

import { getGymReadiness, type GymReadinessResult } from '@/lib/onboarding/readiness'
import {
  APP_URL,
  BRAND,
  divider,
  escape,
  heading,
  linkFallback,
  paragraph,
  primaryButton,
  renderEmail,
  sectionLabel,
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
  return `${paragraph(
    `<strong>${escape(gymName)}</strong> — ${passed} of ${total} required checks are done before you can go live.`,
  )}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${rows.join('')}</table>`
}

function firstIncompleteCta(readiness: GymReadinessResult): { href: string; label: string } {
  const miss = readiness.required.find((r) => !r.passed)
  if (miss) return { href: absUrl(miss.deepLink), label: `Continue: ${miss.label}` }
  return { href: absUrl('/manage'), label: 'Open Partner Hub' }
}

export async function sendPartnerWelcomeEmail(params: {
  to: string
  fullName: string | null
}): Promise<boolean> {
  const name = firstName(params.fullName, 'there')
  const hub = absUrl('/manage')
  const inner = [
    heading(`Welcome, ${escape(name)}`),
    paragraph(
      `Your CombatStay partner account is ready. Use Partner Hub to finish your listing, connect payouts, and go live when you are ready.`,
    ),
    primaryButton(hub, 'Open Partner Hub'),
    linkFallback(hub),
  ].join('')

  const html = renderEmail({
    eyebrow: 'Partner Hub',
    title: 'Welcome to CombatStay',
    preheader: `You are in — open Partner Hub to finish your listing.`,
    innerHtml: inner,
  })

  const text = `Welcome, ${name}

Your CombatStay partner account is ready. Open Partner Hub to finish your listing and go live:
${hub}

— CombatStay`

  return sendEmail({
    to: params.to,
    subject: 'Welcome to CombatStay — your Partner Hub is ready',
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
    heading(`Finish going live, ${escape(name)}`),
    paragraph(
      `Here is what is left for <strong>${escape(params.gymName)}</strong> based on your account right now. Tap any open item to jump straight in.`,
    ),
    sectionLabel('Your checklist'),
    readinessChecklistHtml(params.readiness, params.gymName),
    divider(),
    paragraph(
      `Sign your <strong>Partner Agreement</strong> under <strong>Settings → Payouts</strong> (required before you can go live). You can also complete it from onboarding Step 4 (Policies).`,
      { muted: true },
    ),
    primaryButton(cta.href, cta.label),
    linkFallback(cta.href),
  ].join('')

  const html = renderEmail({
    eyebrow: 'Partner Hub',
    title: 'Next steps for your listing',
    preheader: `Your personalised go-live checklist for ${params.gymName}.`,
    innerHtml: inner,
  })

  const lines = params.readiness.required
    .map((r) => `${r.passed ? '[x]' : '[ ]'} ${r.label}${r.passed ? '' : ` — ${absUrl(r.deepLink)}`}`)
    .join('\n')

  const text = `Hi ${name},

Here is your current go-live checklist for ${params.gymName}:

${lines}

Open Partner Hub: ${absUrl('/manage')}

Primary next step: ${cta.label}
${cta.href}

— CombatStay`

  return sendEmail({
    to: params.to,
    subject: `Your CombatStay checklist — ${params.gymName}`,
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
    heading(`Still finishing ${escape(params.gymName)}?`),
    paragraph(
      open.length > 0
        ? `Hi ${escape(name)} — you are almost there. Here is what is still open on your account today:`
        : `Hi ${escape(name)} — your checklist looks complete. Head to Partner Hub to submit for review and go live when you are ready.`,
    ),
    open.length > 0
      ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${open
          .map(
            (r) =>
              `<tr><td style="padding:0 0 10px 0;color:${BRAND.bodyText};font-size:14px;line-height:1.55;">⬜ <strong>${escape(r.label)}</strong> — <a href="${absUrl(r.deepLink)}" style="color:${BRAND.linkColor};font-weight:600;">Open</a></td></tr>`,
          )
          .join('')}</table>`
      : paragraph(`Everything in your core checklist is ticked off.`, { muted: true }),
    primaryButton(cta.href, open.length ? `Finish: ${open[0].label}` : 'Open Partner Hub'),
    linkFallback(cta.href),
    divider(),
    paragraph(
      `Questions? Reply to this email and we will help you get unstuck.`,
      { muted: true },
    ),
  ].join('')

  const html = renderEmail({
    eyebrow: 'Partner Hub',
    title: 'Need a hand finishing your listing?',
    preheader: `Quick nudge — ${params.gymName} is not live yet.`,
    innerHtml: inner,
  })

  const text = `Hi ${name},

${params.gymName} is not live on CombatStay yet.

${open.length ? `Still open:\n${open.map((r) => `- ${r.label}: ${absUrl(r.deepLink)}`).join('\n')}` : 'Your checklist looks complete — open Partner Hub to go live.'}

${cta.href}

Reply to this email if you need help.

— CombatStay`

  return sendEmail({
    to: params.to,
    subject: `Still finishing ${params.gymName}?`,
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

  const ok = await sendPartnerWelcomeEmail({
    to: email,
    fullName: profile.full_name,
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
