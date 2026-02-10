import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Accessibility Statement - CombatBooking.com',
  description: 'Learn about our commitment to digital accessibility and how we ensure our platform is accessible to everyone.',
  openGraph: {
    title: 'Accessibility Statement - CombatBooking.com',
    description: 'Learn about our commitment to digital accessibility and how we ensure our platform is accessible to everyone.',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Accessibility Statement - CombatBooking.com',
    description: 'Learn about our commitment to digital accessibility and how we ensure our platform is accessible to everyone.',
  },
  alternates: {
    canonical: '/accessibility',
  },
}

export default function AccessibilityPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Accessibility Statement</h1>
        <div className="prose prose-sm max-w-none space-y-6 text-gray-700">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Our Commitment</h2>
            <p>
              CombatBooking.com is committed to ensuring digital accessibility for people with disabilities. We are continually improving the user experience for everyone and applying the relevant accessibility standards to achieve these goals.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Accessibility Standards</h2>
            <p>
              We aim to conform to the Web Content Accessibility Guidelines (WCAG) 2.1 Level AA standards. These guidelines explain how to make web content more accessible for people with disabilities and user-friendly for everyone.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Measures We Take</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Providing alternative text for images and visual content</li>
              <li>Ensuring proper heading structure and semantic HTML</li>
              <li>Maintaining sufficient color contrast ratios</li>
              <li>Supporting keyboard navigation throughout the platform</li>
              <li>Providing clear focus indicators for interactive elements</li>
              <li>Ensuring forms are properly labeled and accessible</li>
              <li>Making content readable and understandable</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Known Limitations</h2>
            <p>
              Despite our efforts to ensure accessibility, there may be some limitations. We are actively working to address these issues and improve accessibility across the platform. If you encounter any accessibility barriers, please contact us.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Feedback</h2>
            <p>
              We welcome your feedback on the accessibility of CombatBooking.com. If you encounter accessibility barriers or have suggestions for improvement, please contact us through our <a href="/contact" className="text-[#003580] hover:underline">support page</a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Third-Party Content</h2>
            <p>
              Some content on our platform may be provided by third parties (such as gym images and descriptions). While we encourage accessibility, we cannot guarantee the accessibility of all third-party content.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Ongoing Efforts</h2>
            <p>
              We regularly review and update our platform to improve accessibility. This includes conducting accessibility audits, training our team, and implementing improvements based on user feedback and evolving standards.
            </p>
          </section>

          <div className="text-sm text-gray-500 mt-8 pt-6 border-t">
            <p>Last Updated: January 2026</p>
          </div>
        </div>
      </div>
    </div>
  )
}
