import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import type { Metadata } from 'next'
import { BookOpen, Compass, MapPin, Plane } from 'lucide-react'
import { ArticleShell } from '@/components/guides/article-shell'
import { GuideHero, GuideSection } from '@/components/guides/guide-page-blocks'

export const metadata: Metadata = {
  title: 'Training Guides | Thailand Muay Thai, MMA, BJJ & More | CombatBooking.com',
  description:
    'Data-backed Thailand guides: ranked Muay Thai camps, city shortlists, MMA/BJJ/boxing, and visa planning. Live gym listings—not recycled affiliate lists.',
  openGraph: {
    title: 'Training Guides - CombatBooking.com',
    description:
      'Ranked Thailand camp guides for Muay Thai, MMA, BJJ, and boxing—plus city guides and visa basics.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Training Guides - CombatBooking.com',
    description:
      'Ranked Thailand camp guides for Muay Thai, MMA, BJJ, and boxing—plus city guides and visa basics.',
  },
  alternates: {
    canonical: '/blog',
  },
}

export default function BlogPage() {
  const flagship = [
    {
      title: '25 Best Muay Thai Camps in Thailand (2026)',
      excerpt:
        'Flagship national ranking: twenty-five camps, long-form regional advice, methodology, FAQ, and structured data—built to outrank thin “top 7” posts.',
      category: 'Thailand · Muay Thai',
      href: '/blog/best-muay-thai-camps-thailand-2026',
    },
  ]

  const cityGuides = [
    {
      title: 'Best Muay Thai Gyms in Phuket',
      excerpt: 'Island training: ranked listings, Phuket-specific FAQ, and trip-planning sections.',
      href: '/blog/best-muay-thai-gyms-phuket',
    },
    {
      title: 'Best Muay Thai Gyms in Bangkok',
      excerpt: 'Capital-city logistics, commute tips, and ranked Bangkok Muay Thai camps.',
      href: '/blog/best-muay-thai-gyms-bangkok',
    },
    {
      title: 'Best Muay Thai Gyms in Chiang Mai',
      excerpt: 'Northern Thailand: slower pace, cooler mornings, ranked Muay Thai gyms.',
      href: '/blog/best-muay-thai-gyms-chiang-mai',
    },
    {
      title: 'Best Muay Thai Gyms in Pattaya',
      excerpt: 'Beach-city training with long-stay planning sections and ranked listings.',
      href: '/blog/best-muay-thai-gyms-pattaya',
    },
    {
      title: 'Best Muay Thai Gyms in Hua Hin',
      excerpt: 'Calmer coastal base: long-stay planning and ranked listings.',
      href: '/blog/best-muay-thai-gyms-hua-hin',
    },
    {
      title: 'Best Muay Thai Gyms in Krabi',
      excerpt: 'Ao Nang / limestone coast training: planning tips plus ranked listings.',
      href: '/blog/best-muay-thai-gyms-krabi',
    },
    {
      title: 'Best Muay Thai Gyms in Koh Samui',
      excerpt: 'Island training routines with ranked listings and long-stay planning.',
      href: '/blog/best-muay-thai-gyms-koh-samui',
    },
    {
      title: 'Best Muay Thai Gyms in Koh Phangan',
      excerpt: 'Island discipline guide: routines, recovery, and ranked listings.',
      href: '/blog/best-muay-thai-gyms-koh-phangan',
    },
    {
      title: 'Best Muay Thai Gyms in Koh Tao',
      excerpt: 'Small-island base: sustainable training plans and ranked listings.',
      href: '/blog/best-muay-thai-gyms-koh-tao',
    },
  ]

  const combatSports = [
    {
      title: 'Best MMA Camps in Thailand',
      excerpt: 'MMA-only discipline filter—striking plus grappling context Muay-Thai-only sites cannot own.',
      href: '/blog/best-mma-camps-thailand',
    },
    {
      title: 'Best BJJ Gyms in Thailand',
      excerpt: 'Grappling-first rankings with gi/no-gi planning sections.',
      href: '/blog/best-bjj-gyms-thailand',
    },
    {
      title: 'Best Boxing Gyms in Thailand',
      excerpt: 'Boxing-tagged gyms only—clear intent for hands and footwork searches.',
      href: '/blog/best-boxing-gyms-thailand',
    },
    {
      title: 'Best Kickboxing Gyms in Thailand',
      excerpt: 'Kickboxing-tagged listings only—avoid Muay-Thai-only camps when you want kickboxing intent.',
      href: '/blog/best-kickboxing-gyms-thailand',
    },
    {
      title: 'Best Judo Gyms in Thailand',
      excerpt: 'Judo-tagged listings only—throws + grappling structure for cross-trainers.',
      href: '/blog/best-judo-gyms-thailand',
    },
  ]

  const planning = [
    {
      title: 'Thailand Training Visa / DTV Guide',
      excerpt: 'Long-stay planning: documents, DTV overview, official-source mindset, expanded FAQ.',
      href: '/blog/thailand-training-visa-dtv',
    },
    {
      title: 'Thailand Visa Extension & Overstay Guide',
      excerpt: 'TM.7 mindset, official links, timing mistakes, and overstay risk—built for longer training trips.',
      href: '/blog/thailand-visa-extension-overstay-guide',
    },
  ]

  return (
    <ArticleShell
      title="Training Guides"
      subtitle="Long-form articles with clear sections, live gym data, and internal links. Pick a topic below or jump straight to Thailand search."
      breadcrumbs={[{ label: 'Home', href: '/' }]}
    >
      <GuideHero
        imageSrc="/N-8427.jpeg.avif"
        imageAlt="Combat sports training guides"
        priority
        overlayText="Training guides that rank—and help travelers decide."
      />

      <div className="mb-8 flex flex-wrap gap-3">
        <Link
          href="/blog/best-muay-thai-camps-thailand-2026"
          className="inline-flex items-center rounded-lg bg-[#003580] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#003580]/90"
        >
          Start with Muay Thai top 25
        </Link>
        <Link
          href="/search?country=Thailand"
          className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-900 hover:bg-gray-50"
        >
          Browse Thailand gyms
        </Link>
      </div>

      <GuideSection variant="slate" className="mb-12">
        <div className="flex items-start gap-4">
          <div className="rounded-lg bg-[#003580] p-3 text-white">
            <BookOpen className="h-6 w-6" aria-hidden />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">How these guides are structured</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-700">
              Each article uses consistent hierarchy: hero imagery, table-of-contents anchors, long-form sections, and—where
              listings exist—chunked gym grids with editorial breaks.
            </p>
          </div>
        </div>
      </GuideSection>

      <section className="mb-14">
        <div className="mb-6 flex items-center gap-2 border-b border-gray-200 pb-3">
          <Compass className="h-6 w-6 text-[#003580]" aria-hidden />
          <h2 className="text-2xl font-bold text-gray-900">Flagship</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-1">
          {flagship.map((article) => (
            <Link key={article.href} href={article.href} className="block">
              <Card className="border-2 border-[#003580]/20 bg-gradient-to-br from-[#003580]/5 to-white shadow-md transition-shadow hover:shadow-lg">
                <CardContent className="p-8">
                  <div className="text-xs font-semibold uppercase tracking-wide text-[#003580]">{article.category}</div>
                  <h3 className="mt-2 text-xl font-bold text-gray-900 md:text-2xl">{article.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-gray-700">{article.excerpt}</p>
                  <span className="mt-4 inline-block text-sm font-semibold text-[#003580]">Open guide →</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section className="mb-14">
        <div className="mb-6 flex items-center gap-2 border-b border-gray-200 pb-3">
          <MapPin className="h-6 w-6 text-[#003580]" aria-hidden />
          <h2 className="text-2xl font-bold text-gray-900">City guides</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {cityGuides.map((article) => (
            <Link key={article.href} href={article.href} className="block h-full">
              <Card className="h-full border border-gray-200 shadow-sm transition-shadow hover:shadow-md">
                <CardContent className="flex h-full flex-col p-6">
                  <h3 className="text-lg font-semibold text-gray-900">{article.title}</h3>
                  <p className="mt-2 flex-1 text-sm text-gray-600">{article.excerpt}</p>
                  <span className="mt-4 text-sm font-medium text-[#003580]">Read guide →</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section className="mb-14">
        <div className="mb-6 flex items-center gap-2 border-b border-gray-200 pb-3">
          <Compass className="h-6 w-6 text-[#003580]" aria-hidden />
          <h2 className="text-2xl font-bold text-gray-900">Combat sports (beyond Muay Thai)</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {combatSports.map((article) => (
            <Link key={article.href} href={article.href} className="block h-full">
              <Card className="h-full border border-gray-200 shadow-sm transition-shadow hover:shadow-md">
                <CardContent className="flex h-full flex-col p-6">
                  <h3 className="text-lg font-semibold text-gray-900">{article.title}</h3>
                  <p className="mt-2 flex-1 text-sm text-gray-600">{article.excerpt}</p>
                  <span className="mt-4 text-sm font-medium text-[#003580]">Read guide →</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section className="mb-12">
        <div className="mb-6 flex items-center gap-2 border-b border-gray-200 pb-3">
          <Plane className="h-6 w-6 text-[#003580]" aria-hidden />
          <h2 className="text-2xl font-bold text-gray-900">Planning &amp; visas</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {planning.map((article) => (
            <Link key={article.href} href={article.href} className="block">
              <Card className="border border-amber-100 bg-amber-50/50 shadow-sm transition-shadow hover:shadow-md">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900">{article.title}</h3>
                  <p className="mt-2 text-sm text-gray-700">{article.excerpt}</p>
                  <span className="mt-4 inline-block text-sm font-semibold text-[#003580]">Read guide →</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <div className="text-center">
        <Link
          href="/search?country=Thailand"
          className="inline-flex items-center justify-center rounded-lg bg-[#003580] px-8 py-3 text-sm font-semibold text-white hover:bg-[#003580]/90"
        >
          Browse all Thailand camps
        </Link>
      </div>
    </ArticleShell>
  )
}
