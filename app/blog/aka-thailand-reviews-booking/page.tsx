import type { Metadata } from 'next'
import { GuideBrandProfileLayout } from '@/components/guides/guide-brand-profile-layout'
import { AKA_THAILAND } from '@/lib/guides/brand-profiles'

export const metadata: Metadata = {
  title: `${AKA_THAILAND.title} | CombatStay`,
  description: AKA_THAILAND.description,
  alternates: { canonical: AKA_THAILAND.path },
  openGraph: {
    title: `${AKA_THAILAND.title} | CombatStay`,
    description: AKA_THAILAND.description,
    type: 'article',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${AKA_THAILAND.title} | CombatStay`,
    description: AKA_THAILAND.description,
  },
}

export default function AkaThailandReviewsBookingPage() {
  return <GuideBrandProfileLayout config={AKA_THAILAND} />
}
