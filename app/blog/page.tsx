import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import type { Metadata } from 'next'
import { BookOpen, Compass, MapPin, Plane } from 'lucide-react'
import { ArticleShell } from '@/components/guides/article-shell'
import { GuideHero, GuideSection } from '@/components/guides/guide-page-blocks'

export const metadata: Metadata = {
  title: 'Training Guides | Thailand Muay Thai, MMA, BJJ & More | CombatStay.com',
  description:
    'Data-backed Thailand guides: ranked Muay Thai camps, city shortlists, MMA/BJJ/boxing, and visa planning. Live gym listings, not recycled affiliate lists.',
  openGraph: {
    title: 'Training Guides - CombatStay.com',
    description:
      'Ranked Thailand camp guides for Muay Thai, MMA, BJJ, and boxing, plus city guides and visa basics.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Training Guides - CombatStay.com',
    description:
      'Ranked Thailand camp guides for Muay Thai, MMA, BJJ, and boxing, plus city guides and visa basics.',
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
        'Flagship national ranking: twenty-five camps, long-form regional advice, methodology, FAQ, and structured data built to outrank thin “top 7” posts.',
      category: 'Thailand · Muay Thai',
      href: '/blog/best-muay-thai-camps-thailand-2026',
    },
  ]

  const australiaGuides = [
    {
      title: 'Muay Thai Trip from Australia (2026)',
      excerpt: 'Flights, visas, AUD budget, jet lag, and a 14-day trip template for Sydney, Melbourne, and Brisbane departures.',
      href: '/blog/muay-thai-trip-from-australia',
    },
    {
      title: 'Thailand Training Holiday from Australia (2026)',
      excerpt: 'Balance pads and beach time: annual leave math, partner-friendly bases, and a sample holiday week.',
      href: '/blog/thailand-training-holiday-australia',
    },
  ]

  const usaGuides = [
    {
      title: 'Muay Thai Trip From USA: Complete 2026 Guide & Booking',
      excerpt: 'Flights, 60-day visa exemption, USD budget ranges, and stay-and-train camp comparison for US travelers.',
      href: '/blog/muay-thai-trip-from-usa',
    },
    {
      title: 'Thailand Training Holiday USA: Packages & Prices [2026]',
      excerpt: 'All-inclusive Muay Thai holiday packages with live prices, recovery amenities, and instant booking.',
      href: '/blog/thailand-training-holiday-usa',
    },
  ]

  const ukGuides = [
    {
      title: 'Muay Thai Trip From UK: 2026 Planning & Camp Booking',
      excerpt: 'Flight hubs, 60-day entry, GBP budgeting, DTV pointers, and bookable camp listings for UK travelers.',
      href: '/blog/muay-thai-trip-from-uk',
    },
    {
      title: 'Thailand Training Holiday UK: Compare Stays & Reviews',
      excerpt: 'Fight-camp vs holiday pace, package pricing in GBP, and live stay-and-train listings with reviews.',
      href: '/blog/thailand-training-holiday-uk',
    },
  ]

  const trainingBasics = [
    {
      title: 'What Is the Best Muay Thai Camp in Thailand for Beginners? (2026)',
      excerpt:
        'No single camp wins for everyone. City fit, commute, coaching style, and a booking checklist for your first trip.',
      href: '/blog/best-muay-thai-camp-thailand-beginners',
    },
    {
      title: 'How Much Does a Muay Thai Camp in Thailand Cost? (2026)',
      excerpt: 'Real 2026 numbers with a summary pricing table + hidden costs to budget for.',
      href: '/blog/muay-thai-camp-thailand-cost',
    },
    {
      title: '1-Week vs. 1-Month Muay Thai Camps: What to Expect',
      excerpt: 'Progress curve, cost-per-day logic, and who each stay length fits.',
      href: '/blog/muay-thai-camp-1-week-vs-1-month',
    },
    {
      title: 'Packing List for a Combat Sports Camp in Thailand',
      excerpt: 'What to bring, what to buy locally, and what to leave at home.',
      href: '/blog/packing-list-combat-sports-camp-thailand',
    },
    {
      title: "Beginner's Guide to Training Muay Thai in Chiang Mai",
      excerpt: 'A week-by-week beginner plan, gear, mistakes to avoid, and how to choose a gym.',
      href: '/blog/beginners-guide-muay-thai-chiang-mai',
    },
    {
      title: 'Koh Tao vs. Koh Phangan: Where Is the Best Place to Train?',
      excerpt: 'A direct island comparison on gyms, cost, pace, and stay length.',
      href: '/blog/koh-tao-vs-koh-phangan-muay-thai',
    },
    {
      title: 'Top 5 Fitness & Conditioning Gyms for Fighters in Phuket',
      excerpt: 'How to layer S&C and recovery around a Phuket fight camp (without burning out).',
      href: '/blog/phuket-fighter-conditioning-gyms',
    },
    {
      title: 'LUDUS Sports Complex Chalong: Training & Stay Guide (2026)',
      excerpt:
        '5,000 m² Fitness Street resort: Muay Thai & MMA prices, coach résumés, spa/hotel amenities, and honest Tiger vs Unit 27 comparison.',
      href: '/blog/ludus-sports-complex-chalong-phuket',
    },
    {
      title: 'Muay Thai Camps with Private AC Rooms in Krabi',
      excerpt: 'High-intent stay-and-train shortlist with a clean side-by-side comparison table.',
      href: '/blog/muay-thai-krabi-private-ac-rooms',
    },
    {
      title: 'Thailand Training Camp with Accommodation (2026)',
      excerpt:
        'Train-and-stay packages explained: inclusion types, live comparison table, city price bands, and a ten-point booking checklist.',
      href: '/blog/thailand-training-camp-with-accommodation',
    },
    {
      title: 'Best Muay Thai Gym for Female Solo Travelers (2026)',
      excerpt: 'Trust-first checklist + frictionless top-5 comparison built from verified listings.',
      href: '/blog/best-muay-thai-gym-female-solo-travelers-2026',
    },
    {
      title: 'Muay Thai Fight Prep Camps with On-Site Physiotherapy',
      excerpt: 'Fight camp recovery-first shortlist: physio + competition-prep signals, compared cleanly.',
      href: '/blog/muay-thai-fight-prep-camps-physiotherapy',
    },
    {
      title: "Don’t Get Burned: 4 Things to Check Before Booking a Thailand Training Trip",
      excerpt: 'A high-intent checklist covering visas, recovery entities, schedule clarity, and commute reality.',
      href: '/blog/dont-get-burned-thailand-training-trip',
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

  const cityAccommodationHubs = [
    {
      title: 'Muay Thai Camp Phuket With Accommodation: 2026 Stays',
      excerpt: 'Phuket train-and-stay listings with on-site housing and all-inclusive sort.',
      href: '/blog/muay-thai-camp-phuket-with-accommodation',
    },
    {
      title: 'Bangkok Muay Thai Train and Stay: Top Packages [2026]',
      excerpt: 'Bangkok packages with on-site accommodation and live rates.',
      href: '/blog/bangkok-muay-thai-train-and-stay',
    },
    {
      title: 'Chiang Mai Muay Thai Train and Stay: Compare 2026 Stays',
      excerpt: 'Northern train-and-stay packages with bungalows and long-stay pricing.',
      href: '/blog/chiang-mai-muay-thai-train-and-stay',
    },
    {
      title: 'Koh Samui Muay Thai Camp With Accommodation: 2026 Stays',
      excerpt: 'Island stay-and-train listings with live package prices.',
      href: '/blog/koh-samui-muay-thai-camp-with-accommodation',
    },
  ]

  const brandProfileGuides = [
    {
      title: 'Tiger Muay Thai Review & Packages: 2026 Price Guide',
      excerpt: 'Quick facts, package pricing context, and bookable Chalong alternatives.',
      href: '/blog/tiger-muay-thai-review-packages',
    },
    {
      title: 'Bangtao Muay Thai & MMA: 2026 Prices & Stays',
      excerpt: 'Bang Tao camp costs, facilities, and instantly bookable west-coast options.',
      href: '/blog/bangtao-muay-thai-mma-prices',
    },
    {
      title: 'AKA Thailand Reviews, Packages & Booking Guide [2026]',
      excerpt: 'Fighter-focused review with package breakdown and Phuket train-and-stay alternatives.',
      href: '/blog/aka-thailand-reviews-booking',
    },
    {
      title: 'Fairtex Training Center Pattaya: Packages & Review',
      excerpt: 'Legendary Pattaya camp: on-site hotel rates, training tiers, and booking path.',
      href: '/blog/fairtex-training-center-pattaya-packages',
    },
    {
      title: 'Krudam Gym Bangkok: Review & Training Packages [2026]',
      excerpt: 'Bangkok quick facts, class reviews context, and live stay-and-train listings.',
      href: '/blog/krudam-gym-bangkok-review',
    },
  ]

  const microLocations = [
    {
      title: 'Best Muay Thai gyms in Bang Tao',
      excerpt: 'Phuket suburb guide (live listings): compare gyms by reviews, then filter dates and amenities.',
      href: '/blog/best-muay-thai-gyms/bang-tao',
    },
    {
      title: 'Best Muay Thai gyms in Rawai',
      excerpt: 'South Phuket shortlist ranked from verified listings with live gym data.',
      href: '/blog/best-muay-thai-gyms/rawai',
    },
    {
      title: 'Best Muay Thai gyms in Chalong',
      excerpt: 'Training base + logistics: commute-first ranking with live gym data.',
      href: '/blog/best-muay-thai-gyms/chalong',
    },
    {
      title: 'Best Muay Thai gyms in Kamala',
      excerpt: 'Smaller-area guide: live rankings, FAQs, and a fast path into filtered search.',
      href: '/blog/best-muay-thai-gyms/kamala',
    },
  ]

  const combatSports = [
    {
      title: 'Best MMA Camps in Thailand',
      excerpt: 'MMA-only discipline filter with striking and grappling context.',
      href: '/blog/best-mma-camps-thailand',
    },
    {
      title: 'Best BJJ Gyms in Thailand',
      excerpt: 'Grappling-first rankings with gi/no-gi planning sections.',
      href: '/blog/best-bjj-gyms-thailand',
    },
    {
      title: 'Best Boxing Gyms in Thailand',
      excerpt: 'Boxing-tagged gyms only, with clear intent for hands and footwork searches.',
      href: '/blog/best-boxing-gyms-thailand',
    },
    {
      title: 'Best Kickboxing Gyms in Thailand',
      excerpt: 'Kickboxing-tagged listings only. Skip Muay-Thai-only camps when you want kickboxing intent.',
      href: '/blog/best-kickboxing-gyms-thailand',
    },
    {
      title: 'Best Judo Gyms in Thailand',
      excerpt: 'Judo-tagged listings only, with throws and grappling structure for cross-trainers.',
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
      title: 'Visas for Martial Arts Training in Thailand (ED visa + alternatives)',
      excerpt: 'A structured planning framework for longer Muay Thai/BJJ/MMA stays. Editorial guide, not legal advice.',
      href: '/blog/ed-visa-martial-arts-training-thailand',
    },
    {
      title: 'Thailand Visa Extension & Overstay Guide',
      excerpt: 'TM.7 mindset, official links, timing mistakes, and overstay risk, built for longer training trips.',
      href: '/blog/thailand-visa-extension-overstay-guide',
    },
    {
      title: 'The Ultimate Guide to Combat Sports Travel in Thailand (2026)',
      excerpt: 'Pillar hub: visas, packing, recovery, gym selection, and mistake-proof planning in one place.',
      href: '/blog/combat-sports-travel-guide-thailand-2026',
    },
    {
      title: "The 2026 Fighter’s Blueprint: 7 Camps with High-Spec Recovery & On‑Site Housing",
      excerpt: 'Recovery-first shortlist built from live amenities (ice bath/sauna/physio/massage + accommodation).',
      href: '/blog/fighters-blueprint-recovery-housing-thailand-2026',
    },
  ]

  return (
    <ArticleShell
      title="Training Guides"
      subtitle="Long-form articles with clear sections, live gym data, and internal links. Pick a topic below or jump straight to Thailand search."
      breadcrumbs={[{ label: 'Home', href: '/' }]}
    >
      <GuideHero
        imageSrc="/training-center-1.avif"
        imageAlt="Combat sports training guides"
        priority
        overlayText="Training guides that rank and help travelers decide."
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
              Each article uses consistent hierarchy: hero imagery, table-of-contents anchors, long-form sections, and
              chunked gym grids with editorial breaks where listings exist.
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
          <MapPin className="h-6 w-6 text-[#003580]" aria-hidden />
          <h2 className="text-2xl font-bold text-gray-900">City train-and-stay hubs</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {cityAccommodationHubs.map((article) => (
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
          <BookOpen className="h-6 w-6 text-[#003580]" aria-hidden />
          <h2 className="text-2xl font-bold text-gray-900">Brand profiles &amp; reviews</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {brandProfileGuides.map((article) => (
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
          <MapPin className="h-6 w-6 text-[#003580]" aria-hidden />
          <h2 className="text-2xl font-bold text-gray-900">Micro-location guides (suburbs)</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {microLocations.map((article) => (
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
        <p className="mt-4 text-xs text-gray-500">
          New suburbs automatically become indexable as soon as gyms appear with matching city/suburb values.
        </p>
      </section>

      <section className="mb-14">
        <div className="mb-6 flex items-center gap-2 border-b border-gray-200 pb-3">
          <Plane className="h-6 w-6 text-[#003580]" aria-hidden />
          <h2 className="text-2xl font-bold text-gray-900">Australia → Thailand</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {australiaGuides.map((article) => (
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
          <Plane className="h-6 w-6 text-[#003580]" aria-hidden />
          <h2 className="text-2xl font-bold text-gray-900">USA → Thailand</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {usaGuides.map((article) => (
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
          <Plane className="h-6 w-6 text-[#003580]" aria-hidden />
          <h2 className="text-2xl font-bold text-gray-900">UK → Thailand</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {ukGuides.map((article) => (
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
          <h2 className="text-2xl font-bold text-gray-900">Training basics (cost, packing, planning)</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {trainingBasics.map((article) => (
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
