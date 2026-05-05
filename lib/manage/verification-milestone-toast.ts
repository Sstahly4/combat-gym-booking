/**
 * Top-right Partner Hub celebration when a verification milestone completes.
 * `ManageNoBookingsToastHost` listens for {@link VERIFICATION_MILESTONE_EVENT}.
 */

export const VERIFICATION_MILESTONE_EVENT = 'cs:verification-milestone' as const

export type VerificationMilestoneKind = 'maps' | 'social' | 'partner_agreement' | 'payouts' | 'admin'

export type VerificationMilestoneDetail = {
  kind: VerificationMilestoneKind
  /** Shown for partner agreement (e.g. account email). */
  inboxEmail?: string | null
}

export function dispatchVerificationMilestone(detail: VerificationMilestoneDetail): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(VERIFICATION_MILESTONE_EVENT, { detail }))
}

export function milestoneToastCopy(
  kind: VerificationMilestoneKind,
  inboxEmail?: string | null,
): { title: string; body: string } {
  const inbox = inboxEmail?.trim()
  switch (kind) {
    case 'maps':
      return {
        title: 'Google Maps link saved',
        body: 'Travelers can open directions straight to your gym from your listing.',
      }
    case 'social':
      return {
        title: 'Social profile linked',
        body: 'That helps us verify your gym’s presence and builds trust with guests.',
      }
    case 'partner_agreement':
      return {
        title: 'Partner Agreement signed',
        body: inbox
          ? `A PDF copy is on its way to ${inbox}.`
          : 'A PDF copy is on its way to the inbox on your account.',
      }
    case 'payouts':
      return {
        title: 'Payout details complete',
        body: 'You’re set to receive earnings from bookings through CombatStay.',
      }
    case 'admin':
      return {
        title: 'Platform approval granted',
        body: 'Your gym can appear in search for guests. Thank you for finishing every step.',
      }
    default:
      return { title: 'Update saved', body: 'Your Partner Hub is up to date.' }
  }
}
