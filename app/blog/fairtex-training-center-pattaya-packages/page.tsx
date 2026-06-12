import type { Metadata } from 'next'
import { GuideBrandProfileLayout } from '@/components/guides/guide-brand-profile-layout'
import { FAIRTEX_PATTAYA } from '@/lib/guides/brand-profiles'

export const metadata: Metadata = {
  title: `${FAIRTEX_PATTAYA.title} | CombatStay`,
  description: FAIRTEX_PATTAYA.description,
  alternates: { canonical: FAIRTEX_PATTAYA.path },
  openGraph: {
    title: `${FAIRTEX_PATTAYA.title} | CombatStay`,
    description: FAIRTEX_PATTAYA.description,
    type: 'article',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${FAIRTEX_PATTAYA.title} | CombatStay`,
    description: FAIRTEX_PATTAYA.description,
  },
}

export default function FairtexTrainingCenterPattayaPackagesPage() {
  return <GuideBrandProfileLayout config={FAIRTEX_PATTAYA} />
}
