import { createClient } from '@/lib/supabase/server'
import { attachReviewStats } from '@/lib/reviews/attach-review-stats'
import type { GuideGym } from '@/lib/guides/thailand-gyms'

export type ResolvedBrandGym = GuideGym & {
  isBookable: boolean
}

export async function resolveBrandGym(namePatterns: string[], slugHint?: string): Promise<ResolvedBrandGym | null> {
  const supabase = await createClient()

  for (const pattern of namePatterns) {
    const { data } = await supabase
      .from('gyms')
      .select('*, images:gym_images(url, variants, order), status, is_live')
      .in('verification_status', ['verified', 'trusted'])
      .ilike('name', `%${pattern}%`)
      .limit(8)

    if (!data?.length) continue

    const rows = data as Array<GuideGym & { status?: string; is_live?: boolean }>
    const sorted = [...rows].sort((a, b) => {
      if (slugHint) {
        const aSlug = (a.slug || '').toLowerCase()
        const bSlug = (b.slug || '').toLowerCase()
        const hint = slugHint.toLowerCase()
        if (aSlug.includes(hint) && !bSlug.includes(hint)) return -1
        if (!aSlug.includes(hint) && bSlug.includes(hint)) return 1
      }
      return (a.name || '').localeCompare(b.name || '')
    })

    const pick = sorted[0]
    if (!pick) continue

    pick.images?.sort((a, b) => (a.order || 0) - (b.order || 0))

    const [withReviews] = await attachReviewStats([pick as any])
    const gym = withReviews as ResolvedBrandGym
    gym.isBookable =
      gym.verification_status === 'verified' || gym.verification_status === 'trusted'
        ? (pick as { status?: string; is_live?: boolean }).status === 'approved' &&
          (pick as { is_live?: boolean }).is_live === true
        : false

    return gym
  }

  return null
}
