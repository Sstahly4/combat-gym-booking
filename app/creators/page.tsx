import type { Metadata } from 'next'
import { CreatorProgramPage } from '@/components/creator-program-page'

export const metadata: Metadata = {
  title: 'Creator Program | CombatStay.com',
  description:
    'Join the CombatStay Creator Program. Earn $25-50 per completed training trip booking you refer, plus creator-code opportunities for top partners.',
  openGraph: {
    title: 'Creator Program | CombatStay.com',
    description:
      'Join the CombatStay Creator Program. Earn $25-50 per completed training trip booking you refer.',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Creator Program | CombatStay.com',
    description:
      'Join the CombatStay Creator Program. Earn $25-50 per completed training trip booking you refer.',
  },
  alternates: {
    canonical: '/creators',
  },
}

export default function CreatorsPage() {
  return <CreatorProgramPage />
}
