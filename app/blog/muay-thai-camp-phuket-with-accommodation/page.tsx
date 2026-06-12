import type { Metadata } from 'next'
import Link from 'next/link'
import { ArticleShell } from '@/components/guides/article-shell'
import { RelatedGuides } from '@/components/guides/related-guides'
import { GuideStayTrainListingBlock } from '@/components/guides/guide-stay-train-listing-block'
import { GuideStayTrainPhotoStrip } from '@/components/guides/guide-stay-train-photo-strip'
import { GuideCtaStrip, GuideFaqList, GuideHero, GuideLeadRow } from '@/components/guides/guide-page-blocks'
import { getStayTrainShortlist, pickCityHeroImage } from '@/lib/guides/stay-train-shortlist'
import { buildArticleLd, buildBreadcrumbLd, buildFaqLd } from '@/lib/seo/guide-schema'
import { BedDouble } from 'lucide-react'

const TITLE = 'Muay Thai Camp Phuket With Accommodation: 2026 Stays'
const PATH = '/blog/muay-thai-camp-phuket-with-accommodation'
const CITY = 'Phuket'
const DATE_PUBLISHED = '2026-06-11'
const DATE_MODIFIED = '2026-06-11'
const HERO_FALLBACK = '/IMG_3557_246c0a62-a253-4f95-abfd-9cb306228c6c.jpg'
const DESCRIPTION =
  'Compare the best Muay Thai camps in Phuket with on-site accommodation. View real prices, fighter housing amenities, and book packages directly.'

export const metadata: Metadata = {
  title: `${TITLE} | CombatStay`,
  description: DESCRIPTION,
  alternates: { canonical: PATH },
  openGraph: { title: `${TITLE} | CombatStay`, description: DESCRIPTION, type: 'article' },
  twitter: { card: 'summary_large_image', title: `${TITLE} | CombatStay`, description: DESCRIPTION },
}

const FAQ_ITEMS = [
  {
    q: 'Do Phuket Muay Thai camps include on-site accommodation?',
    a: 'Many do. CombatStay listings flag on-site accommodation as a structured amenity. Open each gym profile to confirm room type, AC, and whether meals are bundled in your package tier.',
  },
  {
    q: 'How much does a Phuket Muay Thai camp with accommodation cost?',
    a: 'Day rates vary by camp and room tier. Resort-style Chalong and Rawai camps run higher than fan-room bundles in quieter areas. Use live package prices on each listing rather than blog estimates.',
  },
  {
    q: 'Phuket vs booking a gym plus a beach hotel?',
    a: 'On-site housing removes commute friction for two-a-day schedules. A separate beach hotel works if you train once per day and your partner wants a different neighborhood. Compare total price, not only the mat fee.',
  },
  {
    q: 'Which Phuket areas have the most train-and-stay camps?',
    a: 'Chalong and Rawai cluster fight gyms with on-site rooms. Bang Tao and Kamala have fewer camps but suit travelers who split gym and resort stays. See suburb guides linked below.',
  },
  {
    q: 'Are meals included in Phuket all-inclusive packages?',
    a: 'Often one or two meals per day at camps that list the meals amenity. Confirm breakfast vs dinner count on the package page before checkout.',
  },
]

export default async function MuayThaiCampPhuketWithAccommodationPage() {
  const listings = await getStayTrainShortlist({ city: CITY, accommodation: true, meals: true, limit: 12 })
  const heroImage = pickCityHeroImage(listings, HERO_FALLBACK)

  const articleLd = buildArticleLd({
    title: TITLE,
    description: DESCRIPTION,
    path: PATH,
    datePublished: DATE_PUBLISHED,
    dateModified: DATE_MODIFIED,
    imagePath: heroImage,
  })

  return (
    <ArticleShell
      title={TITLE}
      subtitle="Phuket camps with on-site rooms, live package prices, and instant booking."
      breadcrumbs={[
        { label: 'Training Guides', href: '/blog' },
        { label: 'Phuket', href: '/blog/best-muay-thai-gyms-phuket' },
      ]}
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(buildFaqLd(FAQ_ITEMS)) }} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            buildBreadcrumbLd([
              { name: 'Home', path: '/' },
              { name: 'Training Guides', path: '/blog' },
              { name: 'Phuket', path: '/blog/best-muay-thai-gyms-phuket' },
              { name: TITLE, path: PATH },
            ])
          ),
        }}
      />

      <GuideHero
        imageSrc={heroImage}
        imageAlt={`Muay Thai train-and-stay camp in ${CITY}, Thailand`}
        priority
        overlayText={
          listings[0]?.name
            ? `Featured: ${listings[0].name} and ${Math.max(listings.length - 1, 0)} more Phuket camps with on-site accommodation.`
            : `Phuket train-and-stay camps with on-site rooms and live package prices.`
        }
      />

      <GuideLeadRow
        tocItems={[
          { href: '#listings', label: 'Compare camps' },
          { href: '#faq', label: 'FAQ' },
        ]}
        statValue={listings.length}
        statDescription={`${CITY} Muay Thai gyms on CombatStay listing on-site accommodation.`}
        statIcon={<BedDouble className="h-5 w-5" />}
      />

      <GuideStayTrainPhotoStrip gyms={listings} city={CITY} />

      <div className="mb-10 max-w-3xl space-y-4 text-base leading-relaxed text-gray-800">
        <p>
          Phuket runs the largest train-and-stay market in Thailand: on-site dorms, private AC rooms, and full-board
          packages within walking distance of the ring. Most travelers pick the island when they want twice-daily sessions
          without a daily taxi bill.
        </p>
        <p>
          Camps cluster in Chalong and Rawai on the south coast. Drill into{' '}
          <Link href="/blog/best-muay-thai-gyms/chalong" className="font-medium text-[#003580] underline">
            Chalong
          </Link>
          ,{' '}
          <Link href="/blog/best-muay-thai-gyms/rawai" className="font-medium text-[#003580] underline">
            Rawai
          </Link>
          ,{' '}
          <Link href="/blog/best-muay-thai-gyms/bang-tao" className="font-medium text-[#003580] underline">
            Bang Tao
          </Link>
          , or{' '}
          <Link href="/blog/best-muay-thai-gyms/kamala" className="font-medium text-[#003580] underline">
            Kamala
          </Link>{' '}
          if you already know your neighborhood. Cards below use photos from live listings; packages with meals sort first.
        </p>
      </div>

      <GuideStayTrainListingBlock
        gyms={listings}
        id="listings"
        title="Phuket Muay Thai camps with accommodation"
        subtitle="Verified listings with on-site housing. All-inclusive packages prioritized."
        ctaUrl="/search?country=Thailand&location=Phuket&discipline=Muay%20Thai&accommodation=true"
        ctaLabel="Browse Phuket stay-and-train"
      />

      <GuideCtaStrip
        variant="light"
        title="Need the full Phuket gym ranking?"
        subtitle="Reviews, schedules, and trip planning beyond accommodation-only filters."
        href="/blog/best-muay-thai-gyms-phuket"
        buttonLabel="Phuket city guide"
      />

      <section id="faq" className="mb-14 scroll-mt-24 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">
        <h2 className="mb-6 text-2xl font-bold text-gray-900">FAQ</h2>
        <GuideFaqList items={FAQ_ITEMS} />
      </section>

      <RelatedGuides
        guides={[
          { title: 'Best Muay Thai gyms in Phuket', href: '/blog/best-muay-thai-gyms-phuket' },
          { title: 'Thailand training camp with accommodation', href: '/blog/thailand-training-camp-with-accommodation' },
          { title: 'Muay Thai Krabi private AC rooms', href: '/blog/muay-thai-krabi-private-ac-rooms' },
        ]}
      />
    </ArticleShell>
  )
}
