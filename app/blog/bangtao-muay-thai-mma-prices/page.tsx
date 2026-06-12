import type { Metadata } from 'next'
import { GuideBrandProfileLayout } from '@/components/guides/guide-brand-profile-layout'
import { BANGTAO_MMA } from '@/lib/guides/brand-profiles'

export const metadata: Metadata = {
  title: `${BANGTAO_MMA.title} | CombatStay`,
  description: BANGTAO_MMA.description,
  alternates: { canonical: BANGTAO_MMA.path },
  openGraph: {
    title: `${BANGTAO_MMA.title} | CombatStay`,
    description: BANGTAO_MMA.description,
    type: 'article',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${BANGTAO_MMA.title} | CombatStay`,
    description: BANGTAO_MMA.description,
  },
}

export default function BangtaoMuayThaiMmaPricesPage() {
  return <GuideBrandProfileLayout config={BANGTAO_MMA} />
}
