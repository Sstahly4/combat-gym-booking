import type { Metadata } from 'next'
import { memberHubPageTitle } from '@/lib/metadata/site-hubs'

export const metadata: Metadata = {
  title: memberHubPageTitle('Write a review'),
}

export default function BookingReviewLayout({ children }: { children: React.ReactNode }) {
  return children
}
