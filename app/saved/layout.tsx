import { BookingProvider } from '@/lib/contexts/booking-context'
import type { Metadata } from 'next'
import { privateRouteMetadata } from '@/lib/seo/private-route-metadata'

export const metadata: Metadata = privateRouteMetadata

export default function SavedLayout({ children }: { children: React.ReactNode }) {
  return <BookingProvider>{children}</BookingProvider>
}
