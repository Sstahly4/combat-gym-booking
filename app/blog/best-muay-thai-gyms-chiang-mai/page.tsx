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
import { Mountain, Sun } from 'lucide-react'

const CITY = 'Chiang Mai'
const TITLE = `Best Muay Thai Gyms in ${CITY} (2026)`
const DESCRIPTION = `Ranked Muay Thai camps in Chiang Mai, Thailand: prices, photos, reviews, and tips for training in the north.`

export const metadata: Metadata = {
  title: `${TITLE} | Northern Thailand Training | CombatBooking.com`,
  description: DESCRIPTION,
  alternates: { canonical: '/blog/best-muay-thai-gyms-chiang-mai' },
  openGraph: { title: `${TITLE} - CombatBooking.com`, description: DESCRIPTION, type: 'article' },
  twitter: { card: 'summary_large_image', title: `${TITLE} - CombatBooking.com`, description: DESCRIPTION },
}

function absoluteUrl(path: string) {
  return `https://combatbooking.com${path}`
}

const FAQ_ITEMS = [
  {
    q: 'Is Chiang Mai better than Bangkok for long Muay Thai stays?',
    a: 'Many travelers prefer the north for slower pace and cooler mornings—but fight density and camp variety differ from Bangkok. Choose based on lifestyle, not hype.',
  },
  {
    q: 'How does ranking work on this page?',
    a: 'Same review-first logic as other CombatBooking guides, filtered to Muay Thai gyms whose city matches Chiang Mai on the listing.',
  },
  {
    q: 'Can I combine trekking and hard training?',
    a: 'Yes, but manage load. Add recovery days if you stack big hikes with twice-daily training—injury risk rises when you overbook activities.',
  },
  {
    q: 'Is Chiang Mai good for beginners in Muay Thai?',
    a: 'Yes—many gyms support beginners. Read each profile for fundamentals blocks, coach ratios, and sparring policy so you can ramp up safely.',
  },
  {
    q: 'When is the best season to train in Chiang Mai?',
    a: 'It depends on weather preferences and air quality considerations. Check official forecasts and plan recovery—cooler mornings can help, but conditions change across the year.',
  },
  {
    q: 'How long should I stay in Chiang Mai to improve?',
    a: 'Most people feel meaningful progress with 2–4 weeks of consistent training. Longer stays work best when you pick a routine you can sustain—sleep, food, and recovery matter as much as sessions.',
  },
  {
    q: 'Where should I stay in Chiang Mai for Muay Thai training?',
    a: 'Stay where you can sleep well and commute consistently to your chosen gym. For long stays, minimizing daily friction matters more than being near nightlife or tourist attractions.',
  },
  {
    q: 'How much does Muay Thai cost in Chiang Mai?',
    a: 'Prices vary by gym and package type. Use this ranked shortlist, then confirm current rates and inclusions on each gym profile.',
  },
  {
    q: 'What should I pack for a Chiang Mai training stay?',
    a: 'Wraps, mouthguard, lightweight training clothes, and blister/tape basics. Many travelers buy gloves/shin guards locally to reduce luggage weight—confirm gym rules on each listing.',
  },
]

const EDITORIAL: Array<{ title: string; body: ReactNode }> = [
  {
    title: 'Top northern picks',
    body: (
      <p>
        Highest review momentum within the Chiang Mai filter. Check elevation and weather seasonality—mornings can feel
        cooler than the south, which helps roadwork.
      </p>
    ),
  },
  {
    title: 'Next tier',
    body: (
      <p>
        Still verified listings. Compare fundamentals vs fighter tracks on each profile—northern camps vary in how they
        split skill levels.
      </p>
    ),
  },
  {
    title: 'Mid-list',
    body: (
      <p>
        Worth comparing if you want a specific vibe or quieter training floor. Rank is not personality—read descriptions.
      </p>
    ),
  },
  {
    title: 'Deeper list',
    body: (
      <p>
        Expand your shortlist beyond the first page of Google results. These gyms still meet our discipline and
        verification rules.
      </p>
    ),
  },
  {
    title: 'Final slots',
    body: (
      <p>
        Completes a thorough set of ranked options. Pair with the{' '}
        <Link href="/blog/best-muay-thai-camps-thailand-2026" className="font-medium text-[#003580] underline">
          national Muay Thai hub
        </Link>{' '}
        if you are flexible on region.
      </p>
    ),
  },
]

export default async function BestMuayThaiGymsChiangMaiPage() {
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
    mainEntityOfPage: absoluteUrl('/blog/best-muay-thai-gyms-chiang-mai'),
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
      subtitle="Chiang Mai offers a different training rhythm than Bangkok or the islands—rankings still come from live reviews and listings."
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
        imageSrc="/e079bedfbf7e870f827b4fda7ce2132f.avif"
        imageAlt={`Muay Thai in ${CITY}`}
        priority
        overlayText="Chiang Mai: cooler mornings, slower pace, and serious camps—pick a gym that matches how hard you want to train and how quiet you want life outside the gym."
      />

      <GuideLeadRow
        tocItems={[
          { href: '#why-cm', label: 'Why Chiang Mai' },
          { href: '#north-tips', label: 'Northern tips' },
          { href: '#where-to-stay', label: 'Where to stay' },
          { href: '#ranked', label: 'Ranked gyms' },
          { href: '#faq', label: 'FAQ' },
        ]}
        statValue={gyms.length}
        statDescription={`Verified/trusted Muay Thai gyms matching this ${CITY} guide.`}
        statIcon={<Sun className="h-5 w-5" />}
      />

      <GuideSection variant="slate" className="mb-14">
        <div className="grid gap-8 md:grid-cols-2 md:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#003580]">Northern rhythm</p>
            <h2 className="mt-2 text-2xl font-bold text-gray-900 md:text-3xl">Why Chiang Mai keeps people longer</h2>
            <p className="mt-3 text-base leading-relaxed text-gray-700">
              Longer stays succeed when your routine is sustainable: sleep, food, recovery, and a gym you enjoy returning to.
              Use this ranked list to compare—then choose based on vibe and schedule.
            </p>
          </div>
          <figure className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="relative aspect-[4/3] w-full">
              <Image
                src="/e079bedfbf7e870f827b4fda7ce2132f.avif"
                alt="Chiang Mai Muay Thai guide visual"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 520px"
              />
            </div>
            <figcaption className="px-4 py-3 text-xs text-gray-600">
              If you’re training hard, schedule recovery days like you schedule sessions.
            </figcaption>
          </figure>
        </div>
      </GuideSection>

      <section id="why-cm" className="mb-14 scroll-mt-24">
        <GuideAccentIntro icon={Mountain} title="Why train Muay Thai in Chiang Mai?" subtitle="North vs south Thailand" />
        <div className="prose prose-gray max-w-none space-y-4 text-base leading-relaxed text-gray-800 md:prose-lg">
          <p>
            Travelers searching <strong>best Muay Thai gyms in Chiang Mai</strong> often want a calmer base than Phuket or
            Bangkok, with mountain air and a digital-nomad-friendly rhythm. The north still has real fight culture—just
            verify class intensity and coaching style on each listing.
          </p>
          <p>
            This page ranks only <strong>verified</strong> gyms that list Muay Thai and match our {CITY} location filter—
            same integrity rules as our national guide.
          </p>
        </div>
      </section>

      <GuideSection id="north-tips" variant="slate" className="mb-14">
        <h2 className="mb-6 text-2xl font-bold text-gray-900 md:text-3xl">Northern Thailand training tips</h2>
        <GuideThreeCards
          items={[
            {
              title: 'Weather & load',
              body: 'Cooler mornings can hide dehydration—still hydrate aggressively and scale running volume if you are new to altitude or hills.',
            },
            {
              title: 'Lifestyle balance',
              body: 'It is easy to stack activities. Protect joints and sleep if you add trekking or long motorbike days on top of twice-daily training.',
            },
            {
              title: 'Compare regions',
              body: 'If you are unsure north vs island vs capital, read our Bangkok and Phuket guides plus the national top 25.',
            },
          ]}
        />
      </GuideSection>

      <GuideSection variant="default" className="mb-14 border border-gray-200 bg-white">
        <div className="grid gap-8 md:grid-cols-2 md:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#003580]">Long-stay planning</p>
            <h2 className="mt-2 text-2xl font-bold text-gray-900 md:text-3xl">A simple 4‑week Chiang Mai plan</h2>
            <div className="mt-3 space-y-3 text-base leading-relaxed text-gray-700">
              <p>
                If you’re staying a month, the biggest driver of improvement is consistency: show up, recover, repeat.
                Start week 1 with one session/day, then scale to two-a-days only when your sleep and soreness are stable.
              </p>
              <p>
                Week 2–3 is where volume compounds. Week 4 is where small technique cues finally stick because you’ve repeated
                them hundreds of times.
              </p>
              <p>
                Build one “boring” logistics day per week (laundry, meal prep, errands) so your training weeks don’t collapse
                into chaos.
              </p>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <a
                href="https://www.tmd.go.th/en/"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                <p className="text-sm font-semibold text-gray-900">Thai Meteorological Department (TMD)</p>
                <p className="mt-1 text-xs text-gray-600">Check weather and seasonal patterns.</p>
                <p className="mt-3 text-xs font-semibold text-[#003580]">Open →</p>
              </a>
              <a
                href="https://www.tourismthailand.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                <p className="text-sm font-semibold text-gray-900">Tourism Authority of Thailand (TAT)</p>
                <p className="mt-1 text-xs text-gray-600">Official destination info and updates.</p>
                <p className="mt-3 text-xs font-semibold text-[#003580]">Open →</p>
              </a>
            </div>
          </div>
          <figure className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="relative aspect-[4/3] w-full">
              <Image
                src="https://images.unsplash.com/photo-1528181304800-259b08848526?auto=format&fit=crop&w=1400&q=80"
                alt="Chiang Mai Thailand temple and mountains"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 520px"
              />
            </div>
            <figcaption className="px-4 py-3 text-xs text-gray-600">
              Chiang Mai rewards routine—choose a base you can live in comfortably while you train.
            </figcaption>
          </figure>
        </div>
      </GuideSection>

      <GuideSection id="where-to-stay" variant="default" className="mb-14 border border-gray-200 bg-white">
        <div className="grid gap-8 md:grid-cols-2 md:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#003580]">Where to stay</p>
            <h2 className="mt-2 text-2xl font-bold text-gray-900 md:text-3xl">Choose a base that protects your routine</h2>
            <div className="mt-3 space-y-3 text-base leading-relaxed text-gray-700">
              <p>
                Chiang Mai is popular for long stays because it’s easier to live in: slower pace, strong food options, and a routine that
                doesn’t feel like constant tourism. But results still come down to consistency.
              </p>
              <p>
                The best place to stay is the one that makes you show up. Prioritize <strong>sleep</strong> and a <strong>repeatable commute</strong> to your gym over
                being near every cafe or attraction.
              </p>
            </div>
            <div className="mt-6 grid gap-4">
              <div className="rounded-xl border border-gray-200 bg-slate-50 p-5">
                <p className="text-sm font-semibold text-gray-900">If you’re training hard (two-a-days)</p>
                <p className="mt-1 text-sm text-gray-700">
                  Stay close to your chosen gym or on the simplest route. Travel friction kills consistency faster than motivation.
                </p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-slate-50 p-5">
                <p className="text-sm font-semibold text-gray-900">If you’re mixing activities (trekking, motorbike days)</p>
                <p className="mt-1 text-sm text-gray-700">
                  Choose a quieter base and protect recovery. Stacking big activity days with hard training is the fastest path to injury.
                </p>
              </div>
            </div>
          </div>
          <figure className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="relative aspect-[4/3] w-full">
              <Image
                src="https://images.unsplash.com/photo-1526481280695-3c687fd5432c?auto=format&fit=crop&w=1400&q=80"
                alt="Northern Thailand city and mountains"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 520px"
              />
            </div>
            <figcaption className="px-4 py-3 text-xs text-gray-600">
              For long stays, pick accommodation for recovery first—then let training compound.
            </figcaption>
          </figure>
        </div>
      </GuideSection>

      <GuideCtaStrip
        title={`Search ${CITY} Muay Thai camps`}
        subtitle="Filter and compare every listing, not only this article."
        href={`/search?country=Thailand&location=${encodeURIComponent(CITY)}&discipline=Muay%20Thai`}
        buttonLabel="Open Chiang Mai search"
      />

      <section id="ranked" className="mb-16 scroll-mt-24">
        <h2 className="mb-2 text-2xl font-bold text-gray-900 md:text-3xl">Ranked gyms</h2>
        <p className="mb-8 max-w-3xl text-gray-600">
          Editorial sections every five listings keep the page useful for humans and search engines alike.
        </p>
        {gyms.length === 0 ? (
          <GuideEmptyState
            title="No Chiang Mai gyms matched"
            description="Try national search or verify city spelling on listings."
            searchHref={`/search?country=Thailand&location=${encodeURIComponent(CITY)}&discipline=Muay%20Thai`}
            searchLabel="Search Chiang Mai"
          />
        ) : (
          <ChunkedGymGrid
            gyms={gyms}
            chunkSize={5}
            fallbackImageSrc="/Khun_3_c4e13bdce8_c0b7f8b5b5.avif"
            editorialBetweenChunks={EDITORIAL.slice(0, Math.ceil(gyms.length / 5))}
          />
        )}
      </section>

      <GuideSection id="faq" variant="default" padding="p-6 md:p-8" className="mb-14 shadow-sm">
        <h2 className="mb-2 text-2xl font-bold text-gray-900 md:text-3xl">FAQ</h2>
        <p className="mb-8 text-gray-600">Chiang Mai–specific questions.</p>
        <GuideFaqList items={FAQ_ITEMS} />
      </GuideSection>

      <RelatedGuides
        guides={[
          { title: '25 best Muay Thai camps (Thailand)', href: '/blog/best-muay-thai-camps-thailand-2026' },
          { title: 'Best Muay Thai gyms in Phuket', href: '/blog/best-muay-thai-gyms-phuket' },
          { title: 'Best Muay Thai gyms in Bangkok', href: '/blog/best-muay-thai-gyms-bangkok' },
          { title: 'Thailand visa / DTV guide', href: '/blog/thailand-training-visa-dtv' },
        ]}
      />
    </ArticleShell>
  )
}
