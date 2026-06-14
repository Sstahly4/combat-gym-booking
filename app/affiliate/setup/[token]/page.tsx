import type { Metadata } from 'next'
import { privateRouteMetadata } from '@/lib/seo/private-route-metadata'
import { AffiliateIntakeClient } from './intake-client'

export const metadata: Metadata = {
  ...privateRouteMetadata,
  title: 'Affiliate onboarding | CombatStay',
  description: 'Complete your CombatStay affiliate setup — choose your referral code and payout details.',
}

export default function AffiliateIntakePage({ params }: { params: { token: string } }) {
  return <AffiliateIntakeClient token={params.token} />
}
