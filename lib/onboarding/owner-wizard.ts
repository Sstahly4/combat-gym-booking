export interface OwnerWizardStepDefinition {
  index: number
  key: string
  slug: string
  label: string
  description: string
  deepLinkPath: string
}

export const OWNER_WIZARD_STEPS: OwnerWizardStepDefinition[] = [
  {
    index: 1,
    key: 'basics',
    slug: 'step-1',
    label: 'Basic Info',
    description:
      'Listing name, location, disciplines, account holder on file, and a verified sign-in email — same requirements as account security.',
    deepLinkPath: '/manage/onboarding/step-1',
  },
  {
    index: 2,
    key: 'packages',
    slug: 'step-2',
    label: 'Packages & pricing',
    description: 'These are the prices customers will see. You can always update them from your dashboard.',
    deepLinkPath: '/manage/gym/edit',
  },
  {
    index: 3,
    key: 'photos',
    slug: 'step-3',
    label: 'Photos',
    description: 'Upload a strong gallery — at least three images for go-live.',
    deepLinkPath: '/manage/gym/edit',
  },
  {
    index: 4,
    key: 'policy',
    slug: 'step-4',
    label: 'Policies',
    description: 'Cancellation rules default to flexible until you set a preference.',
    deepLinkPath: '/manage/gym/edit',
  },
  {
    index: 5,
    key: 'payouts',
    slug: 'step-5',
    label: 'Payouts',
    description: 'Connect Stripe so you can receive payouts from bookings.',
    deepLinkPath: '/manage/stripe-connect',
  },
  {
    index: 6,
    key: 'security',
    slug: 'step-6',
    label: 'Password & security',
    description:
      'Optional password update and authenticator (TOTP). Account holder and verified email are completed in Basic Info.',
    deepLinkPath: '/manage/onboarding/step-6',
  },
  {
    index: 7,
    key: 'finalize',
    slug: 'step-7',
    label: 'Go live',
    description:
      'Open the readiness review when you are ready. Use the sidebar to jump between steps in any order; actual publishing is verified on the review screen.',
    deepLinkPath: '/manage',
  },
]

/**
 * Pre–7-step wizard used `step-8` for the final step; we only have `step-1`…`step-7` now.
 * Other old indices (e.g. old `step-3` = packages) collide with current slugs, so we resolve by
 * direct slug match first and only use this map when the URL is not a current step.
 */
export const LEGACY_WIZARD_SLUG_MAP: Record<string, string> = {
  'step-8': 'step-7',
}

export function getWizardStepBySlug(slug: string | null | undefined) {
  const s = (slug || 'step-1').trim() || 'step-1'
  const direct = OWNER_WIZARD_STEPS.find((step) => step.slug === s)
  if (direct) return direct
  const legacyTarget = LEGACY_WIZARD_SLUG_MAP[s]
  if (legacyTarget) {
    return OWNER_WIZARD_STEPS.find((step) => step.slug === legacyTarget) ?? OWNER_WIZARD_STEPS[0]
  }
  return OWNER_WIZARD_STEPS[0]
}

export type OnboardingWizardUrlOptions = {
  /** Defaults to `/manage/onboarding`. */
  basePath?: string
  /** Append `create_new=1` when there is no `gym_id` (admin new-listing draft). */
  adminCreateNewDraft?: boolean
}

/** Single-route wizard: avoids full remount when changing steps (client-side navigation only). */
export function buildOnboardingWizardUrl(
  stepSlug: string,
  gymId: string | null,
  options?: OnboardingWizardUrlOptions
) {
  const q = new URLSearchParams()
  q.set('step', stepSlug)
  if (gymId) q.set('gym_id', gymId)
  if (options?.adminCreateNewDraft && !gymId) {
    q.set('create_new', '1')
  }
  const base = options?.basePath ?? '/manage/onboarding'
  return `${base}?${q.toString()}`
}

/** Gym editor requires `id` (not gym_id). Optional `section` scrolls to e.g. packages or images. */
export function buildGymEditDeepLink(gymId: string, section?: string | null) {
  const q = new URLSearchParams()
  q.set('id', gymId)
  if (section) q.set('section', section)
  return `/manage/gym/edit?${q.toString()}`
}

export function buildWizardStepDeepLink(
  step: OwnerWizardStepDefinition,
  gymId: string | null,
  options?: OnboardingWizardUrlOptions
) {
  if (step.deepLinkPath.startsWith('/manage/onboarding/step-')) {
    return buildOnboardingWizardUrl(step.slug, gymId, options)
  }
  const url = new URL(step.deepLinkPath, 'http://localhost')
  if (gymId) {
    if (step.deepLinkPath === '/manage/gym/edit') {
      url.searchParams.set('id', gymId)
    } else if (step.deepLinkPath === '/manage/stripe-connect') {
      url.searchParams.set('gym_id', gymId)
    } else {
      url.searchParams.set('gym_id', gymId)
    }
  }
  return `${url.pathname}${url.search}`
}
