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
import { Anchor, Sun, Waves } from 'lucide-react'

const CITY = 'Koh Tao'
const TITLE = `Best Muay Thai Gyms in ${CITY} (2026)`
const DESCRIPTION =
  'Ranked Muay Thai camps in Koh Tao, Thailand: verified listings, prices, photos, reviews, and long-stay planning tips for island training routines.'

export const metadata: Metadata = {
  title: `${TITLE} | Prices, Photos & Tips | CombatBooking.com`,
  description: DESCRIPTION,
  alternates: { canonical: '/blog/best-muay-thai-gyms-koh-tao' },
  openGraph: { title: `${TITLE} - CombatBooking.com`, description: DESCRIPTION, type: 'article' },
  twitter: { card: 'summary_large_image', title: `${TITLE} - CombatBooking.com`, description: DESCRIPTION },
}

function absoluteUrl(path: string) {
  return `https://combatbooking.com${path}`
}

const FAQ_ITEMS = [
  {
    q: `Is Koh Tao good for Muay Thai training?`,
    a: `It can be if you want a small-island base and you plan a routine. Choose accommodation for sleep and a gym schedule you can repeat for weeks.`,
  },
  {
    q: `How are Koh Tao gyms ranked?`,
    a: `We filter for verified/trusted CombatBooking listings that match the Koh Tao city filter and list Muay Thai, then rank primarily by review score and review volume.`,
  },
  {
    q: `Can I train and dive on the same trip?`,
    a: `Yes, but manage load. Stacking intense training, heat, and diving can fatigue you faster than expected. Use recovery days and avoid overbooking early in your stay.`,
  },
  {
    q: `When is the best time of year to train on Koh Tao?`,
    a: `It depends on weather and crowds. Check official patterns before long stays—humidity and heat change recovery and training volume.`,
  },
  {
    q: `Is Koh Tao beginner-friendly for Muay Thai?`,
    a: `Often yes, but intensity varies. Use profiles to confirm fundamentals blocks, coach ratios, and sparring policy so you can ramp up safely.`,
  },
  {
    q: `How much does Muay Thai cost on Koh Tao?`,
    a: `Pricing varies by gym and package type. Shortlist from this guide, then confirm current rates and what is included on each gym page.`,
  },
  {
    q: `How long should I stay on Koh Tao to improve?`,
    a: `Most people feel meaningful progress after 2–4 weeks of consistent sessions and recovery. Longer stays work best when you manage load and protect sleep.`,
  },
  {
    q: `Does this list include every gym on Koh Tao?`,
    a: `No. It includes verified/trusted CombatBooking listings that match the Koh Tao filter and list Muay Thai. A gym can be missing if it is not live on the marketplace yet.`,
  },
]

const EDITORIAL: Array<{ title: string; body: ReactNode }> = [
  { title: `Top ${CITY} picks`, body: <p>Highest review momentum inside the Koh Tao filter. Compare schedules and class structure.</p> },
  { title: `Strong alternatives`, body: <p>Still verified/trusted listings—differences are often review recency and availability.</p> },
  { title: `Mid-list options`, body: <p>Useful when you prioritize dates, budget, or a specific area.</p> },
  { title: `More gyms`, body: <p>Expand beyond whatever one blog repeats.</p> },
  { title: `Final ranked slots`, body: <p>Completes a deeper ranked list so you can compare more options.</p> },
]

export default async function BestMuayThaiGymsKohTaoPage() {
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
    mainEntityOfPage: absoluteUrl('/blog/best-muay-thai-gyms-koh-tao'),
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
      subtitle="Koh Tao can be a great long-stay base if you plan your training volume and recovery. Use this guide to shortlist verified camps and compare routines."
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
        imageAlt="Koh Tao Thailand beach"
        priority
        overlayText="Koh Tao Muay Thai camps ranked from verified listings—compare schedules, prices, and reviews, then book the right fit."
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
        statIcon={<Waves className="h-5 w-5" />}
      />

      <section id="why" className="mb-14 scroll-mt-24">
        <GuideAccentIntro icon={Anchor} title={`Why train Muay Thai in ${CITY}?`} subtitle="Small island, big consistency" />
        <div className="prose prose-gray max-w-none space-y-4 text-base leading-relaxed text-gray-800 md:prose-lg">
          <p>
            People searching <strong>best Muay Thai gyms in {CITY}</strong> often want a simple island routine. The advantage
            is fewer big-city distractions. The challenge is planning intensity so you can stay healthy and train consistently.
          </p>
          <p>
            This page ranks verified/trusted listings that match our {CITY} filter and list Muay Thai so you can compare
            real, booking-ready profiles.
          </p>
        </div>
      </section>

      <GuideSection id="plan" variant="slate" className="mb-14">
        <h2 className="mb-6 text-2xl font-bold text-gray-900 md:text-3xl">Plan a Koh Tao training stay that actually works</h2>
        <GuideThreeCards
          items={[
            { title: 'Pick a schedule', body: 'Decide 1 vs 2 sessions/day based on experience. Consistency beats intensity spikes.' },
            { title: 'Recovery days', body: 'Keep one true rest day per week. It makes week 2–4 much stronger.' },
            { title: 'Mixing activities', body: 'If you’re diving or hiking, scale training volume to avoid overload.' },
          ]}
        />
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">Common mistakes</h3>
            <ul className="mt-3 space-y-2 text-sm text-gray-700">
              <li>
                <strong>Doing everything daily:</strong> you burn out fast.
              </li>
              <li>
                <strong>Not eating enough:</strong> high volume requires calories.
              </li>
              <li>
                <strong>Skipping sleep:</strong> technique doesn’t stick when you’re exhausted.
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
              Island heat changes recovery. Plan hydration, food, and rest like training variables.
            </figcaption>
          </figure>
        </div>
      </GuideSection>

      <GuideSection id="week-template" variant="slate" className="mb-14">
        <h2 className="mb-4 text-2xl font-bold text-gray-900 md:text-3xl">A realistic 7‑day Koh Tao training template</h2>
        <p className="mb-6 max-w-3xl text-gray-700">
          Koh Tao stays work best when you treat training and diving (or hiking) as one combined weekly load.
        </p>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">Week 1 (adaptation)</h3>
            <ul className="mt-3 space-y-2 text-sm text-gray-700">
              <li>
                <strong>Mon–Fri:</strong> 1 session/day + mobility; early sleep.
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
                <strong>4–6 training days:</strong> 1–2 sessions/day based on recovery.
              </li>
              <li>
                <strong>1 recovery day:</strong> keep it sacred so you can stay longer.
              </li>
              <li>
                <strong>Diving/hiking:</strong> avoid stacking with max sparring volume.
              </li>
            </ul>
          </div>
        </div>
      </GuideSection>

      <GuideSection id="budget" variant="default" className="mb-14 border border-gray-200 bg-white">
        <div className="grid gap-8 md:grid-cols-2 md:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#003580]">Budget & packing</p>
            <h2 className="mt-2 text-2xl font-bold text-gray-900 md:text-3xl">Plan costs like an athlete</h2>
            <div className="mt-3 space-y-3 text-base leading-relaxed text-gray-700">
              <p>
                For long stays, compare total value: gym + accommodation + food + transport + recovery. A camp that saves commute time
                often leads to more training sessions over the month.
              </p>
              <p>
                Pack wraps + mouthguard, and consider buying gloves/shin guards locally. Confirm gym expectations in the listing.
              </p>
            </div>
          </div>
          <figure className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="relative aspect-[4/3] w-full">
              <Image
                src="https://images.unsplash.com/photo-1555597673-b21d5c935865?auto=format&fit=crop&w=1400&q=80"
                alt="Muay Thai gloves and pads"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 520px"
              />
            </div>
            <figcaption className="px-4 py-3 text-xs text-gray-600">
              Pack basics, then optimize routines. Consistency is the real “secret.”
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
          { title: 'Best Muay Thai gyms in Koh Samui', href: '/blog/best-muay-thai-gyms-koh-samui' },
          { title: 'Best Muay Thai gyms in Koh Phangan', href: '/blog/best-muay-thai-gyms-koh-phangan' },
          { title: '25 best Muay Thai camps in Thailand (2026)', href: '/blog/best-muay-thai-camps-thailand-2026' },
          { title: 'Thailand training visa / DTV', href: '/blog/thailand-training-visa-dtv' },
        ]}
      />
    </ArticleShell>
  )
}

