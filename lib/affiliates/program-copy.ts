import type { AffiliateTier } from '@/lib/types/database'
import { AFFILIATE_MIN_PAYOUT_AUD, AFFILIATE_TIER_COMMISSION } from '@/lib/affiliates/constants'

export function tierCommissionPercent(tier: AffiliateTier): number {
  return Math.round((AFFILIATE_TIER_COMMISSION[tier] || 0.3) * 100)
}

export function tierDisplayName(tier: AffiliateTier): string {
  return tier === 'founding' ? 'Founding Partner' : 'Standard Partner'
}

/** Partner-facing welcome headline on the intake form. */
export function tierWelcomeHeadline(tier: AffiliateTier): string {
  return tier === 'founding' ? 'Founding Partner' : 'Affiliate'
}

/** Card title inside the program info box on intake. */
export function tierProgramTitle(tier: AffiliateTier): string {
  return tier === 'founding' ? 'Founding Partner Program' : 'Affiliate Program'
}

export function affiliateWelcomeBullets(tier: AffiliateTier): string[] {
  const pct = tierCommissionPercent(tier)
  return [
    `Earn ${pct}% of CombatStay's commission on every booking you refer.`,
    'Share your unique link — anyone who books within 30 days gets you the credit (first click wins).',
    'Commissions are confirmed 14 days after the cancellation window closes.',
    `Monthly payouts via bank transfer (Australia) or PayPal (international). Minimum $${AFFILIATE_MIN_PAYOUT_AUD} AUD.`,
  ]
}

export function isAffiliateSetupPending(row: {
  setup_completed_at?: string | null
  code?: string | null
}): boolean {
  return !row.setup_completed_at || !row.code
}

/** en-AU display for invite link expiry dates. */
export function formatAffiliateInviteExpiry(iso: string): string {
  return new Date(iso).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

/** Partner-facing expiry under the submit button, e.g. 28 Jun 2026 */
export function formatAffiliateSpotExpiry(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function affiliateSpotSavedExpiryNote(expiresAt: string): string {
  return `Your spot is saved — link expires ${formatAffiliateSpotExpiry(expiresAt)}`
}

/** Admin-facing note: invite links are reusable until setup is submitted. */
export function affiliateInviteLinkAdminNote(expiresAt?: string | null): string {
  const expiry = expiresAt
    ? ` Expires ${formatAffiliateInviteExpiry(expiresAt)}.`
    : ' Expires in 14 days.'
  return (
    `They can reopen the same link anytime until they complete setup.${expiry} ` +
    'Generating a new link cancels the previous one.'
  )
}

/** Partner-facing note on the onboarding form. */
export function affiliateInviteLinkPartnerNote(expiresAt: string): string {
  return affiliateSpotSavedExpiryNote(expiresAt)
}

export const AFFILIATE_INVITE_INVALID_REASON_COPY: Record<string, string> = {
  not_found: 'This invite link is not valid. Ask CombatStay to send you a fresh one.',
  used:
    'You already completed setup with this invite. Email hello@combatstay.com if you need your referral link again.',
  already_setup:
    'Your affiliate setup is already complete. Email hello@combatstay.com if you need your referral link again.',
  revoked:
    'This invite was replaced with a newer link. Open the latest message from CombatStay, or ask them to resend.',
  expired: 'This invite expired. Ask CombatStay for a new link — they can generate one in seconds.',
  missing: 'This link is incomplete. Open the original invite from CombatStay.',
  misconfigured: 'Setup is temporarily unavailable. Please try again later or contact us.',
}
