import type { Metadata } from 'next'
import { privateRouteMetadata } from '@/lib/seo/private-route-metadata'

export const metadata: Metadata = privateRouteMetadata

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return children
}
