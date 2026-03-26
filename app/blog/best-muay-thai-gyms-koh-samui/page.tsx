import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArticleShell } from '@/components/guides/article-shell'
import { RelatedGuides } from '@/components/guides/related-guides'
import { GuideEmptyState } from '@/components/guides/guide-empty-state'
import { getThailandGymsForGuide } from '@/lib/guides/thailand-gyms'
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
import { Anchor, MapPin, Sun } from 'lucide-react'

const CITY = 'Koh Samui'
const TITLE = `Best Muay Thai Gyms in ${CITY} (2026)`
const DESCRIPTION =
  'Ranked Muay Thai camps in Koh Samui, Thailand: verified listings, prices, photos, reviews, and long-stay planning tips for island training routines.'

export const metadata: Metadata = {
  title: `${TITLE} | Prices, Photos & Tips | CombatBooking.com`,
  description: DESCRIPTION,
  alternates: { canonical: '/blog/best-muay-thai-gyms-koh-samui' },
  openGraph: { title: `${TITLE} - CombatBooking.com`, description: DESCRIPTION, type: 'article' },
  twitter: { card: 'summary_large_image', title: `${TITLE} - CombatBooking.com`, description: DESCRIPTION },
}

function absoluteUrl(path: string) {
  return `https://combatbooking.com${path}`
}

const FAQ_ITEMS = [
  {
    q: `Is Koh Samui good for Muay Thai training?`,
    a: `Yes—if you want island lifestyle with training. The key is logistics: choose accommodation for sleep and a commute you can repeat for weeks.`,
  },
  {
    q: `How are Koh Samui gyms ranked?`,
    a: `We filter for verified/trusted CombatBooking listings that match the Koh Samui city filter and list Muay Thai, then rank primarily by review score and review volume.`,
  },
  {
    q: `How do I avoid turning an island trip into a vacation-only week?`,
    a: `Decide your training goal up front (1 session/day vs 2). Build recovery days and protect sleep. The best gym is the one you consistently attend.`,
  },
  {
    q: `When is the best time of year to train in Koh Samui?`,
    a: `It depends on weather and crowds. Check official weather patterns before booking a long stay—humidity and rainfall change recovery and training load.`,
  },
  {
    q: `Is Koh Samui beginner-friendly for Muay Thai?`,
    a: `Often yes, but it depends on the gym. Use profiles to confirm fundamentals classes, coach ratios, and sparring rules so you can ramp up safely.`,
  },
  {
    q: `How much does Muay Thai cost in Koh Samui?`,
    a: `Costs vary by gym and package type. Shortlist from the rankings, then confirm current pricing and what is included on each gym page.`,
  },
  {
    q: `Can I do two-a-days on Koh Samui?`,
    a: `Many people can, but only if recovery is strong. Start with one daily session, then add a second when sleep and soreness stabilize. Treat island heat as part of the load.`,
  },
  {
    q: `Does this list include every Muay Thai gym on Koh Samui?`,
    a: `No. It includes verified/trusted CombatBooking listings that match the Koh Samui city filter and list Muay Thai. A gym can be missing if it is not live on the marketplace yet.`,
  },
]

const EDITORIAL: Array<{ title: string; body: ReactNode }> = [
  { title: `Top ${CITY} picks`, body: <p>Highest review momentum inside the Koh Samui filter. Compare schedules and class structure.</p> },
  { title: `Strong alternatives`, body: <p>Still verified/trusted listings—differences are often review recency and availability.</p> },
  { title: `Mid-list options`, body: <p>Useful when you prioritize dates, budget, or a specific area.</p> },
  { title: `More gyms`, body: <p>Expand beyond whatever one blog post repeats.</p> },
  { title: `Final ranked slots`, body: <p>Completes a deeper ranked list so you can compare more options.</p> },
]

export default async function BestMuayThaiGymsKohSamuiPage() {
  const gyms = await getThailandGymsForGuide({ discipline: 'Muay Thai', city: CITY })

  const itemList = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: TITLE,
    numberOfItems: gyms.length,
    itemListOrder: 'https://schema.org/ItemListOrderAscending',
    itemListElement: gyms.map((gym, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: gym.name,
      url: absoluteUrl(`/gyms/${gym.id}`),
    })),
  }

  const articleLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: TITLE,
    description: DESCRIPTION,
    mainEntityOfPage: absoluteUrl('/blog/best-muay-thai-gyms-koh-samui'),
    author: { '@type': 'Organization', name: 'CombatBooking.com' },
    publisher: { '@type': 'Organization', name: 'CombatBooking.com' },
  }

  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ_ITEMS.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  }

  return (
    <ArticleShell
      title={TITLE}
      subtitle="Koh Samui can support long-stay training if you plan routines first and fun second. Use this guide to shortlist verified camps and pick a sustainable schedule."
      breadcrumbs={[
        { label: 'Training Guides', href: '/blog' },
        { label: 'Thailand', href: '/search?country=Thailand' },
        { label: CITY, href: `/search?country=Thailand&location=${encodeURIComponent(CITY)}&discipline=Muay%20Thai` },
      ]}
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />

      <GuideHero
        imageSrc="https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1400&q=80"
        imageAlt="Koh Samui Thailand beach and palm trees"
        priority
        overlayText="Koh Samui Muay Thai camps ranked from verified listings—compare schedules, prices, and reviews, then book the right fit."
      />

      <GuideLeadRow
        tocItems={[
          { href: '#why', label: `Why ${CITY}` },
          { href: '#plan', label: 'Plan your stay' },
          { href: '#week-template', label: 'Week template' },
          { href: '#budget', label: 'Budget & packing' },
          { href: '#ranked', label: 'Ranked gyms' },
          { href: '#faq', label: 'FAQ' },
        ]}
        statValue={gyms.length}
        statDescription={`Verified/trusted Muay Thai camps matching ${CITY} on CombatBooking.`}
        statIcon={<Sun className="h-5 w-5" />}
      />

      <section id="why" className="mb-14 scroll-mt-24">
        <GuideAccentIntro icon={Anchor} title={`Why train Muay Thai in ${CITY}?`} subtitle="Island life + repeatable weeks" />
        <div className="prose prose-gray max-w-none space-y-4 text-base leading-relaxed text-gray-800 md:prose-lg">
          <p>
            People searching <strong>best Muay Thai gyms in {CITY}</strong> usually want the island lifestyle without losing
            training progress. That is possible—but only if you plan for commute, sleep, and heat recovery.
          </p>
          <p>
            This page ranks verified/trusted listings that match our {CITY} filter and list Muay Thai. Rankings follow the
            same review-first logic as our national hub, so you can compare consistently across cities.
          </p>
        </div>
      </section>

      <GuideSection id="plan" variant="slate" className="mb-14">
        <h2 className="mb-6 text-2xl font-bold text-gray-900 md:text-3xl">Plan an island training stay that actually works</h2>
        <GuideThreeCards
          items={[
            { title: 'Decide the goal', body: 'One session/day is plenty for beginners. Two-a-days work when sleep and recovery are stable.' },
            { title: 'Commute & sleep', body: 'Island distance adds up. Choose accommodation you can live in and a gym you can reach without daily stress.' },
            { title: 'Recovery days', body: 'Island “rest days” still help: swim, walk, eat, and sleep. That’s how you sustain 4+ weeks.' },
          ]}
        />
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">Common mistakes</h3>
            <ul className="mt-3 space-y-2 text-sm text-gray-700">
              <li>
                <strong>Overplanning fun:</strong> you skip sessions and lose consistency.
              </li>
              <li>
                <strong>Underplanning sleep:</strong> late nights ruin morning training.
              </li>
              <li>
                <strong>Ignoring humidity:</strong> dehydration kills recovery.
              </li>
            </ul>
          </div>
          <figure className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="relative aspect-[4/3] w-full">
              <Image
                src="https://images.unsplash.com/photo-1526772662000-3f88f10405ff?auto=format&fit=crop&w=1400&q=80"
                alt="Tropical sea and clouds"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 520px"
              />
            </div>
            <figcaption className="px-4 py-3 text-xs text-gray-600">
              Island training works when you treat recovery as part of the plan.
            </figcaption>
          </figure>
        </div>
      </GuideSection>

      <GuideSection id="week-template" variant="slate" className="mb-14">
        <h2 className="mb-4 text-2xl font-bold text-gray-900 md:text-3xl">A realistic 7‑day Koh Samui training template</h2>
        <p className="mb-6 max-w-3xl text-gray-700">
          Island stays succeed when you plan for consistency and recovery. Use this as a baseline.
        </p>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">Week 1 (adaptation)</h3>
            <ul className="mt-3 space-y-2 text-sm text-gray-700">
              <li>
                <strong>Mon–Fri:</strong> 1 session/day + mobility, early sleep.
              </li>
              <li>
                <strong>Sat:</strong> technique day + errands.
              </li>
              <li>
                <strong>Sun:</strong> full rest.
              </li>
            </ul>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">Week 2+ (progress)</h3>
            <ul className="mt-3 space-y-2 text-sm text-gray-700">
              <li>
                <strong>4–6 days/week:</strong> 1–2 sessions/day based on recovery.
              </li>
              <li>
                <strong>1 recovery day:</strong> treat it as mandatory to sustain the stay.
              </li>
              <li>
                <strong>Sparring:</strong> controlled rounds beat ego rounds.
              </li>
            </ul>
          </div>
        </div>
      </GuideSection>

      <GuideSection id="budget" variant="default" className="mb-14 border border-gray-200 bg-white">
        <div className="grid gap-8 md:grid-cols-2 md:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#003580]">Budget & packing</p>
            <h2 className="mt-2 text-2xl font-bold text-gray-900 md:text-3xl">How to compare camps on an island</h2>
            <div className="mt-3 space-y-3 text-base leading-relaxed text-gray-700">
              <p>
                For longer stays, total cost is more than gym fees. Compare packages, transport, food, and recovery. A slightly
                higher-priced camp can be better value if it saves commute time and supports consistent training.
              </p>
              <p>
                Pack wraps + mouthguard, and consider buying gloves/shin guards locally. Confirm gear expectations in the gym’s
                profile before you commit.
              </p>
            </div>
          </div>
          <figure className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="relative aspect-[4/3] w-full">
              <Image
                src="https://images.unsplash.com/photo-1555597673-b21d5c935865?auto=format&fit=crop&w=1400&q=80"
                alt="Muay Thai training gloves and pads"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 520px"
              />
            </div>
            <figcaption className="px-4 py-3 text-xs text-gray-600">
              Consistency beats perfect gear. Pack basics and focus on repeatable weeks.
            </figcaption>
          </figure>
        </div>
      </GuideSection>

      <GuideSection variant="default" className="mb-14 border border-gray-200 bg-white">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#003580]">Further reading</p>
        <h2 className="mt-2 text-2xl font-bold text-gray-900 md:text-3xl">Official planning links</h2>
        <p className="mt-3 max-w-3xl text-base leading-relaxed text-gray-700">
          Verify weather and travel updates right before you book a long stay.
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
        <p className="mb-8 text-gray-600">{CITY} training questions that show up in search.</p>
        <GuideFaqList items={FAQ_ITEMS} />
      </GuideSection>

      <RelatedGuides
        guides={[
          { title: 'Best Muay Thai gyms in Koh Phangan', href: '/blog/best-muay-thai-gyms-koh-phangan' },
          { title: 'Best Muay Thai gyms in Phuket', href: '/blog/best-muay-thai-gyms-phuket' },
          { title: '25 best Muay Thai camps in Thailand (2026)', href: '/blog/best-muay-thai-camps-thailand-2026' },
          { title: 'Thailand training visa / DTV', href: '/blog/thailand-training-visa-dtv' },
        ]}
      />
    </ArticleShell>
  )
}

