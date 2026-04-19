import type { Metadata } from 'next'
import { memberHubPageTitle } from '@/lib/metadata/site-hubs'

export const metadata: Metadata = {
  title: memberHubPageTitle('Payment'),
}

export default function BookingPaymentLayout({ children }: { children: React.ReactNode }) {
  return children
}
