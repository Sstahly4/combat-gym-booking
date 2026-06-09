/**
 * No default title: each traveler route sets an OTA-specific title (checkout, payment, etc.).
 */
import type { Metadata } from 'next'
import { privateRouteMetadata } from '@/lib/seo/private-route-metadata'

export const metadata: Metadata = privateRouteMetadata

export default function BookingsSectionLayout({ children }: { children: React.ReactNode }) {
  return children
}
