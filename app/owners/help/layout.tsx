import type { Metadata } from 'next'
import { BRAND_NAME } from '@/lib/brand'

const description =
  'Partner FAQ for gym owners: listings, verification, bookings, payouts, promotions, and Partner Hub help on CombatStay.'

const title = `Partner Help & FAQ | ${BRAND_NAME}`

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: '/owners/help',
  },
  openGraph: {
    title,
    description,
    type: 'website',
    url: '/owners/help',
  },
  twitter: {
    card: 'summary',
    title,
    description,
  },
}

export default function OwnersHelpLayout({ children }: { children: React.ReactNode }) {
  return children
}
