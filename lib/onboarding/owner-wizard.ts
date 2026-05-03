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
    description: 'Add how you get paid (bank transfer or connected account) before you go live.',
    deepLinkPath: '/manage/settings',
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

/** Same slugs/keys as {@link OWNER_WIZARD_STEPS}; copy with admin-friendly labels/descriptions for `/admin/create-gym`. */
export function getOwnerWizardStepsForContext(embedInAdmin: boolean): OwnerWizardStepDefinition[] {
  if (!embedInAdmin) return OWNER_WIZARD_STEPS
  return OWNER_WIZARD_STEPS.map((s) => {
    if (s.key === 'basics') {
      return {
        ...s,
        description:
          'Only the gym name is required to create the draft. Add more detail here or in the full editor anytime. KYC and account-holder fields are not required for admin-created listings.',
      }
    }
    if (s.key === 'security') {
      return {
        ...s,
        description:
          'Optional for staff. Skip when you are only preparing a gym for owner handoff.',
      }
    }
    if (s.key === 'finalize') {
      return {
        ...s,
        label: 'Finish',
        description:
          'This listing stays in draft until you verify it or the owner completes onboarding. Open the full editor anytime.',
      }
    }
    return s
  })
}

export function resolveWizardStepFromSlug(
  slug: string | null | undefined,
  steps: OwnerWizardStepDefinition[]
): OwnerWizardStepDefinition {
  const s = (slug || 'step-1').trim() || 'step-1'
  const direct = steps.find((step) => step.slug === s)
  if (direct) return direct
  const legacyTarget = LEGACY_WIZARD_SLUG_MAP[s]
  if (legacyTarget) {
    return steps.find((step) => step.slug === legacyTarget) ?? steps[0]
  }
  return steps[0]
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
  if (step.deepLinkPath === '/manage/settings') {
    url.searchParams.set('tab', 'payouts')
    if (gymId) url.searchParams.set('gym_id', gymId)
  } else if (gymId) {
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
