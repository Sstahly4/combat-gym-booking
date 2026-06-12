import type { Metadata } from 'next'
import { GuideBrandProfileLayout } from '@/components/guides/guide-brand-profile-layout'
import { KRUDAM_BANGKOK } from '@/lib/guides/brand-profiles'

export const metadata: Metadata = {
  title: `${KRUDAM_BANGKOK.title} | CombatStay`,
  description: KRUDAM_BANGKOK.description,
  alternates: { canonical: KRUDAM_BANGKOK.path },
  openGraph: {
    title: `${KRUDAM_BANGKOK.title} | CombatStay`,
    description: KRUDAM_BANGKOK.description,
    type: 'article',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${KRUDAM_BANGKOK.title} | CombatStay`,
    description: KRUDAM_BANGKOK.description,
  },
}

export default function KrudamGymBangkokReviewPage() {
  return <GuideBrandProfileLayout config={KRUDAM_BANGKOK} />
}
