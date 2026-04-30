import type { Metadata } from 'next'
import { CreatorProgramPage } from '@/components/creator-program-page'

export const metadata: Metadata = {
  title: 'Creator & Affiliate Program | CombatStay.com',
  description:
    'Earn $25-50 per completed training trip booking you refer. Join the CombatStay Creator Program for affiliate commissions, booking credits, and creator-code opportunities.',
  openGraph: {
    title: 'Creator & Affiliate Program | CombatStay.com',
    description:
      'Earn $25-50 per completed training trip booking you refer. Join the CombatStay Creator Program.',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Creator & Affiliate Program | CombatStay.com',
    description:
      'Earn $25-50 per completed training trip booking you refer. Join the CombatStay Creator Program.',
  },
  alternates: {
    canonical: '/affiliate',
  },
}

export default function AffiliatePage() {
  return <CreatorProgramPage />
}
