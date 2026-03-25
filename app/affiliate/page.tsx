import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Affiliate Program - CombatBooking.com',
  description: 'Earn commissions by referring training camp bookings. Join our affiliate program today.',
  openGraph: {
    title: 'Affiliate Program - CombatBooking.com',
    description: 'Earn commissions by referring training camp bookings. Join our affiliate program today.',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Affiliate Program - CombatBooking.com',
    description: 'Earn commissions by referring training camp bookings. Join our affiliate program today.',
  },
  alternates: {
    canonical: '/affiliate',
  },
}

export default function AffiliatePage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Affiliate Program</h1>
          <p className="text-base text-gray-600">
            Earn commissions by referring training camp bookings
          </p>
        </div>

        <div className="space-y-6 mb-8">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">How It Works</h2>
            <p className="text-sm text-gray-700 mb-4">
              Join our affiliate program and earn commissions when you refer bookings to CombatBooking.com. Perfect for bloggers, influencers, coaches, and anyone with an audience interested in combat sports training.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Benefits</h2>
            <ul className="list-disc pl-6 space-y-2 text-sm text-gray-700">
              <li>Competitive commission rates</li>
              <li>Real-time tracking and reporting</li>
              <li>Marketing materials and support</li>
              <li>Easy payment processing</li>
              <li>No fees to join</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Get Started</h2>
            <p className="text-sm text-gray-700 mb-4">
              Interested in becoming an affiliate? Contact us through our <Link href="/contact" className="text-[#003580] hover:underline">support page</Link> with "Affiliate Program" in the subject line. Include information about your website, social media presence, or audience.
            </p>
          </section>
        </div>

        <Card className="border border-[#003580] rounded-lg shadow-sm">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Ready to Get Started?</h3>
            <p className="text-sm text-gray-600 mb-4">
              Join our affiliate program and start earning today.
            </p>
            <Link href="/contact">
              <button className="bg-[#003580] text-white py-2 px-6 rounded-lg hover:bg-[#003580]/90 transition-colors text-sm font-medium">
                Contact Us
              </button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
