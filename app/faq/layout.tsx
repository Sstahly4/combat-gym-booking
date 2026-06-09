import type { Metadata } from 'next'
import { BRAND_NAME } from '@/lib/brand'

const description =
  'Find answers to common questions about bookings, payments, training camps, and safety on CombatStay.'

const title = `Help Center | ${BRAND_NAME}`

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: '/faq',
  },
  openGraph: {
    title,
    description,
    type: 'website',
    url: '/faq',
  },
  twitter: {
    card: 'summary',
    title,
    description,
  },
}

export default function FaqLayout({ children }: { children: React.ReactNode }) {
  return children
}
