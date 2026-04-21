import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArticleShell } from '@/components/guides/article-shell'
import { RelatedGuides } from '@/components/guides/related-guides'
import { GuideEmptyState } from '@/components/guides/guide-empty-state'
import { getThailandGymsForGuide } from '@/lib/guides/thailand-gyms'
import {
  buildArticleLd,
  buildBreadcrumbLd,
  buildFaqLd,
  buildGymItemListLd,
} from '@/lib/seo/guide-schema'
import { ChunkedGymGrid } from '@/components/guides/chunked-gym-grid'
import {
  GuideAccentIntro,
  GuideCtaStrip,
  GuideFaqList,
  GuideHero,
  GuideLeadRow,
  GuideSection,
  GuideThreeCards,
} from '@/components/guides/guide-page-blocks'
import { MapPin, Sun, Waves } from 'lucide-react'

const CITY = 'Pattaya'
const TITLE = `Best Muay Thai Gyms in ${CITY} (2026)`
const SEO_TITLE = `Best Muay Thai Gyms in ${CITY} 2026 [Prices + Reviews]`
const PATH = '/blog/best-muay-thai-gyms-pattaya'
const DATE_PUBLISHED = '2025-10-15'
const DATE_MODIFIED = '2026-04-20'
const HERO_IMAGE = 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?auto=format&fit=crop&w=1400&q=80'
const DESCRIPTION =
  'Ranked Muay Thai camps in Pattaya, Thailand: verified listings, prices, photos, reviews, and long-stay planning tips for training near the beach.'

export const metadata: Metadata = {
  title: `${SEO_TITLE} | Combatbooking`,
  description: DESCRIPTION,
  alternates: { canonical: PATH },
  openGraph: { title: `${SEO_TITLE} | Combatbooking`, description: DESCRIPTION, type: 'article' },
  twitter: { card: 'summary_large_image', title: `${SEO_TITLE} | Combatbooking`, description: DESCRIPTION },
}

const FAQ_ITEMS = [
  {
    q: `Is Pattaya good for Muay Thai training?`,
    a: `Yes—if you plan your routine. Pattaya can be convenient for beach lifestyle and access to Bangkok, but distractions exist. Choose accommodation for sleep and a gym you can reach consistently.`,
  },
  {
    q: `How are these Pattaya gyms ranked?`,
    a: `We filter for verified/trusted CombatBooking listings that match the Pattaya city filter and list Muay Thai, then rank primarily by review score and review volume.`,
  },
  {
    q: `How long should I stay in Pattaya to improve?`,
    a: `Most people see meaningful progress with 2–4 weeks of consistent training and recovery. One week is great for experience; longer stays are where repetition compounds.`,
  },
  {
    q: `What is the best area to stay in Pattaya for training?`,
    a: `Pick the area that makes your commute repeatable. If you plan two sessions/day, avoid a long travel time—sleep and recovery matter more than nightlife proximity.`,
  },
  {
    q: `How much does Muay Thai cost in Pattaya?`,
    a: `Prices vary by gym and package type (training-only vs bundles). Use the ranked list to shortlist, then confirm current pricing and what’s included on each gym profile.`,
  },
  {
    q: `Can I do two-a-days in Pattaya without burning out?`,
    a: `Yes, but ramp up. Start with one session/day for a few days, then add a second session once sleep and soreness stabilize. Keep at least one recovery day each week and don’t stack late nights with early sessions.`,
  },
]

const EDITORIAL: Array<{ title: string; body: ReactNode }> = [
  { title: `Top Pattaya picks`, body: <p>Highest review momentum inside the Pattaya filter. Compare schedules and class structure, not just rank.</p> },
  { title: `Strong alternatives`, body: <p>Still verified/trusted listings—differences are often review history and availability.</p> },
  { title: `Mid-list options`, body: <p>Useful when you prioritize dates, budget, or a specific location fit.</p> },
  { title: `More gyms`, body: <p>Widen your shortlist beyond the handful of names that show up on old blogs.</p> },
  { title: `Final ranked slots`, body: <p>Completes a deeper ranked set so you can compare more than three camps.</p> },
]

export default async function BestMuayThaiGymsPattayaPage() {
  const gyms = await getThailandGymsForGuide({ discipline: 'Muay Thai', city: CITY })

  const itemList = buildGymItemListLd({ name: TITLE, gyms })
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
    { name: `Best Muay Thai Gyms in ${CITY}`, path: PATH },
  ])

  return (
    <ArticleShell
      title={TITLE}
      subtitle={`Pattaya training is about routines: pick a gym you can reach consistently, then recover like an athlete so you actually improve.`}
      breadcrumbs={[
        { label: 'Training Guides', href: '/blog' },
        { label: 'Thailand', href: '/search?country=Thailand' },
        { label: CITY, href: `/search?country=Thailand&location=${encodeURIComponent(CITY)}&discipline=Muay%20Thai` },
      ]}
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      <GuideHero
        imageSrc={HERO_IMAGE}
        imageAlt={`Pattaya Thailand coastline`}
        priority
        overlayText="Pattaya Muay Thai camps ranked from verified listings—compare schedules, prices, and reviews, then book the right fit."
      />

      <GuideLeadRow
        tocItems={[
          { href: '#why', label: `Why ${CITY}` },
          { href: '#plan', label: 'Plan your stay' },
          { href: '#where-to-stay', label: 'Where to stay' },
          { href: '#ranked', label: 'Ranked gyms' },
          { href: '#faq', label: 'FAQ' },
        ]}
        statValue={gyms.length}
        statDescription={`Verified/trusted Muay Thai camps matching ${CITY} on CombatBooking.`}
        statIcon={<Waves className="h-5 w-5" />}
      />

      <section id="why" className="mb-14 scroll-mt-24">
        <GuideAccentIntro icon={MapPin} title={`Why train Muay Thai in ${CITY}?`} subtitle="Beach lifestyle + consistency" />
        <div className="prose prose-gray max-w-none space-y-4 text-base leading-relaxed text-gray-800 md:prose-lg">
          <p>
            People searching <strong>best Muay Thai gyms in Pattaya</strong> are usually balancing training with lifestyle.
            Pattaya can work well for longer stays if you prioritize a repeatable commute, good sleep, and recovery habits.
          </p>
          <p>
            This page filters for verified/trusted listings that match Pattaya on CombatBooking and list Muay Thai—so you’re
            not comparing random gyms with no booking-ready information.
          </p>
        </div>
      </section>

      <GuideSection id="plan" variant="slate" className="mb-14">
        <h2 className="mb-6 text-2xl font-bold text-gray-900 md:text-3xl">Plan a Pattaya training stay that actually works</h2>
        <GuideThreeCards
          items={[
            {
              title: 'Commute first',
              body: 'For two-a-days, commute time becomes part of your training load. Choose accommodation near your camp or on a route you can repeat.',
            },
            {
              title: 'Recovery rules',
              body: 'Heat + pads add up. Build rest days, hydrate, and avoid stacking late nights with early sessions.',
            },
            {
              title: 'Choose your intensity',
              body: 'If you’re a beginner, start with one session/day and scale up only when soreness and sleep stabilize.',
            },
          ]}
        />
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">Common mistakes</h3>
            <ul className="mt-3 space-y-2 text-sm text-gray-700">
              <li>
                <strong>Overbooking:</strong> two-a-days + nightlife + tours leads to injury or burnout.
              </li>
              <li>
                <strong>Ignoring heat:</strong> dehydration crushes performance and recovery.
              </li>
              <li>
                <strong>Choosing by hype:</strong> the best camp is the one you attend consistently.
              </li>
            </ul>
          </div>
          <figure className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="relative aspect-[4/3] w-full">
              <Image
                src="https://images.unsplash.com/photo-1549693578-d683be217e58?auto=format&fit=crop&w=1400&q=80"
                alt="Thailand city and coastline"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 520px"
              />
            </div>
            <figcaption className="px-4 py-3 text-xs text-gray-600">
              A long stay is won on routines: sleep, food, and showing up—more than the perfect gym name.
            </figcaption>
          </figure>
        </div>
      </GuideSection>

      <GuideSection id="where-to-stay" variant="default" className="mb-14 border border-gray-200 bg-white">
        <div className="grid gap-8 md:grid-cols-2 md:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#003580]">Where to stay</p>
            <h2 className="mt-2 text-2xl font-bold text-gray-900 md:text-3xl">Pick an area that protects sleep + commute</h2>
            <div className="mt-3 space-y-3 text-base leading-relaxed text-gray-700">
              <p>
                For “best Muay Thai gyms in Pattaya” searches, most people underestimate the boring variables that decide results:
                <strong> sleep</strong>, <strong>transport time</strong>, and <strong>how easy it is to repeat the week</strong>.
                If you want two-a-days, you’re effectively commuting to the gym twice every day—so distance matters.
              </p>
              <p>
                The right answer depends on your goal. If you’re chasing a serious 2–6 week block, choose the area that makes you
                most likely to show up consistently.
              </p>
            </div>

            <div className="mt-6 grid gap-4">
              <div className="rounded-xl border border-gray-200 bg-slate-50 p-5">
                <p className="text-sm font-semibold text-gray-900">If you want maximum training consistency</p>
                <p className="mt-1 text-sm text-gray-700">
                  Stay <strong>close to your chosen gym</strong> (or on the simplest route). Minimizing daily friction is the biggest
                  long-stay performance hack.
                </p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-slate-50 p-5">
                <p className="text-sm font-semibold text-gray-900">If you want lifestyle + training</p>
                <p className="mt-1 text-sm text-gray-700">
                  Choose a base that still lets you <strong>sleep well</strong>. Late nights + early sessions is the fastest way to turn a
                  month plan into a one-week injury.
                </p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-slate-50 p-5">
                <p className="text-sm font-semibold text-gray-900">If you’re a beginner</p>
                <p className="mt-1 text-sm text-gray-700">
                  Pick a calmer area and plan <strong>one session/day</strong> at first. Your goal is to build the habit, then scale volume.
                </p>
              </div>
            </div>
          </div>

          <figure className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="relative aspect-[4/3] w-full">
              <Image
                src="https://images.unsplash.com/photo-1508009603885-50cf7c579365?auto=format&fit=crop&w=1400&q=80"
                alt="Pattaya coastline and city view"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 520px"
              />
            </div>
            <figcaption className="px-4 py-3 text-xs text-gray-600">
              Two-a-days in Pattaya are won by commute + sleep, not motivation.
            </figcaption>
          </figure>
        </div>
      </GuideSection>

      <GuideSection variant="default" className="mb-14 border border-gray-200 bg-white">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#003580]">Further reading</p>
        <h2 className="mt-2 text-2xl font-bold text-gray-900 md:text-3xl">Official links for planning</h2>
        <p className="mt-3 max-w-3xl text-base leading-relaxed text-gray-700">
          Use official sources to verify seasonality and travel updates right before you book.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <a
            href="https://www.tmd.go.th/en/"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
          >
            <p className="text-sm font-semibold text-gray-900">Thai Meteorological Department (TMD)</p>
            <p className="mt-1 text-xs text-gray-600">Weather/seasonality checks before a long stay.</p>
            <p className="mt-3 text-xs font-semibold text-[#003580]">Open →</p>
          </a>
          <a
            href="https://www.tourismthailand.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
          >
            <p className="text-sm font-semibold text-gray-900">Tourism Authority of Thailand (TAT)</p>
            <p className="mt-1 text-xs text-gray-600">Travel updates and destination info.</p>
            <p className="mt-3 text-xs font-semibold text-[#003580]">Open →</p>
          </a>
        </div>
      </GuideSection>

      <GuideCtaStrip
        title={`Browse all ${CITY} Muay Thai listings`}
        subtitle="Filter price, amenities, and dates after you shortlist."
        href={`/search?country=Thailand&location=${encodeURIComponent(CITY)}&discipline=Muay%20Thai`}
        buttonLabel={`Open ${CITY} search`}
      />

      <section id="ranked" className="mb-16 scroll-mt-24">
        <h2 className="mb-2 text-2xl font-bold text-gray-900 md:text-3xl">Ranked Muay Thai gyms in {CITY}</h2>
        <p className="mb-8 max-w-3xl text-gray-600">
          Structured data matches the order below. Editorial breaks keep the page readable.
        </p>
        {gyms.length === 0 ? (
          <GuideEmptyState
            title={`No gyms matched “${CITY}” with Muay Thai yet`}
            description="Try the national hub or widen search. Owners should set city and disciplines correctly to appear here."
            searchHref={`/search?country=Thailand&location=${encodeURIComponent(CITY)}&discipline=Muay%20Thai`}
            searchLabel={`Search ${CITY}`}
          />
        ) : (
          <ChunkedGymGrid
            gyms={gyms}
            chunkSize={5}
            fallbackImageSrc="/Khun_3_c4e13bdce8_c0b7f8b5b5.avif"
            editorialBetweenChunks={EDITORIAL.slice(0, Math.ceil(gyms.length / 5))}
            rankEyebrow="local"
            localityName={CITY}
          />
        )}
      </section>

      <GuideSection id="faq" variant="default" className="mb-14 border border-gray-200 bg-white p-6 md:p-8">
        <h2 className="mb-2 text-2xl font-bold text-gray-900 md:text-3xl">FAQ</h2>
        <p className="mb-8 text-gray-600">Pattaya training questions that show up in search.</p>
        <GuideFaqList items={FAQ_ITEMS} />
      </GuideSection>
      <GuideCtaStrip
        title="Ready to pick your Pattaya Muay Thai camp?"
        subtitle="Filter every verified Pattaya gym by price, dates, and amenities — book directly on Combatbooking."
        href="/search?country=Thailand&location=Pattaya&discipline=Muay%20Thai"
        buttonLabel="Find your Pattaya camp"
      />



      <RelatedGuides
        guides={[
          { title: '25 best Muay Thai camps in Thailand (2026)', href: '/blog/best-muay-thai-camps-thailand-2026' },
          { title: 'Best Muay Thai gyms in Bangkok', href: '/blog/best-muay-thai-gyms-bangkok' },
          { title: 'Best Muay Thai gyms in Phuket', href: '/blog/best-muay-thai-gyms-phuket' },
          { title: 'Thailand training visa / DTV', href: '/blog/thailand-training-visa-dtv' },
        ]}
      />
    </ArticleShell>
  )
}

