import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArticleShell } from '@/components/guides/article-shell'
import { RelatedGuides } from '@/components/guides/related-guides'
import { GuideEmptyState } from '@/components/guides/guide-empty-state'
import { getThailandGymsForGuide } from '@/lib/guides/thailand-gyms'
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
import { Anchor, MapPin, Sun } from 'lucide-react'

type Params = { city: string }

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1519455953755-af066f52f1ea?auto=format&fit=crop&w=1400&q=80'

function buildCopy(city: string) {
  const TITLE = `Best Muay Thai Gyms in ${city} (2026)`
  const SEO_TITLE = `Best Muay Thai Gyms in ${city} 2026 [Prices + Reviews]`
  const PATH = `/blog/best-muay-thai-gyms/${encodeURIComponent(city.toLowerCase().replace(/\s+/g, '-'))}`
  const DESCRIPTION = `Ranked Muay Thai gyms in ${city}, Thailand: verified listings, prices, photos, and reviews. Compare camps and book the best fit on CombatStay.`
  return { TITLE, SEO_TITLE, PATH, DESCRIPTION }
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { city: citySlug } = await params
  const city = slugToLocation(citySlug)
  const { SEO_TITLE, DESCRIPTION } = buildCopy(city)

  return {
    title: `${SEO_TITLE} | CombatStay`,
    description: DESCRIPTION,
    alternates: { canonical: `/blog/best-muay-thai-gyms/${citySlug}` },
    openGraph: { title: `${SEO_TITLE} | CombatStay`, description: DESCRIPTION, type: 'article' },
    twitter: { card: 'summary_large_image', title: `${SEO_TITLE} | CombatStay`, description: DESCRIPTION },
  }
}

const FAQ_ITEMS = (city: string) => [
  {
    q: `Is ${city} good for Muay Thai training?`,
    a: `It can be—if you choose a gym you can attend consistently. For most travelers the biggest “performance lever” is routine: commute, sleep, and recovery.`,
  },
  {
    q: `Do I need an ED visa to train Muay Thai in ${city}?`,
    a: `It depends on your length of stay and current Thai visa rules. Use official sources and plan early. Some gyms can provide “visa / stay guidance” but confirm exactly what that means before you book.`,
  },
  {
    q: `How are these gyms ranked?`,
    a: `We filter for verified/trusted CombatStay listings that match the ${city} city/suburb filter and list Muay Thai, then rank primarily by review score and review volume.`,
  },
  {
    q: `Does this include every Muay Thai gym in ${city}?`,
    a: `No. This guide only includes live CombatStay listings (verified/trusted) that match ${city} and list Muay Thai. If a gym is missing, it may not have a live listing yet.`,
  },
  {
    q: `How much does Muay Thai training cost in ${city}?`,
    a: `Prices vary by gym and packages. Use the ranked list to shortlist, then confirm the latest inclusions and fees on each gym page.`,
  },
]

const EDITORIAL = (city: string): Array<{ title: string; body: ReactNode }> => [
  { title: `Top ${city} picks`, body: <p>Highest review momentum inside the {city} filter. Compare schedule fit first.</p> },
  { title: `Strong alternatives`, body: <p>Still verified listings—differences are often commute, vibe, and availability.</p> },
  { title: `Mid-list options`, body: <p>Useful when you prioritize dates, budget, or a specific training style.</p> },
  { title: `More gyms`, body: <p>Widen your shortlist beyond thin affiliate roundups.</p> },
  { title: `Final ranked slots`, body: <p>Completes a deeper list so you can compare more options.</p> },
]

export default async function BestMuayThaiGymsCityPage({ params }: { params: Promise<Params> }) {
  const { city: citySlug } = await params
  const city = slugToLocation(citySlug)
  const { TITLE, DESCRIPTION } = buildCopy(city)
  const PATH = `/blog/best-muay-thai-gyms/${citySlug}`

  const gyms = await getThailandGymsForGuide({ discipline: 'Muay Thai', city })

  const itemList = buildGymItemListLd({ name: TITLE, gyms })
  const articleLd = buildArticleLd({
    title: TITLE,
    description: DESCRIPTION,
    path: PATH,
    datePublished: new Date().toISOString().slice(0, 10),
    dateModified: new Date().toISOString().slice(0, 10),
    imagePath: HERO_IMAGE,
  })
  const faqLd = buildFaqLd(FAQ_ITEMS(city))
  const breadcrumbLd = buildBreadcrumbLd([
    { name: 'Home', path: '/' },
    { name: 'Training Guides', path: '/blog' },
    { name: 'Thailand', path: '/search?country=Thailand' },
    { name: `Best Muay Thai Gyms in ${city}`, path: PATH },
  ])

  return (
    <ArticleShell
      title={TITLE}
      subtitle={`${city} guide built from live listings. Shortlist by reviews, then filter by dates, price, and amenities.`}
      breadcrumbs={[
        { label: 'Training Guides', href: '/blog' },
        { label: 'Thailand', href: '/search?country=Thailand' },
        { label: city, href: `/search?country=Thailand&location=${encodeURIComponent(city)}&discipline=Muay%20Thai` },
      ]}
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      <GuideHero
        imageSrc={HERO_IMAGE}
        imageAlt={`${city} Thailand Muay Thai training`}
        priority
        overlayText={`${city} Muay Thai gyms ranked from verified listings—compare schedules, prices, and reviews, then book the right fit.`}
      />

      <GuideLeadRow
        tocItems={[
          { href: '#why', label: `Why ${city}` },
          { href: '#plan', label: 'Plan your stay' },
          { href: '#logistics', label: 'Recovery & legality' },
          { href: '#ranked', label: 'Ranked gyms' },
          { href: '#faq', label: 'FAQ' },
        ]}
        statValue={gyms.length}
        statDescription={`Verified/trusted Muay Thai gyms matching “${city}” on CombatStay.`}
        statIcon={<Sun className="h-5 w-5" />}
      />

      <section id="why" className="mb-14 scroll-mt-24">
        <GuideAccentIntro icon={Anchor} title={`Why train Muay Thai in ${city}?`} subtitle="Consistency beats hype" />
        <div className="prose prose-gray max-w-none space-y-4 text-base leading-relaxed text-gray-800 md:prose-lg">
          <p>
            People searching <strong>best Muay Thai gyms in {city}</strong> usually care about routine: commute, recovery, and
            whether the gym’s schedule matches their energy and experience level.
          </p>
          <p>
            This page only includes verified/trusted listings that match our <em>{city}</em> city/suburb filter and list Muay
            Thai. Rankings follow the same review-first methodology as the rest of CombatStay’s guides.
          </p>
          {city.toLowerCase() === 'chalong' && (
            <p>
              For Soi Ta Iad’s newest full-scale option, read our{' '}
              <Link href="/blog/ludus-sports-complex-chalong-phuket" className="font-medium text-[#003580] underline">
                LUDUS Sports Complex guide
              </Link>{' '}
              (prices, coaches, spa/hotel amenities, and Tiger vs Unit 27 comparison).
            </p>
          )}
        </div>
      </section>

      <GuideSection id="plan" variant="slate" className="mb-14">
        <div className="flex items-start gap-4">
          <div className="rounded-lg bg-[#003580] p-3 text-white">
            <MapPin className="h-6 w-6" aria-hidden />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 md:text-3xl">How to choose the right gym in {city}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-700">
              Use the ranked list to shortlist, then confirm commute and class times. For most travelers, the “best” gym is
              the one you’ll attend 5–6 days/week.
            </p>
          </div>
        </div>

        <div className="mt-8">
          <GuideThreeCards
            items={[
              { title: 'Commute first', body: 'Two-a-days fail when the commute is a grind. Choose location like an athlete.' },
              { title: 'Ramp volume', body: 'Start with one session/day. Add volume only when sleep and soreness stabilize.' },
              { title: 'Compare structure', body: 'Ask about class flow, pad rounds, clinch time, and sparring policy.' },
            ]}
          />
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <figure className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="relative aspect-[4/3] w-full">
              <Image
                src="https://images.unsplash.com/photo-1517832207067-4db24a2ae47c?auto=format&fit=crop&w=1400&q=80"
                alt="Training gloves and gym scene"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 520px"
              />
            </div>
            <figcaption className="px-4 py-3 text-xs text-gray-600">
              Pick a gym you can attend consistently — results follow attendance.
            </figcaption>
          </figure>
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">Shortcut: filter live listings</h3>
            <p className="mt-2 text-sm text-gray-700">
              After you shortlist, use search filters (amenities, price, dates) to find the best match.
            </p>
            <div className="mt-4 space-y-2">
              <Link
                href={`/search?country=Thailand&location=${encodeURIComponent(city)}&discipline=Muay%20Thai`}
                className="inline-flex items-center rounded-lg bg-[#003580] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#003580]/90"
              >
                Browse {city} Muay Thai gyms
              </Link>
              <div>
                <Link href="/blog" className="text-sm font-semibold text-[#003580] underline">
                  Back to training guides hub
                </Link>
              </div>
            </div>
          </div>
        </div>
      </GuideSection>

      <GuideSection id="logistics" variant="default" className="mb-14 border border-gray-200 bg-white">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#003580]">Information gain</p>
        <h2 className="mt-2 text-2xl font-bold text-gray-900 md:text-3xl">Recovery &amp; legality blocks (what travelers miss)</h2>
        <p className="mt-3 max-w-3xl text-base leading-relaxed text-gray-700">
          Most “best gym” lists ignore the logistics that determine results: recovery facilities and long-stay legality. Use these
          blocks as a checklist when comparing gyms in {city}.
        </p>
        <GuideLogisticsBlocks cityLabel={city} />
      </GuideSection>

      <GuideCtaStrip
        title={`Browse all ${city} Muay Thai listings`}
        subtitle="Filter price, amenities, and dates after you shortlist."
        href={`/search?country=Thailand&location=${encodeURIComponent(city)}&discipline=Muay%20Thai`}
        buttonLabel={`Open ${city} search`}
      />

      <section id="ranked" className="mb-16 scroll-mt-24">
        <h2 className="mb-2 text-2xl font-bold text-gray-900 md:text-3xl">Ranked Muay Thai gyms in {city}</h2>
        <p className="mb-8 max-w-3xl text-gray-600">
          Structured data matches the order below. Editorial breaks keep the page readable.
        </p>
        {gyms.length === 0 ? (
          <GuideEmptyState
            title={`No gyms matched “${city}” with Muay Thai yet`}
            description="Try a nearby city, or widen your search. Gym owners: make sure city/suburb and disciplines are set correctly."
            searchHref={`/search?country=Thailand&location=${encodeURIComponent(city)}&discipline=Muay%20Thai`}
            searchLabel={`Search ${city}`}
          />
        ) : (
          <ChunkedGymGrid
            gyms={gyms}
            chunkSize={5}
            fallbackImageSrc="/Khun_3_c4e13bdce8_c0b7f8b5b5.avif"
            editorialBetweenChunks={EDITORIAL(city).slice(0, Math.ceil(gyms.length / 5))}
            rankEyebrow="local"
            localityName={city}
          />
        )}
      </section>

      <GuideSection id="faq" variant="default" className="mb-14 border border-gray-200 bg-white p-6 md:p-8">
        <h2 className="mb-2 text-2xl font-bold text-gray-900 md:text-3xl">FAQ</h2>
        <p className="mb-8 text-gray-600">{city} Muay Thai training questions that show up in search.</p>
        <GuideFaqList items={FAQ_ITEMS(city)} />
      </GuideSection>

      <GuideCtaStrip
        title={`Ready to pick your ${city} Muay Thai gym?`}
        subtitle="Filter verified listings by dates, price, and amenities — book directly on CombatStay."
        href={`/search?country=Thailand&location=${encodeURIComponent(city)}&discipline=Muay%20Thai`}
        buttonLabel={`Find your ${city} camp`}
      />

      <RelatedGuides
        guides={[
          { title: 'Best Muay Thai camps in Thailand (2026)', href: '/blog/best-muay-thai-camps-thailand-2026' },
          { title: 'Best Muay Thai gyms in Phuket', href: '/blog/best-muay-thai-gyms-phuket' },
          { title: 'Best Muay Thai gyms in Bangkok', href: '/blog/best-muay-thai-gyms-bangkok' },
          { title: 'Training guides hub', href: '/blog' },
        ]}
      />
    </ArticleShell>
  )
}

