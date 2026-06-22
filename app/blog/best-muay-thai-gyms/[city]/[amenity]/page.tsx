import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { ArticleShell } from '@/components/guides/article-shell'
import { RelatedGuides } from '@/components/guides/related-guides'
import { GuideEmptyState } from '@/components/guides/guide-empty-state'
import { slugToLocation } from '@/lib/seo/location-slug'
import {
  buildArticleLd,
  buildBreadcrumbLd,
  buildFaqLd,
  buildGymItemListLd,
} from '@/lib/seo/guide-schema'
import { ChunkedGymGrid } from '@/components/guides/chunked-gym-grid'
import { GuideLogisticsBlocks } from '@/components/guides/guide-logistics-blocks'
import {
  GuideAccentIntro,
  GuideCtaStrip,
  GuideFaqList,
  GuideHero,
  GuideLeadRow,
  GuideSection,
  GuideThreeCards,
} from '@/components/guides/guide-page-blocks'
import {
  buildTier4GuideCopyFromSlug,
  getThailandGymsForAmenityGuide,
  getTier4MatrixCells,
} from '@/lib/guides/tier4-amenity-guides'
import { MapPin, Sparkles } from 'lucide-react'

type Params = { city: string; amenity: string }

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1519455953755-af066f52f1ea?auto=format&fit=crop&w=1400&q=80'

export async function generateStaticParams() {
  const cells = await getTier4MatrixCells()
  return cells.map((c) => ({ city: c.citySlug, amenity: c.amenitySlug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>
}): Promise<Metadata> {
  const { city: citySlug, amenity: amenitySlug } = await params
  const city = slugToLocation(citySlug)
  const result = await getThailandGymsForAmenityGuide({ city, amenitySlug })
  if (!result || result.gyms.length === 0) {
    return {
      title: 'Guide Not Found | CombatStay',
      robots: { index: false, follow: false },
    }
  }

  const { seoTitle, description, path } = buildTier4GuideCopyFromSlug(city, result.amenity)

  return {
    title: `${seoTitle} | CombatStay`,
    description,
    alternates: { canonical: path },
    openGraph: { title: `${seoTitle} | CombatStay`, description, type: 'article' },
    twitter: { card: 'summary_large_image', title: `${seoTitle} | CombatStay`, description },
  }
}

const FAQ_ITEMS = (city: string, amenityName: string) => [
  {
    q: `Which Muay Thai gyms in ${city} offer ${amenityName.toLowerCase()}?`,
    a: `This guide lists verified and trusted CombatStay gyms in ${city} that list ${amenityName.toLowerCase()} on their profile. Rankings follow review score and review volume.`,
  },
  {
    q: `How are these ${city} gyms ranked?`,
    a: `We filter for live listings that match ${city}, list Muay Thai, and include ${amenityName.toLowerCase()}, then rank primarily by review score and review volume.`,
  },
  {
    q: `Should I filter by more than one amenity?`,
    a: `Yes. Use this page to shortlist, then open each gym profile or use search filters to confirm packages, room type, and what's included.`,
  },
  {
    q: `Does this include every Muay Thai gym in ${city}?`,
    a: `No. Only live CombatStay listings with ${amenityName.toLowerCase()} on the profile. If a gym is missing, it may not list this amenity yet.`,
  },
]

const EDITORIAL = (city: string, amenityName: string): Array<{ title: string; body: ReactNode }> => [
  {
    title: `Top ${city} picks`,
    body: <p>Highest review momentum among gyms with {amenityName.toLowerCase()}.</p>,
  },
  {
    title: `Strong alternatives`,
    body: <p>Still verified listings — compare commute, schedule, and total package price.</p>,
  },
  {
    title: `More options`,
    body: <p>Widen your shortlist when dates or budget are flexible.</p>,
  },
]

export default async function BestMuayThaiGymsCityAmenityPage({
  params,
}: {
  params: Promise<Params>
}) {
  const { city: citySlug, amenity: amenitySlug } = await params
  const city = slugToLocation(citySlug)
  const result = await getThailandGymsForAmenityGuide({ city, amenitySlug })

  if (!result || result.gyms.length === 0) {
    notFound()
  }

  const { gyms, amenity } = result
  const { title, description, path } = buildTier4GuideCopyFromSlug(city, amenity)
  const cityGuidePath = `/blog/best-muay-thai-gyms/${citySlug}`
  const searchHref = `/search?country=Thailand&location=${encodeURIComponent(city)}&discipline=Muay%20Thai`

  const itemList = buildGymItemListLd({ name: title, gyms })
  const articleLd = buildArticleLd({
    title,
    description,
    path,
    datePublished: new Date().toISOString().slice(0, 10),
    dateModified: new Date().toISOString().slice(0, 10),
    imagePath: HERO_IMAGE,
  })
  const faqLd = buildFaqLd(FAQ_ITEMS(city, amenity.name))
  const breadcrumbLd = buildBreadcrumbLd([
    { name: 'Home', path: '/' },
    { name: 'Training Guides', path: '/blog' },
    { name: 'Thailand', path: '/search?country=Thailand' },
    { name: `Best Muay Thai Gyms in ${city}`, path: cityGuidePath },
    { name: amenity.name, path },
  ])

  return (
    <ArticleShell
      title={title}
      subtitle={`${city} gyms with ${amenity.name.toLowerCase()} — ranked from live listings. Compare schedules, prices, and book on CombatStay.`}
      breadcrumbs={[
        { label: 'Training Guides', href: '/blog' },
        { label: 'Thailand', href: '/search?country=Thailand' },
        { label: city, href: searchHref },
        { label: amenity.name, href: path },
      ]}
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      <GuideHero
        imageSrc={HERO_IMAGE}
        imageAlt={`${city} Muay Thai gyms with ${amenity.name}`}
        priority
        overlayText={`Verified Muay Thai camps in ${city} with ${amenity.name.toLowerCase()}, ranked by reviews.`}
      />

      <GuideLeadRow
        tocItems={[
          { href: '#why', label: `Why ${amenity.name}` },
          { href: '#plan', label: 'How to choose' },
          { href: '#ranked', label: 'Ranked gyms' },
          { href: '#faq', label: 'FAQ' },
        ]}
        statValue={gyms.length}
        statDescription={`Verified/trusted Muay Thai gyms in ${city} with ${amenity.name.toLowerCase()}.`}
        statIcon={<Sparkles className="h-5 w-5" />}
      />

      <section id="why" className="mb-14 scroll-mt-24">
        <GuideAccentIntro
          icon={Sparkles}
          title={`Why filter for ${amenity.name.toLowerCase()} in ${city}?`}
          subtitle="Shortlist faster"
        />
        <div className="prose prose-gray max-w-none space-y-4 text-base leading-relaxed text-gray-800 md:prose-lg">
          <p>
            If you are comparing <strong>Muay Thai gyms in {city}</strong> and already know you need{' '}
            <strong>{amenity.name.toLowerCase()}</strong>, this page saves time: every listing below is a live
            CombatStay profile that lists this amenity.
          </p>
          <p>
            Rankings follow the same review-first methodology as our{' '}
            <Link href={cityGuidePath} className="font-medium text-[#003580] underline">
              {city} Muay Thai city guide
            </Link>
            . Open any gym for packages, photos, and instant booking where available.
          </p>
        </div>
      </section>

      <GuideSection id="plan" variant="slate" className="mb-14">
        <div className="flex items-start gap-4">
          <div className="rounded-lg bg-[#003580] p-3 text-white">
            <MapPin className="h-6 w-6" aria-hidden />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 md:text-3xl">
              How to choose the right {city} gym
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-700">
              {amenity.name} narrows the list — still compare commute, class times, and what is included in each
              package.
            </p>
          </div>
        </div>

        <div className="mt-8">
          <GuideThreeCards
            items={[
              { title: 'Confirm details', body: `Verify on the gym profile exactly what “${amenity.name.toLowerCase()}” includes.` },
              { title: 'Commute first', body: 'Two-a-days fail when the commute is a grind. Pick location like an athlete.' },
              { title: 'Compare packages', body: 'Total trip cost beats headline daily rate — check meals, housing, and fees.' },
            ]}
          />
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <figure className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="relative aspect-[4/3] w-full">
              <Image
                src="https://images.unsplash.com/photo-1517832207067-4db24a2ae47c?auto=format&fit=crop&w=1400&q=80"
                alt="Muay Thai training gym"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 520px"
              />
            </div>
            <figcaption className="px-4 py-3 text-xs text-gray-600">
              Shortlist by amenity, then confirm inclusions on each gym page.
            </figcaption>
          </figure>
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">Shortcut: filter live listings</h3>
            <p className="mt-2 text-sm text-gray-700">
              After you shortlist, use search to layer price, dates, and more amenities.
            </p>
            <div className="mt-4 space-y-2">
              <Link
                href={searchHref}
                className="inline-flex items-center rounded-lg bg-[#003580] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#003580]/90"
              >
                Browse {city} Muay Thai gyms
              </Link>
              <div>
                <Link href={cityGuidePath} className="text-sm font-semibold text-[#003580] underline">
                  Back to full {city} guide
                </Link>
              </div>
            </div>
          </div>
        </div>
      </GuideSection>

      <GuideSection id="logistics" variant="default" className="mb-14 border border-gray-200 bg-white">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#003580]">Information gain</p>
        <h2 className="mt-2 text-2xl font-bold text-gray-900 md:text-3xl">Recovery &amp; legality checklist</h2>
        <p className="mt-3 max-w-3xl text-base leading-relaxed text-gray-700">
          Amenity filters help you shortlist faster. These blocks cover the logistics that determine whether you can
          train consistently in {city}.
        </p>
        <GuideLogisticsBlocks cityLabel={city} />
      </GuideSection>

      <GuideCtaStrip
        title={`Browse all ${city} Muay Thai listings`}
        subtitle="Layer price, dates, and more amenities after you shortlist."
        href={searchHref}
        buttonLabel={`Open ${city} search`}
      />

      <section id="ranked" className="mb-16 scroll-mt-24">
        <h2 className="mb-2 text-2xl font-bold text-gray-900 md:text-3xl">
          Ranked Muay Thai gyms in {city} with {amenity.name.toLowerCase()}
        </h2>
        <p className="mb-8 max-w-3xl text-gray-600">
          Structured data matches the order below. Only gyms listing {amenity.name.toLowerCase()} are included.
        </p>
        {gyms.length === 0 ? (
          <GuideEmptyState
            title={`No gyms matched ${city} with ${amenity.name.toLowerCase()} yet`}
            description="Try the full city guide or widen your search."
            searchHref={searchHref}
            searchLabel={`Search ${city}`}
          />
        ) : (
          <ChunkedGymGrid
            gyms={gyms}
            chunkSize={5}
            fallbackImageSrc="/Khun_3_c4e13bdce8_c0b7f8b5b5.avif"
            editorialBetweenChunks={EDITORIAL(city, amenity.name).slice(0, Math.ceil(gyms.length / 5))}
            rankEyebrow="local"
            localityName={city}
          />
        )}
      </section>

      <GuideSection id="faq" variant="default" className="mb-14 border border-gray-200 bg-white p-6 md:p-8">
        <h2 className="mb-2 text-2xl font-bold text-gray-900 md:text-3xl">FAQ</h2>
        <p className="mb-8 text-gray-600">
          Common questions about Muay Thai in {city} with {amenity.name.toLowerCase()}.
        </p>
        <GuideFaqList items={FAQ_ITEMS(city, amenity.name)} />
      </GuideSection>

      <GuideCtaStrip
        title={`Ready to book your ${city} camp?`}
        subtitle="Compare verified listings by dates, price, and amenities on CombatStay."
        href={searchHref}
        buttonLabel={`Find your ${city} camp`}
      />

      <RelatedGuides
        guides={[
          { title: `Best Muay Thai gyms in ${city}`, href: cityGuidePath },
          { title: 'Best Muay Thai camps in Thailand (2026)', href: '/blog/best-muay-thai-camps-thailand-2026' },
          { title: 'Training guides hub', href: '/blog' },
          ...(amenity.slug === 'private-ac-room' && city.toLowerCase() === 'krabi'
            ? [
                {
                  title: 'Krabi camps with accommodation + AC (comparison table)',
                  href: '/blog/muay-thai-krabi-private-ac-rooms',
                },
              ]
            : []),
        ]}
      />
    </ArticleShell>
  )
}
