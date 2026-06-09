import type { Metadata } from 'next'
import { memberHubPageTitle } from '@/lib/metadata/site-hubs'
import { privateRouteMetadata } from '@/lib/seo/private-route-metadata'

export const metadata: Metadata = {
  ...privateRouteMetadata,
  title: memberHubPageTitle('My bookings'),
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return children
}
