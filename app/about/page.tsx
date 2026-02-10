import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About Us - CombatBooking.com',
  description: 'Learn about CombatBooking.com, our mission to connect fighters with world-class training camps, and our commitment to safety and transparency.',
  openGraph: {
    title: 'About Us - CombatBooking.com',
    description: 'Learn about CombatBooking.com, our mission to connect fighters with world-class training camps, and our commitment to safety and transparency.',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'About Us - CombatBooking.com',
    description: 'Learn about CombatBooking.com, our mission to connect fighters with world-class training camps, and our commitment to safety and transparency.',
  },
  alternates: {
    canonical: '/about',
  },
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">About Us</h1>
        <div className="prose prose-sm max-w-none space-y-6 text-gray-700">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Our Mission</h2>
            <p>
              CombatBooking.com is dedicated to connecting fighters, athletes, and training enthusiasts with the world's best combat sports training camps and gyms. We believe that finding the right training environment should be simple, transparent, and safe.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">What We Do</h2>
            <p>
              We provide a comprehensive platform where you can discover, compare, and book training camps across various combat sports disciplines including Muay Thai, Boxing, MMA, BJJ, and more. Our platform makes it easy to find the perfect training experience, whether you're a beginner looking to learn or a professional fighter preparing for competition.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">For Fighters</h2>
            <p>
              We understand the unique needs of combat sports athletes. Our platform helps you find training camps that match your skill level, goals, and preferences. From authentic traditional training experiences to modern facilities with world-class amenities, we help you discover the training environment that's right for you.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">For Gyms</h2>
            <p>
              We provide gym owners and trainers with a platform to showcase their facilities and reach a global audience of dedicated athletes. Our tools help you manage bookings, showcase your unique offerings, and grow your business while maintaining the highest standards of safety and professionalism.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Safety First</h2>
            <p>
              Safety is our top priority. We verify gym credentials, trainer certifications, and facility standards during the approval process. We work closely with gyms to ensure they maintain proper safety protocols and provide transparent information about their training programs. However, as a booking platform, we do not operate or control gym facilities, and users participate in training at their own risk. We strongly recommend appropriate insurance coverage for all participants.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Our Values</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Transparency:</strong> Clear pricing, policies, and expectations</li>
              <li><strong>Safety:</strong> Verified facilities and certified trainers</li>
              <li><strong>Quality:</strong> Curated selection of reputable training camps</li>
              <li><strong>Support:</strong> Dedicated customer service for both fighters and gyms</li>
              <li><strong>Community:</strong> Building connections within the combat sports world</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Contact Us</h2>
            <p>
              Have questions or want to learn more? Visit our <a href="/contact" className="text-[#003580] hover:underline">support page</a> or check out our <a href="/how-it-works" className="text-[#003580] hover:underline">How It Works</a> page to learn more about using our platform.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
