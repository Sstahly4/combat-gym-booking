import type { Metadata } from 'next'
import { BRAND_NAME } from '@/lib/brand'

const description =
  'List your gym on CombatStay. Set packages and pricing, manage bookings from your dashboard, and reach fighters worldwide.'

const title = `List your gym | ${BRAND_NAME}`

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: '/owners',
  },
  openGraph: {
    title,
    description,
    type: 'website',
    url: '/owners',
  },
  twitter: {
    card: 'summary',
    title,
    description,
  },
}

export default function OwnersLayout({ children }: { children: React.ReactNode }) {
  return children
}
