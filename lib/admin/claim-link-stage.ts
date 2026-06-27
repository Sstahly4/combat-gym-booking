export type ClaimLinkStage =
  | 'link_sent'
  | 'clicked_not_complete'
  | 'password_added'
  | 'onboarded'
  | 'expired'
  | 'revoked'

export function resolveClaimLinkStage(input: {
  openedAt: string | null
  passwordSet: boolean
  stripeConnected: boolean
  revokedAt: string | null
  expiresAt: string | null
  nowMs?: number
}): ClaimLinkStage {
  if (input.passwordSet && input.stripeConnected) return 'onboarded'
  if (input.passwordSet) return 'password_added'
  if (input.openedAt) return 'clicked_not_complete'

  if (input.revokedAt) return 'revoked'
  if (input.expiresAt && new Date(input.expiresAt).getTime() <= (input.nowMs ?? Date.now())) {
    return 'expired'
  }
  return 'link_sent'
}

export function claimLinkStageLabel(stage: ClaimLinkStage): string {
  switch (stage) {
    case 'link_sent':
      return 'Link sent'
    case 'clicked_not_complete':
      return 'Clicked, not complete'
    case 'password_added':
      return 'Password added'
    case 'onboarded':
      return 'Onboarded'
    case 'expired':
      return 'Expired'
    case 'revoked':
      return 'Revoked'
  }
}

export function claimLinkStageBadgeClass(stage: ClaimLinkStage): string {
  switch (stage) {
    case 'link_sent':
      return 'bg-emerald-50 text-emerald-800 ring-emerald-200'
    case 'clicked_not_complete':
      return 'bg-sky-50 text-sky-800 ring-sky-200'
    case 'password_added':
      return 'bg-indigo-50 text-indigo-800 ring-indigo-200'
    case 'onboarded':
      return 'bg-violet-50 text-violet-800 ring-violet-200'
    case 'expired':
      return 'bg-amber-50 text-amber-900 ring-amber-200'
    case 'revoked':
      return 'bg-stone-100 text-stone-700 ring-stone-200'
  }
}

/** Card/header variant (slightly stronger bg for orphan gym cards). */
export function claimLinkStageCardClass(stage: ClaimLinkStage): string {
  switch (stage) {
    case 'link_sent':
      return 'bg-emerald-100 text-emerald-800'
    case 'clicked_not_complete':
      return 'bg-sky-100 text-sky-800'
    case 'password_added':
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
