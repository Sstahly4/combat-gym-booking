import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Training Guides - CombatBooking.com',
  description: 'Expert advice and resources to help you make the most of your combat sports training experience.',
  openGraph: {
    title: 'Training Guides - CombatBooking.com',
    description: 'Expert advice and resources to help you make the most of your combat sports training experience.',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Training Guides - CombatBooking.com',
    description: 'Expert advice and resources to help you make the most of your combat sports training experience.',
  },
  alternates: {
    canonical: '/blog',
  },
}

export default function BlogPage() {
  const articles = [
    {
      title: 'How to Choose the Right Training Camp',
      excerpt: 'A comprehensive guide to finding the perfect training environment for your goals and skill level.',
      category: 'Training Tips',
    },
    {
      title: 'What to Pack for Your Training Camp',
      excerpt: 'Essential items and equipment you\'ll need for your combat sports training experience.',
      category: 'Preparation',
    },
    {
      title: 'Understanding Different Training Styles',
      excerpt: 'Learn about the various approaches to combat sports training and which might suit you best.',
      category: 'Education',
    },
    {
      title: 'Safety First: Training Camp Safety Guide',
      excerpt: 'Important safety considerations and what to look for when choosing a training camp.',
      category: 'Safety',
    },
  ]

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Training Guides</h1>
          <p className="text-base text-gray-600">
            Expert advice and resources to help you make the most of your training experience
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {articles.map((article, index) => (
            <Card key={index} className="border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="text-xs font-medium text-[#003580] mb-2">{article.category}</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{article.title}</h3>
                <p className="text-sm text-gray-600 mb-4">{article.excerpt}</p>
                <button className="text-sm text-[#003580] font-medium hover:underline">
                  Read More →
                </button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-gray-600 mb-4">More guides coming soon!</p>
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
