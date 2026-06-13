import type { Metadata } from 'next'
import { privateRouteMetadata } from '@/lib/seo/private-route-metadata'
import { AffiliateIntakeClient } from './intake-client'

export const metadata: Metadata = {
  ...privateRouteMetadata,
  title: 'Affiliate payout setup | CombatStay',
  description: 'Secure one-time form to submit your payout details.',
}

export default function AffiliateIntakePage({ params }: { params: { token: string } }) {
  return <AffiliateIntakeClient token={params.token} />
}
