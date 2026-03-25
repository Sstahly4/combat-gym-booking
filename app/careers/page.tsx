import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Join Our Team - CombatBooking.com',
  description: 'Help us build the future of combat sports training. Explore career opportunities at CombatBooking.com.',
  openGraph: {
    title: 'Join Our Team - CombatBooking.com',
    description: 'Help us build the future of combat sports training. Explore career opportunities at CombatBooking.com.',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Join Our Team - CombatBooking.com',
    description: 'Help us build the future of combat sports training. Explore career opportunities at CombatBooking.com.',
  },
  alternates: {
    canonical: '/careers',
  },
}

export default function CareersPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Join Our Team</h1>
          <p className="text-base text-gray-600">
            Help us build the future of combat sports training
          </p>
        </div>

        <div className="space-y-6 mb-12">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Why Work With Us</h2>
            <p className="text-sm text-gray-700 mb-4">
              CombatBooking.com is growing rapidly, and we're looking for passionate individuals who share our vision of connecting fighters with world-class training opportunities.
            </p>
            <ul className="list-disc pl-6 space-y-2 text-sm text-gray-700">
              <li>Work with a mission-driven team</li>
              <li>Remote-friendly work environment</li>
              <li>Competitive compensation and benefits</li>
              <li>Opportunities for growth and development</li>
              <li>Make a real impact in the combat sports community</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Open Positions</h2>
            <p className="text-sm text-gray-600 mb-4">
              We're always looking for talented individuals. Check back soon for open positions, or send us your resume for future opportunities.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Get in Touch</h2>
            <p className="text-sm text-gray-700 mb-4">
              Interested in joining our team? We'd love to hear from you. Send us a message through our <Link href="/contact" className="text-[#003580] hover:underline">contact page</Link> with "Career Inquiry" in the subject line.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
