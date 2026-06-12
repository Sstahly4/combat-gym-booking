import type { Metadata } from 'next'
import { GuideBrandProfileLayout } from '@/components/guides/guide-brand-profile-layout'
import { TIGER_MUAY_THAI } from '@/lib/guides/brand-profiles'

export const metadata: Metadata = {
  title: `${TIGER_MUAY_THAI.title} | CombatStay`,
  description: TIGER_MUAY_THAI.description,
  alternates: { canonical: TIGER_MUAY_THAI.path },
  openGraph: {
    title: `${TIGER_MUAY_THAI.title} | CombatStay`,
    description: TIGER_MUAY_THAI.description,
    type: 'article',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${TIGER_MUAY_THAI.title} | CombatStay`,
    description: TIGER_MUAY_THAI.description,
  },
}

export default function TigerMuayThaiReviewPackagesPage() {
  return <GuideBrandProfileLayout config={TIGER_MUAY_THAI} />
}
