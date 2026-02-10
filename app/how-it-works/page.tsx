import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Search, Calendar, CreditCard, CheckCircle } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'How It Works - CombatBooking.com',
  description: 'Learn how to book your perfect training camp in four simple steps. Discover how our platform works for both fighters and gym owners.',
  openGraph: {
    title: 'How It Works - CombatBooking.com',
    description: 'Learn how to book your perfect training camp in four simple steps. Discover how our platform works for both fighters and gym owners.',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'How It Works - CombatBooking.com',
    description: 'Learn how to book your perfect training camp in four simple steps. Discover how our platform works for both fighters and gym owners.',
  },
  alternates: {
    canonical: '/how-it-works',
  },
}

export default function HowItWorksPage() {
  const steps = [
    {
      icon: Search,
      title: 'Search & Discover',
      description: 'Browse our curated selection of training camps and gyms. Filter by discipline, location, amenities, and more to find your perfect training experience.',
    },
    {
      icon: Calendar,
      title: 'Select Dates & Package',
      description: 'Choose your training dates and select from available packages. Compare options including accommodation, meal plans, and training intensity levels.',
    },
    {
      icon: CreditCard,
      title: 'Secure Booking',
      description: 'Complete your booking with secure payment. Your payment is authorized immediately but only charged after the gym confirms your reservation.',
    },
    {
      icon: CheckCircle,
      title: 'Train & Enjoy',
      description: 'Receive your confirmation and prepare for your training experience. Access your booking details anytime and contact support if needed.',
    },
  ]

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">How It Works</h1>
          <p className="text-base text-gray-600 max-w-2xl mx-auto">
            Booking your perfect training camp is simple. Follow these four easy steps to get started.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {steps.map((step, index) => {
            const Icon = step.icon
            return (
              <Card key={index} className="border border-gray-200 rounded-lg shadow-sm">
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-full bg-[#003580] bg-opacity-10 flex items-center justify-center mb-4">
                      <Icon className="w-8 h-8 text-[#003580]" />
                    </div>
                    <div className="text-sm font-semibold text-[#003580] mb-2">Step {index + 1}</div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{step.title}</h3>
                    <p className="text-sm text-gray-600">{step.description}</p>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <Card className="border border-gray-200 rounded-lg shadow-sm">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">For Fighters</h2>
              <ul className="space-y-3 text-sm text-gray-700">
                <li className="flex items-start">
                  <span className="text-[#003580] mr-2">✓</span>
                  <span>Browse verified training camps worldwide</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#003580] mr-2">✓</span>
                  <span>Compare packages, prices, and amenities</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#003580] mr-2">✓</span>
                  <span>Read reviews from verified bookings</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#003580] mr-2">✓</span>
                  <span>Book with confidence - secure payment and booking guarantee</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#003580] mr-2">✓</span>
                  <span>Access booking details anytime, even without an account</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 rounded-lg shadow-sm">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">For Gyms</h2>
              <ul className="space-y-3 text-sm text-gray-700">
                <li className="flex items-start">
                  <span className="text-[#003580] mr-2">✓</span>
                  <span>Reach a global audience of dedicated athletes</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#003580] mr-2">✓</span>
                  <span>Showcase your facility with photos and detailed descriptions</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#003580] mr-2">✓</span>
                  <span>Manage bookings and availability easily</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#003580] mr-2">✓</span>
                  <span>Receive verified reviews from real bookings</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#003580] mr-2">✓</span>
                  <span>Get paid securely through our platform</span>
                </li>
              </ul>
              <Link href="/auth/signup?intent=owner">
                <button className="mt-6 w-full bg-[#003580] text-white py-2 px-4 rounded-lg hover:bg-[#003580]/90 transition-colors text-sm font-medium">
                  List Your Gym
                </button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-gray-600 mb-4">Ready to get started?</p>
          <Link href="/search">
            <button className="bg-[#003580] text-white py-3 px-8 rounded-lg hover:bg-[#003580]/90 transition-colors font-medium">
              Browse Training Camps
            </button>
          </Link>
        </div>
      </div>
    </div>
  )
}
