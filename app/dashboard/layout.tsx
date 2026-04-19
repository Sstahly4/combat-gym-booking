import type { Metadata } from 'next'
import { memberHubPageTitle } from '@/lib/metadata/site-hubs'

export const metadata: Metadata = {
  title: memberHubPageTitle('My bookings'),
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return children
}
