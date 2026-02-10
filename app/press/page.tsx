import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Media Kit - CombatBooking.com',
  description: 'Resources for journalists, bloggers, and media professionals. Press inquiries and brand assets.',
  openGraph: {
    title: 'Media Kit - CombatBooking.com',
    description: 'Resources for journalists, bloggers, and media professionals. Press inquiries and brand assets.',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Media Kit - CombatBooking.com',
    description: 'Resources for journalists, bloggers, and media professionals. Press inquiries and brand assets.',
  },
  alternates: {
    canonical: '/press',
  },
}

export default function PressPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Media Kit</h1>
          <p className="text-base text-gray-600">
            Resources for journalists, bloggers, and media professionals
          </p>
        </div>

        <div className="space-y-6">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">About CombatBooking.com</h2>
            <p className="text-sm text-gray-700">
              CombatBooking.com is a leading platform connecting fighters and training enthusiasts with verified combat sports training camps and gyms worldwide. We facilitate safe, transparent bookings for training experiences across disciplines including Muay Thai, Boxing, MMA, BJJ, and more.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Press Inquiries</h2>
            <p className="text-sm text-gray-700 mb-4">
              For media inquiries, interview requests, or press releases, please contact us through our <a href="/contact" className="text-[#003580] hover:underline">support page</a> with "Press Inquiry" in the subject line.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Brand Assets</h2>
            <p className="text-sm text-gray-700 mb-4">
              Brand assets and logos are available upon request for approved media use. Please contact us with details about your intended use.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Key Facts</h2>
            <ul className="list-disc pl-6 space-y-2 text-sm text-gray-700">
              <li>Platform launched in 2026</li>
              <li>Verified training camps worldwide</li>
              <li>Focus on safety and transparency</li>
              <li>Serving fighters, athletes, and training enthusiasts</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  )
}
