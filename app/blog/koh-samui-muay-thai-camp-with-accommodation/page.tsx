import type { Metadata } from 'next'
import { ArticleShell } from '@/components/guides/article-shell'
import { RelatedGuides } from '@/components/guides/related-guides'
import { GuideStayTrainListingBlock } from '@/components/guides/guide-stay-train-listing-block'
import { GuideStayTrainPhotoStrip } from '@/components/guides/guide-stay-train-photo-strip'
import { GuideCtaStrip, GuideFaqList, GuideHero, GuideLeadRow } from '@/components/guides/guide-page-blocks'
import { getStayTrainShortlist, pickCityHeroImage } from '@/lib/guides/stay-train-shortlist'
import { buildArticleLd, buildBreadcrumbLd, buildFaqLd } from '@/lib/seo/guide-schema'
import { BedDouble } from 'lucide-react'

const TITLE = 'Koh Samui Muay Thai Camp With Accommodation: 2026 Stays'
const PATH = '/blog/koh-samui-muay-thai-camp-with-accommodation'
const CITY = 'Koh Samui'
const DATE_PUBLISHED = '2026-06-11'
const DATE_MODIFIED = '2026-06-11'
const HERO_FALLBACK = '/training-center-1.avif'
const DESCRIPTION =
  'Compare Koh Samui Muay Thai camps with on-site accommodation. View real prices, island packages, and book stay-and-train deals directly.'

export const metadata: Metadata = {
  title: `${TITLE} | CombatStay`,
  description: DESCRIPTION,
  alternates: { canonical: PATH },
  openGraph: { title: `${TITLE} | CombatStay`, description: DESCRIPTION, type: 'article' },
  twitter: { card: 'summary_large_image', title: `${TITLE} | CombatStay`, description: DESCRIPTION },
}

const FAQ_ITEMS = [
  {
    q: 'Do Koh Samui Muay Thai camps include accommodation?',
    a: 'Some do, though inventory is smaller than Phuket. Listings on CombatStay flag on-site accommodation when gyms verify it. Confirm room type on each profile.',
  },
  {
    q: 'How much does Koh Samui train and stay cost?',
    a: 'Island supply chains push food and room costs above Chiang Mai. Package prices still beat booking a resort plus daily drop-ins if you train most days.',
  },
  {
    q: 'Koh Samui or Phuket for a training holiday with housing?',
    a: 'Phuket has more camps and suburb choice. Koh Samui fits travelers who want a smaller island base and can accept fewer gym options.',
  },
  {
    q: 'When is the best season for Koh Samui train-and-stay?',
    a: 'Gulf island rain patterns differ from Phuket. Check month-by-month weather before you book a long stay.',
  },
  {
    q: 'Are flights to Koh Samui included in camp packages?',
    a: 'Rarely. Most packages cover room and training only. Some camps list airport transfer as an amenity; confirm on the gym profile.',
  },
]

export default async function KohSamuiMuayThaiCampWithAccommodationPage() {
  const listings = await getStayTrainShortlist({ city: CITY, accommodation: true, limit: 10 })
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
      subtitle="Koh Samui stay-and-train listings with live package prices."
      breadcrumbs={[
        { label: 'Training Guides', href: '/blog' },
        { label: 'Koh Samui', href: '/blog/best-muay-thai-gyms-koh-samui' },
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
              { name: 'Koh Samui', path: '/blog/best-muay-thai-gyms-koh-samui' },
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
            ? `Featured: ${listings[0].name}${listings.length > 1 ? ` and ${listings.length - 1} more Samui camps with on-site rooms.` : '.'}`
            : `Koh Samui train-and-stay listings with live package prices.`
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

      <GuideStayTrainPhotoStrip gyms={listings} city={CITY} max={4} />

      <div className="mb-10 max-w-3xl space-y-4 text-base leading-relaxed text-gray-800">
        <p>
          Koh Samui has a smaller train-and-stay market than Phuket, but the camps that list on-site rooms pair island
          beach time with morning pad work. Inventory is limited, so book dates early in peak season.
        </p>
        <p>
          Flights often route through Bangkok or Surat Thani. Pick a camp with housing close to the mat so travel days
          do not eat your first training week. Photos on each card come from verified Samui gym listings.
        </p>
      </div>

      <GuideStayTrainListingBlock
        gyms={listings}
        id="listings"
        title="Koh Samui Muay Thai camps with accommodation"
        subtitle="Verified island listings with on-site housing."
        ctaUrl="/search?country=Thailand&location=Koh%20Samui&discipline=Muay%20Thai&accommodation=true"
        ctaLabel="Browse Koh Samui stay-and-train"
      />

      <GuideCtaStrip
        variant="light"
        title="Full Koh Samui gym rankings"
        subtitle="Island planning, reviews, and long-stay tips."
        href="/blog/best-muay-thai-gyms-koh-samui"
        buttonLabel="Koh Samui city guide"
      />

      <section id="faq" className="mb-14 scroll-mt-24 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">
        <h2 className="mb-6 text-2xl font-bold text-gray-900">FAQ</h2>
        <GuideFaqList items={FAQ_ITEMS} />
      </section>

      <RelatedGuides
        guides={[
          { title: 'Best Muay Thai gyms in Koh Samui', href: '/blog/best-muay-thai-gyms-koh-samui' },
          { title: 'Thailand training camp with accommodation', href: '/blog/thailand-training-camp-with-accommodation' },
          { title: 'Best Muay Thai gyms in Koh Phangan', href: '/blog/best-muay-thai-gyms-koh-phangan' },
        ]}
      />
    </ArticleShell>
  )
}
