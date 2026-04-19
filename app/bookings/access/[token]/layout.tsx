import type { Metadata } from 'next'
import { memberHubPageTitle } from '@/lib/metadata/site-hubs'

export const metadata: Metadata = {
  title: memberHubPageTitle('Your booking'),
}

export default function BookingAccessLayout({ children }: { children: React.ReactNode }) {
  return children
}
