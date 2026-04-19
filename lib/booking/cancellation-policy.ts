/**
 * Single source of truth for cancellation policy math and capture timing.
 * Used by payment flows, cron capture, refunds messaging, and checkout UI.
 *
 * Deadline rule: last instant for full refund (MVP) is 00:00:00 UTC on the calendar day
 * that is `packageCancellationPolicyDays` full days before the booking `start_date`
 * (date-only, YYYY-MM-DD). Same calendar-day model as the legacy checkout UI, in UTC for
 * server/client consistency.
 *
 * Milestone 3: `captureEligibleAt` aligns with “transfer only after window closes” for
 * destination charges — same timestamp as the end of the free-cancellation window
 * (or immediate capture when there is no free-cancel window).
 */

export type GymCancellationPolicyTone = 'flexible' | 'moderate' | 'strict'

export const DEFAULT_GYM_CANCELLATION_POLICY_TONE: GymCancellationPolicyTone = 'flexible'

export interface CancellationPolicySnapshotV1 {
  version: 1
  policyTone: GymCancellationPolicyTone
  packageCancellationPolicyDays: number | null
  /** ISO-8601 instant; null when there is no free-cancellation deadline */
  cancellationDeadlineIso: string | null
  /** Refund % if the guest cancelled at `computedAtIso` (MVP: 100 or 0) */
  refundPercentAtConsent: number
  policyDisplayName: string
  /**
   * When the platform may capture the authorised payment (and later: when a transfer may run).
   * Null means eligible as soon as the booking is in a capturable state (non-refundable packages).
   */
  captureEligibleAtIso: string | null
  captureMode: 'after_deadline' | 'immediate'
  computedAtIso: string
}

export type CancellationPolicySnapshot = CancellationPolicySnapshotV1

export interface ResolveCancellationPolicyInput {
  startDate: string
  packageCancellationPolicyDays: number | null
  gymPolicyTone?: GymCancellationPolicyTone | null
  /** Evaluation time (default: now) */
  asOf?: Date
}

export interface CancellationPolicyResult {
  cancellationDeadline: Date | null
  cancellationDeadlineIso: string | null
  refundPercentIfCancellingNow: number
  cancellationWindowOpen: boolean
  policyTone: GymCancellationPolicyTone
  policyDisplayName: string
  captureEligibleAt: Date | null
  captureEligibleAtIso: string | null
  snapshot: CancellationPolicySnapshotV1
}

function toneLabel(tone: GymCancellationPolicyTone): string {
  switch (tone) {
    case 'flexible':
      return 'Flexible'
    case 'moderate':
      return 'Moderate'
    case 'strict':
      return 'Strict'
    default:
      return 'Flexible'
  }
}

/** Calendar arithmetic on YYYY-MM-DD in UTC (noon anchor avoids DST edge cases in non-UTC zones). */
export function getCancellationDeadlineUtc(
  startDateYmd: string,
  packageCancellationPolicyDays: number | null
): Date | null {
  if (
    packageCancellationPolicyDays === null ||
    packageCancellationPolicyDays === undefined ||
    Number.isNaN(packageCancellationPolicyDays)
  ) {
    return null
  }
  const parts = startDateYmd.split('-').map((p) => parseInt(p, 10))
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return null
  const [y, m, d] = parts
  const checkinUtc = new Date(Date.UTC(y, m - 1, d, 12, 0, 0, 0))
  checkinUtc.setUTCDate(checkinUtc.getUTCDate() - packageCancellationPolicyDays)
  checkinUtc.setUTCHours(0, 0, 0, 0)
  return checkinUtc
}

export function resolveCancellationPolicy(
  input: ResolveCancellationPolicyInput
): CancellationPolicyResult {
  const asOf = input.asOf ?? new Date()
  const tone: GymCancellationPolicyTone =
    input.gymPolicyTone && ['flexible', 'moderate', 'strict'].includes(input.gymPolicyTone)
      ? input.gymPolicyTone
      : DEFAULT_GYM_CANCELLATION_POLICY_TONE

  const deadline = getCancellationDeadlineUtc(input.startDate, input.packageCancellationPolicyDays)
  const deadlineIso = deadline ? deadline.toISOString() : null

  let refundPercentIfCancellingNow = 0
  let cancellationWindowOpen = false
  let captureEligibleAt: Date | null = null
  let captureMode: 'after_deadline' | 'immediate' = 'immediate'

  if (deadline) {
    cancellationWindowOpen = asOf.getTime() < deadline.getTime()
    refundPercentIfCancellingNow = cancellationWindowOpen ? 100 : 0
    captureEligibleAt = deadline
    captureMode = 'after_deadline'
  } else {
    cancellationWindowOpen = false
    refundPercentIfCancellingNow = 0
    captureEligibleAt = null
    captureMode = 'immediate'
  }

  const days = input.packageCancellationPolicyDays
  const policyDisplayName =
    days != null
      ? `${toneLabel(tone)} (${days} day${days === 1 ? '' : 's'} before check-in)`
      : `${toneLabel(tone)} (no free cancellation)`

  const computedAtIso = asOf.toISOString()

  const snapshot: CancellationPolicySnapshotV1 = {
    version: 1,
    policyTone: tone,
    packageCancellationPolicyDays: input.packageCancellationPolicyDays,
    cancellationDeadlineIso: deadlineIso,
    refundPercentAtConsent: refundPercentIfCancellingNow,
    policyDisplayName,
    captureEligibleAtIso: captureEligibleAt ? captureEligibleAt.toISOString() : null,
    captureMode,
    computedAtIso,
  }

  return {
    cancellationDeadline: deadline,
    cancellationDeadlineIso: deadlineIso,
    refundPercentIfCancellingNow,
    cancellationWindowOpen,
    policyTone: tone,
    policyDisplayName,
    captureEligibleAt,
    captureEligibleAtIso: captureEligibleAt ? captureEligibleAt.toISOString() : null,
    snapshot,
  }
}

/** Stripe PaymentIntent metadata (string values only). */
/**
 * Whether an authorised PaymentIntent may be captured now, based on the stored snapshot
 * (preferred) or a fresh computation from live package rows (legacy rows).
 */
export function isCaptureDue(
  snapshot: CancellationPolicySnapshotV1 | null | undefined,
  computed: CancellationPolicyResult,
  now: Date
): boolean {
  if (snapshot?.version === 1) {
    if (snapshot.captureMode === 'immediate') return true
    const at = snapshot.captureEligibleAtIso ?? snapshot.cancellationDeadlineIso
    if (!at) return true
    return now.getTime() >= new Date(at).getTime()
  }
  if (!computed.captureEligibleAt) return true
  return now.getTime() >= computed.captureEligibleAt.getTime()
}

export function cancellationPolicyToStripeMetadata(
  snapshot: CancellationPolicySnapshotV1
): Record<string, string> {
  return {
    cb_policy_version: String(snapshot.version),
    cb_policy_tone: snapshot.policyTone,
    cb_policy_deadline_iso: snapshot.cancellationDeadlineIso ?? '',
    cb_policy_refund_pct: String(snapshot.refundPercentAtConsent),
    cb_policy_display: snapshot.policyDisplayName.slice(0, 450),
    cb_policy_capture_mode: snapshot.captureMode,
    cb_policy_capture_eligible_iso: snapshot.captureEligibleAtIso ?? '',
    cb_policy_computed_at_iso: snapshot.computedAtIso,
    cb_policy_package_days:
      snapshot.packageCancellationPolicyDays != null
        ? String(snapshot.packageCancellationPolicyDays)
        : '',
  }
}

/** Checkout / good-to-know copy — uses the same resolver as the server. */
export function getCancellationMarketingLines(input: {
  startDate: string
  packageCancellationPolicyDays: number | null
  gymPolicyTone?: GymCancellationPolicyTone | null
}): {
  goodToKnowBullet: string | null
  safetyPoliciesLine: string | null
} {
  const r = resolveCancellationPolicy({
    startDate: input.startDate,
    packageCancellationPolicyDays: input.packageCancellationPolicyDays,
    gymPolicyTone: input.gymPolicyTone ?? DEFAULT_GYM_CANCELLATION_POLICY_TONE,
  })
  const days = input.packageCancellationPolicyDays
  if (days == null) {
    return {
      goodToKnowBullet: null,
      safetyPoliciesLine: null,
    }
  }
  if (r.cancellationDeadline) {
    const formatted = r.cancellationDeadline.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
    if (r.cancellationWindowOpen) {
      return {
        goodToKnowBullet: `Stay flexible: You can cancel for free before ${formatted}, so lock in this great price today.`,
        safetyPoliciesLine: `Free cancellation up to ${days} day${days === 1 ? '' : 's'} before check-in`,
      }
    }
    return {
      goodToKnowBullet: `Stay flexible: Free cancellation available up to ${days} day${days === 1 ? '' : 's'} before check-in.`,
      safetyPoliciesLine: `Free cancellation up to ${days} day${days === 1 ? '' : 's'} before check-in`,
    }
  }
  return { goodToKnowBullet: null, safetyPoliciesLine: null }
}
