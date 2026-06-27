import type { Metadata } from 'next'
import { BRAND_NAME } from '@/lib/brand'
import { FaqJsonLd } from '@/app/faq/faq-json-ld'

const description =
  'CombatStay FAQ: frequently asked questions about bookings, payments, cancellations, gym safety, accounts, and training camps in Thailand and beyond.'

const title = `FAQ & Help Center | ${BRAND_NAME}`

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
  return (
    <>
      <FaqJsonLd />
      {children}
    </>
  )
}
