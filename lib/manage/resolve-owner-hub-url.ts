import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * True when the partner has any `gyms` row (`owner_id` = user).
 * Aligns `useOwnerOnboardingStatus`, sign-in redirects, and `/owners` CTAs — one definition.
 */
export async function ownerHasListingDraft(
  supabase: Pick<SupabaseClient, 'from'>,
  ownerUserId: string
): Promise<boolean> {
  const { count, error } = await supabase
    .from('gyms')
    .select('id', { count: 'exact', head: true })
    .eq('owner_id', ownerUserId)

  if (error) return false
  return (count ?? 0) > 0
}

/**
 * Default post-auth route for owners when no explicit `redirect=` is supplied:
 * Partner Hub once a listing draft exists; otherwise `/owners` for marketing + onboarding.
 */
export async function resolveOwnerListingHubPath(
  supabase: Pick<SupabaseClient, 'from'>,
  ownerUserId: string
): Promise<'/manage' | '/owners'> {
  return (await ownerHasListingDraft(supabase, ownerUserId)) ? '/manage' : '/owners'
}
