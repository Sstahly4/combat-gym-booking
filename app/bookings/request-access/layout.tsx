import type { Metadata } from 'next'
import { memberHubPageTitle } from '@/lib/metadata/site-hubs'

export const metadata: Metadata = {
  title: memberHubPageTitle('Find my booking'),
}

export default function BookingRequestAccessLayout({ children }: { children: React.ReactNode }) {
  return children
}
