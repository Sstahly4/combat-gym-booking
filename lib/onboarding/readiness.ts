import { buildOnboardingWizardUrl } from '@/lib/onboarding/owner-wizard'
import { manageSettingsPayoutsHref } from '@/lib/manage/settings-payouts-href'

type ReadinessItem = {
  key: string
  label: string
  passed: boolean
  reason: string | null
  deepLink: string
}

type OptionalReadinessItem = {
  key: string
  label: string
  passed: boolean
  nudgeText: string
  deepLink: string
}

export type GymReadinessResult = {
  required: ReadinessItem[]
  optional: OptionalReadinessItem[]
  canGoLive: boolean
}

export async function getGymReadiness({
  supabase,
  gymId,
  ownerId,
}: {
  supabase: any
  gymId: string
  ownerId: string
}): Promise<GymReadinessResult> {
  const [
    gymResult,
    packageCountResult,
    photoCountResult,
    securityStepResult,
    pricingAckResult,
    policyStepResult,
  ] = await Promise.all([
    supabase
      .from('gyms')
      .select(
        'id, owner_id, name, address, description, disciplines, stripe_connect_verified, payout_rail, wise_recipient_id, wise_recipient_currency, wise_payout_ready'
      )
      .eq('id', gymId)
      .eq('owner_id', ownerId)
      .maybeSingle(),
    supabase
      .from('packages')
      .select('id', { count: 'exact', head: true })
      .eq('gym_id', gymId),
    supabase
      .from('gym_images')
      .select('id', { count: 'exact', head: true })
      .eq('gym_id', gymId),
    supabase
      .from('owner_onboarding_steps')
      .select('completed_at, owner_onboarding_sessions!inner(owner_id)')
      .eq('owner_onboarding_sessions.owner_id', ownerId)
      .eq('step_key', 'security')
      .not('completed_at', 'is', null)
      .limit(1),
    supabase
      .from('owner_onboarding_steps')
      .select('completed_at, owner_onboarding_sessions!inner(owner_id)')
      .eq('owner_onboarding_sessions.owner_id', ownerId)
      .eq('step_key', 'pricing_ack')
      .not('completed_at', 'is', null)
      .limit(1),
    supabase
      .from('owner_onboarding_steps')
      .select('metadata, completed_at, owner_onboarding_sessions!inner(owner_id)')
      .eq('owner_onboarding_sessions.owner_id', ownerId)
      .eq('step_key', 'policy')
      .order('updated_at', { ascending: false })
      .limit(1),
  ])

  const gym = gymResult.data
  const packageCount = packageCountResult.count || 0
  const photoCount = photoCountResult.count || 0
  const securityComplete = Boolean(securityStepResult.data && securityStepResult.data.length > 0)
  const pricingAckComplete = Boolean(pricingAckResult.data && pricingAckResult.data.length > 0)
  const policyMeta = policyStepResult.data?.[0]?.metadata || {}
  const hasPolicyReview = Boolean(policyStepResult.data?.[0]?.completed_at)

  const rail: 'wise' | 'stripe_connect' =
    gym?.payout_rail === 'stripe_connect' ? 'stripe_connect' : 'wise'
  const payoutsPassed =
    rail === 'stripe_connect'
      ? Boolean(gym?.stripe_connect_verified)
      : Boolean(
          gym?.wise_payout_ready &&
            gym?.wise_recipient_id &&
            (gym?.wise_recipient_currency && String(gym.wise_recipient_currency).trim().length > 0)
        )

  const required: ReadinessItem[] = [
    {
      key: 'security',
      label: 'Security setup',
      passed: securityComplete,
      reason: securityComplete
        ? null
        : 'Complete Basic Info (account holder & verified email) or security onboarding.',
      deepLink: buildOnboardingWizardUrl('step-1', gymId),
    },
    {
      key: 'gym_basics',
      label: 'Gym listing',
      passed: Boolean(gym?.name?.trim() && gym?.address?.trim() && gym?.description?.trim()),
      reason:
        gym?.name?.trim() && gym?.address?.trim() && gym?.description?.trim()
          ? null
          : 'Name, address, and description are required.',
      deepLink: buildOnboardingWizardUrl('step-1', gymId),
    },
    {
      key: 'disciplines',
      label: 'Disciplines selected',
      passed: Array.isArray(gym?.disciplines) && gym.disciplines.length > 0,
      reason:
        Array.isArray(gym?.disciplines) && gym.disciplines.length > 0
          ? null
          : 'Select at least one discipline.',
      deepLink: buildOnboardingWizardUrl('step-1', gymId),
    },
    {
      key: 'packages_pricing',
      label: 'Package + pricing confirmed',
      passed: packageCount > 0 && pricingAckComplete,
      reason:
        packageCount > 0 && pricingAckComplete
          ? null
          : packageCount === 0
            ? 'Create at least one package.'
            : 'Confirm pricing acknowledgement in Packages & pricing.',
      deepLink: buildOnboardingWizardUrl('step-2', gymId),
    },
    {
      key: 'photos',
      label: 'Photos (minimum 3)',
      passed: photoCount >= 3,
      reason: photoCount >= 3 ? null : `Upload at least 3 photos (current: ${photoCount}).`,
      deepLink: buildOnboardingWizardUrl('step-3', gymId),
    },
    {
      key: 'payouts',
      label: rail === 'stripe_connect' ? 'Connected payout account' : 'Payout details',
      passed: payoutsPassed,
      reason: payoutsPassed
        ? null
        : rail === 'stripe_connect'
          ? 'Finish payout account setup for your connected account.'
          : 'Add payout recipient details.',
      deepLink:
        rail === 'stripe_connect'
          ? manageSettingsPayoutsHref(gymId, 'stripe-onboarding')
          : manageSettingsPayoutsHref(gymId),
    },
  ]

  const optional: OptionalReadinessItem[] = [
    {
      key: 'policy_review',
      label: 'Cancellation policy review',
      passed: hasPolicyReview,
      nudgeText: hasPolicyReview
        ? 'Policy reviewed.'
        : `Flexible policy is applied by default${policyMeta?.policy_preference ? ` (${policyMeta.policy_preference})` : ''}. Review anytime.`,
      deepLink: buildOnboardingWizardUrl('step-4', gymId),
    },
  ]

  return {
    required,
    optional,
    canGoLive: required.every((item) => item.passed),
  }
}
