import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { ArticleShell } from '@/components/guides/article-shell'
import { RelatedGuides } from '@/components/guides/related-guides'
import {
  GuideAccentIntro,
  GuideCtaStrip,
  GuideFaqList,
  GuideHero,
  GuideLeadRow,
  GuideSection,
} from '@/components/guides/guide-page-blocks'
import { getThailandGymsForGuide } from '@/lib/guides/thailand-gyms'
import { mergeGymAmenitiesFromDb } from '@/lib/constants/gym-amenities'
import { buildArticleLd, buildBreadcrumbLd, buildFaqLd } from '@/lib/seo/guide-schema'
import { Snowflake, Table2 } from 'lucide-react'

const TITLE = 'Muay Thai Camps with Private AC Rooms in Krabi (2026)'
const SEO_TITLE = 'Muay Thai Krabi Private AC Rooms 2026 [Compare Top Camps]'
const PATH = '/blog/muay-thai-krabi-private-ac-rooms'
const DATE_PUBLISHED = '2026-04-21'
const DATE_MODIFIED = '2026-04-21'
const HERO_IMAGE = '/tjj8r5ovjts8nhqjhkqc.avif'
const DESCRIPTION =
  'Compare Krabi Muay Thai camps with accommodation and air conditioning. A frictionless “top 5” comparison table plus booking-ready links.'

export const metadata: Metadata = {
  title: `${SEO_TITLE} | CombatStay`,
  description: DESCRIPTION,
  alternates: { canonical: PATH },
  openGraph: { title: `${SEO_TITLE} | CombatStay`, description: DESCRIPTION, type: 'article' },
  twitter: { card: 'summary_large_image', title: `${SEO_TITLE} | CombatStay`, description: DESCRIPTION },
}

function yesNo(v: boolean) {
  return v ? 'Yes' : '—'
}

function money(n: number | null | undefined, currency?: string | null) {
  if (typeof n !== 'number' || !Number.isFinite(n) || n <= 0) return '—'
  return `${currency || ''} ${Math.round(n)}`.trim()
}

const FAQ_ITEMS = [
  {
    q: 'Do Krabi Muay Thai camps actually offer private rooms with AC?',
    a: 'Some do—either on-site bungalows/rooms or partner accommodation nearby. Always confirm whether AC is in the room you are booking (not just “AC in common areas”).',
  },
  {
    q: 'Is AC worth it for a Thailand training camp?',
    a: 'For many travelers, yes. Better sleep improves recovery, which improves training consistency. The trade-off is higher total cost.',
  },
  {
    q: 'What should I verify before booking accommodation at a camp?',
    a: 'Private vs shared room, AC vs fan, bathroom type, walk/ride time to the training floor, and whether meals are included.',
  },
  {
    q: 'Is Krabi cheaper than Phuket for a stay-and-train package?',
    a: 'Often, yes—Krabi can offer lower accommodation and food costs than Phuket, while still providing beach access and a strong training routine.',
  },
  {
    q: 'Can I book Krabi camps directly on CombatStay?',
    a: 'Yes—open any gym profile to see live pricing, photos, reviews, and booking-ready details.',
  },
]

export default async function MuayThaiKrabiPrivateAcRoomsPage() {
  const gyms = await getThailandGymsForGuide({ discipline: 'Muay Thai', city: 'Krabi' })
  const withAmenities = gyms.map((g) => ({ ...g, _amenities: mergeGymAmenitiesFromDb((g as any).amenities) }))
  const shortlist = withAmenities
    .filter((g) => g._amenities.accommodation && g._amenities.air_conditioning)
    .slice(0, 5)

  const articleLd = buildArticleLd({
    title: TITLE,
    description: DESCRIPTION,
    path: PATH,
    datePublished: DATE_PUBLISHED,
    dateModified: DATE_MODIFIED,
    imagePath: HERO_IMAGE,
  })
  const faqLd = buildFaqLd(FAQ_ITEMS)
  const breadcrumbLd = buildBreadcrumbLd([
    { name: 'Home', path: '/' },
    { name: 'Training Guides', path: '/blog' },
    { name: 'Thailand', path: '/search?country=Thailand' },
    { name: 'Krabi', path: '/search?country=Thailand&location=Krabi&discipline=Muay%20Thai' },
    { name: TITLE, path: PATH },
  ])

  return (
    <ArticleShell
      title={TITLE}
      subtitle="If your trip goal is progress, sleep is not optional. This page filters for camps that list both accommodation and air conditioning, then lets you compare top options side-by-side."
      breadcrumbs={[
        { label: 'Training Guides', href: '/blog' },
        { label: 'Thailand', href: '/search?country=Thailand' },
        { label: 'Krabi', href: '/search?country=Thailand&location=Krabi&discipline=Muay%20Thai' },
      ]}
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      <GuideHero
        imageSrc={HERO_IMAGE}
        imageAlt="Krabi Muay Thai camps with private accommodation"
        priority
        overlayText="A simple promise: compare top Krabi camps with accommodation + AC in one clean table, then click through to booking-ready profiles."
      />

      <GuideLeadRow
        tocItems={[
          { href: '#compare', label: 'Compare top 5' },
          { href: '#how-to-choose', label: 'How to choose' },
          { href: '#faq', label: 'FAQ' },
        ]}
        statValue={shortlist.length}
        statDescription="Krabi Muay Thai gyms matching: accommodation + air conditioning."
        statIcon={<Snowflake className="h-5 w-5" />}
      />

      <section id="compare" className="mb-14 scroll-mt-24">
        <GuideAccentIntro icon={Table2} title="Frictionless comparison: 5 top Krabi options" subtitle="Clean table, booking-ready links" />

        {shortlist.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-8 text-sm text-gray-700 shadow-sm">
            No Krabi gyms currently list both <strong>accommodation</strong> and <strong>air conditioning</strong> on their profiles.
            Try the live directory and filter by amenities on gym pages.
            <div className="mt-4">
              <Link
                href="/search?country=Thailand&location=Krabi&discipline=Muay%20Thai"
                className="font-semibold text-[#003580] underline"
              >
                Browse Krabi Muay Thai listings →
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                <tr>
                  <th className="px-4 py-3">Gym</th>
                  <th className="px-4 py-3">Rating</th>
                  <th className="px-4 py-3">Reviews</th>
                  <th className="px-4 py-3">From / day</th>
                  <th className="px-4 py-3">On-site acc.</th>
                  <th className="px-4 py-3">AC</th>
                  <th className="px-4 py-3">Meals</th>
                  <th className="px-4 py-3">Book</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-800">
                {shortlist.map((g) => (
                  <tr key={g.id} className="bg-white">
                    <td className="px-4 py-3 font-semibold">
                      <Link href={`/gyms/${g.id}`} className="text-[#003580] underline">
                        {g.name}
                      </Link>
                      <div className="mt-1 text-xs font-normal text-gray-500">
                        {g.city ? `${g.city}, ` : ''}{g.country}
                      </div>
                    </td>
                    <td className="px-4 py-3">{g.averageRating ? g.averageRating.toFixed(2) : '—'}</td>
                    <td className="px-4 py-3">{g.reviewCount || '—'}</td>
                    <td className="px-4 py-3">{money((g as any).price_per_day, (g as any).currency)}</td>
                    <td className="px-4 py-3">{yesNo(g._amenities.accommodation)}</td>
                    <td className="px-4 py-3">{yesNo(g._amenities.air_conditioning)}</td>
                    <td className="px-4 py-3">{yesNo(g._amenities.meals)}</td>
                    <td className="px-4 py-3">
                      <Link href={`/gyms/${g.id}`} className="font-semibold text-[#003580] underline">
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="mt-3 text-xs text-gray-500">
          Tip: &ldquo;AC&rdquo; can mean room AC, gym-floor AC, or common-area AC. Always confirm the accommodation room spec on the gym profile before paying.
        </p>
      </section>

      <GuideSection id="how-to-choose" variant="slate" className="mb-14">
        <h2 className="mb-4 text-2xl font-bold text-gray-900 md:text-3xl">How to choose the right one (fast)</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              t: 'Prioritize sleep first',
              d: 'Private AC rooms help recovery. A cheap camp that ruins sleep usually costs you training days.',
            },
            {
              t: 'Commute kills consistency',
              d: 'If accommodation is “nearby,” check the walk/ride time. Two-a-days are fragile when transport is annoying.',
            },
            {
              t: 'Confirm what is included',
              d: 'Meals, laundry, transfers, and weekly rest days vary. Compare inclusions, not just daily rate.',
            },
          ].map((x) => (
            <div key={x.t} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-gray-900">{x.t}</p>
              <p className="mt-2 text-sm text-gray-700 leading-relaxed">{x.d}</p>
            </div>
          ))}
        </div>
        <p className="mt-6 text-sm text-gray-700">
          If you want a broader Krabi shortlist (not only AC rooms), read{' '}
          <Link href="/blog/best-muay-thai-gyms-krabi" className="font-medium text-[#003580] underline">
            best Muay Thai gyms in Krabi
          </Link>{' '}
          and the flagship{' '}
          <Link href="/blog/best-muay-thai-camps-thailand-2026" className="font-medium text-[#003580] underline">
            25 best Muay Thai camps in Thailand (2026)
          </Link>
          .
        </p>
      </GuideSection>

      <GuideCtaStrip
        title="Browse all Krabi Muay Thai listings"
        subtitle="Compare verified camps beyond this top-5 table."
        href="/search?country=Thailand&location=Krabi&discipline=Muay%20Thai"
        buttonLabel="Open Krabi search"
      />

      <GuideSection id="faq" variant="default" padding="p-6 md:p-8" className="mb-14 shadow-sm">
        <h2 className="mb-2 text-2xl font-bold text-gray-900 md:text-3xl">FAQ</h2>
        <p className="mb-8 text-gray-600">High-intent questions for stay-and-train travelers.</p>
        <GuideFaqList items={FAQ_ITEMS} />
      </GuideSection>

      <RelatedGuides
        guides={[
          { title: 'Best Muay Thai gyms in Krabi', href: '/blog/best-muay-thai-gyms-krabi' },
          { title: 'How much does a Muay Thai camp cost in Thailand?', href: '/blog/muay-thai-camp-thailand-cost' },
          { title: 'Packing list for a combat sports camp in Thailand', href: '/blog/packing-list-combat-sports-camp-thailand' },
          { title: '25 best Muay Thai camps in Thailand (2026)', href: '/blog/best-muay-thai-camps-thailand-2026' },
        ]}
      />
    </ArticleShell>
  )
}

