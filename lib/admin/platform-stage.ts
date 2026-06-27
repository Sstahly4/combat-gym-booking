/**
 * Canonical claim / onboarding stage for Insights, orphan gyms, and outreach sync API.
 *
 * Order: revoked → expired → onboarded → claimed → clicked → link_sent → link_ready → no_link
 */
export type PlatformStage =
  | 'no_link'
  | 'link_ready'
  | 'link_sent'
  | 'clicked'
  | 'claimed'
  | 'onboarded'
  | 'expired'
  | 'revoked'

/** @deprecated Use PlatformStage */
export type ClaimLinkStage = PlatformStage

export function resolvePlatformStage(input: {
  hasToken: boolean
  ownerOpenedAt: string | null
  outreachSentAt: string | null
  passwordSet: boolean
  stripeConnected: boolean
  revokedAt: string | null
  expiresAt: string | null
  nowMs?: number
}): PlatformStage {
  if (input.revokedAt) return 'revoked'

  const now = input.nowMs ?? Date.now()
  const expired =
    Boolean(input.expiresAt) && new Date(input.expiresAt!).getTime() <= now

  if (input.passwordSet && input.stripeConnected) return 'onboarded'
  if (input.passwordSet) return 'claimed'
  if (input.ownerOpenedAt) return 'clicked'

  if (expired) return 'expired'
  if (input.outreachSentAt) return 'link_sent'
  if (input.hasToken) return 'link_ready'
  return 'no_link'
}

/** Legacy wrapper — uses owner click only (not admin first_opened_at). */
export function resolveClaimLinkStage(input: {
  openedAt: string | null
  passwordSet: boolean
  stripeConnected: boolean
  revokedAt: string | null
  expiresAt: string | null
  nowMs?: number
  outreachSentAt?: string | null
  hasToken?: boolean
}): PlatformStage {
  return resolvePlatformStage({
    hasToken: input.hasToken ?? true,
    ownerOpenedAt: input.openedAt,
    outreachSentAt: input.outreachSentAt ?? null,
    passwordSet: input.passwordSet,
    stripeConnected: input.stripeConnected,
    revokedAt: input.revokedAt,
    expiresAt: input.expiresAt,
    nowMs: input.nowMs,
  })
}

export function platformStageLabel(stage: PlatformStage): string {
  switch (stage) {
    case 'no_link':
      return 'Awaiting link'
    case 'link_ready':
      return 'Link ready'
    case 'link_sent':
      return 'Link sent'
    case 'clicked':
      return 'Clicked — incomplete'
    case 'claimed':
      return 'Claimed'
    case 'onboarded':
      return 'Onboarded'
    case 'expired':
      return 'Expired'
    case 'revoked':
      return 'Revoked'
  }
}

export function claimLinkStageLabel(stage: PlatformStage): string {
  return platformStageLabel(stage)
}

export function platformStageShortLabel(stage: PlatformStage): string {
  switch (stage) {
    case 'no_link':
      return 'No link'
    case 'link_ready':
      return 'Link ready'
    case 'link_sent':
      return 'Not clicked'
    case 'clicked':
      return 'Incomplete'
    case 'claimed':
      return 'Claimed'
    case 'onboarded':
      return 'Onboarded'
    case 'expired':
      return 'Expired'
    case 'revoked':
      return 'Revoked'
  }
}

export function claimLinkStageShortLabel(stage: PlatformStage): string {
  return platformStageShortLabel(stage)
}

export function platformStageTableClass(stage: PlatformStage): string {
  switch (stage) {
    case 'no_link':
      return 'border-stone-200 bg-stone-50 text-stone-700'
    case 'link_ready':
      return 'border-emerald-200 bg-emerald-50 text-emerald-900'
    case 'link_sent':
      return 'border-teal-200 bg-teal-50 text-teal-900'
    case 'clicked':
      return 'border-sky-200 bg-sky-50 text-sky-900'
    case 'claimed':
      return 'border-indigo-200 bg-indigo-50 text-indigo-900'
    case 'onboarded':
      return 'border-violet-200 bg-violet-50 text-violet-900'
    case 'expired':
      return 'border-amber-200 bg-amber-50 text-amber-950'
    case 'revoked':
      return 'border-stone-200 bg-stone-50 text-stone-700'
  }
}

export function claimLinkStageTableClass(stage: PlatformStage): string {
  return platformStageTableClass(stage)
}

export function claimLinkStageBadgeClass(stage: PlatformStage): string {
  switch (stage) {
    case 'no_link':
      return 'bg-stone-100 text-stone-700 ring-stone-200'
    case 'link_ready':
      return 'bg-emerald-50 text-emerald-800 ring-emerald-200'
    case 'link_sent':
      return 'bg-teal-50 text-teal-800 ring-teal-200'
    case 'clicked':
      return 'bg-sky-50 text-sky-800 ring-sky-200'
    case 'claimed':
      return 'bg-indigo-50 text-indigo-800 ring-indigo-200'
    case 'onboarded':
      return 'bg-violet-50 text-violet-800 ring-violet-200'
    case 'expired':
      return 'bg-amber-50 text-amber-900 ring-amber-200'
    case 'revoked':
      return 'bg-stone-100 text-stone-700 ring-stone-200'
  }
}

export function claimLinkStageCardClass(stage: PlatformStage): string {
  switch (stage) {
    case 'no_link':
      return 'bg-stone-200 text-stone-800'
    case 'link_ready':
      return 'bg-emerald-100 text-emerald-800'
    case 'link_sent':
      return 'bg-teal-100 text-teal-800'
    case 'clicked':
      return 'bg-sky-100 text-sky-800'
    case 'claimed':
      return 'bg-indigo-100 text-indigo-800'
    case 'onboarded':
      return 'bg-violet-100 text-violet-800'
    case 'expired':
      return 'bg-amber-100 text-amber-800'
    case 'revoked':
      return 'bg-stone-200 text-stone-700'
  }
}

export function isStripeConnected(gym: {
  stripe_account_id?: string | null
  stripe_connect_verified?: boolean | null
}): boolean {
  return Boolean(gym.stripe_account_id && gym.stripe_connect_verified)
}

/** Sheet / Apps Script friendly status string. */
export function platformStageSheetStatus(stage: PlatformStage): string {
  switch (stage) {
    case 'no_link':
      return 'Awaiting link'
    case 'link_ready':
      return 'Link ready'
    case 'link_sent':
      return 'Link sent'
    case 'clicked':
      return 'Clicked — incomplete'
    case 'claimed':
      return 'Claimed'
    case 'onboarded':
      return 'Onboarded'
    case 'expired':
      return 'Expired — resend link'
    case 'revoked':
      return 'Revoked'
  }
}
