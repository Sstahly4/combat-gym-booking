import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Top Locations - CombatBooking.com',
  description: 'Discover training camps in the world\'s premier combat sports destinations including Thailand, Brazil, Philippines, and more.',
  openGraph: {
    title: 'Top Locations - CombatBooking.com',
    description: 'Discover training camps in the world\'s premier combat sports destinations including Thailand, Brazil, Philippines, and more.',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Top Locations - CombatBooking.com',
    description: 'Discover training camps in the world\'s premier combat sports destinations including Thailand, Brazil, Philippines, and more.',
  },
  alternates: {
    canonical: '/destinations',
  },
}

export default function DestinationsPage() {
  const destinations = [
    { name: 'Thailand', description: 'The birthplace of Muay Thai, home to world-class training camps' },
    { name: 'Philippines', description: 'Top boxing gyms and training facilities' },
    { name: 'Brazil', description: 'Premier BJJ and MMA training destinations' },
    { name: 'United States', description: 'Elite boxing and MMA facilities' },
    { name: 'United Kingdom', description: 'Professional boxing and combat sports training' },
    { name: 'Netherlands', description: 'Kickboxing and MMA excellence' },
  ]

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Top Locations</h1>
          <p className="text-base text-gray-600">
            Discover training camps in the world's premier combat sports destinations
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {destinations.map((destination) => (
            <Link key={destination.name} href={`/search?country=${encodeURIComponent(destination.name)}`}>
              <Card className="border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow h-full">
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">{destination.name}</h3>
                  <p className="text-sm text-gray-600">{destination.description}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link href="/search">
            <button className="bg-[#003580] text-white py-3 px-8 rounded-lg hover:bg-[#003580]/90 transition-colors font-medium">
              Browse All Locations
            </button>
          </Link>
        </div>
      </div>
    </div>
  )
}
