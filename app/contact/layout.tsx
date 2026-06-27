import type { Metadata } from 'next'
import { SupportHubLinks } from '@/components/help/support-hub-links'
import { BRAND_NAME } from '@/lib/brand'

const description =
  'Message CombatStay customer service about bookings, payments, and your account. Add your booking reference when you have one — we aim to reply within one business day.'

const title = `Customer service | ${BRAND_NAME}`

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: '/contact',
  },
  openGraph: {
    title,
    description,
    type: 'website',
    url: '/contact',
  },
  twitter: {
    card: 'summary',
    title,
    description,
  },
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-6xl px-4 pt-10">
        <SupportHubLinks currentPath="/contact" audience="traveler" variant="compact" className="mb-6" />
      </div>
      {children}
    </div>
  )
}
