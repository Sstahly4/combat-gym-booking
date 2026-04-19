import type { Metadata } from 'next'
import { memberHubPageTitle } from '@/lib/metadata/site-hubs'

export const metadata: Metadata = {
  title: memberHubPageTitle('Booking confirmed'),
}

export default function BookingSuccessLayout({ children }: { children: React.ReactNode }) {
  return children
}
