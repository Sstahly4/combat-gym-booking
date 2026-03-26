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
import { Anchor, Sun } from 'lucide-react'

const CITY = 'Phuket'
const TITLE = `Best Muay Thai Gyms in ${CITY} (2026)`
const DESCRIPTION = `Ranked Muay Thai camps in Phuket, Thailand: live prices, photos, schedule snippets, and reviews. Compare the best gyms before you book.`

export const metadata: Metadata = {
  title: `${TITLE} | Photos, Prices & Tips | CombatBooking.com`,
  description: DESCRIPTION,
  alternates: { canonical: '/blog/best-muay-thai-gyms-phuket' },
  openGraph: { title: `${TITLE} - CombatBooking.com`, description: DESCRIPTION, type: 'article' },
  twitter: { card: 'summary_large_image', title: `${TITLE} - CombatBooking.com`, description: DESCRIPTION },
}

function absoluteUrl(path: string) {
  return `https://combatbooking.com${path}`
}

const FAQ_ITEMS = [
  {
    q: `How is this different from the national “25 best Muay Thai camps” list?`,
    a: `This page only includes gyms whose city field matches Phuket-area listings on CombatBooking and that list Muay Thai. The national guide ranks Thailand-wide; this one is for island trip planning.`,
  },
  {
    q: `Why is a camp missing if it is famous in Phuket?`,
    a: `The gym must be live on CombatBooking with Muay Thai in disciplines and a city name that matches our Phuket filter. Owners can update their listing to appear here.`,
  },
  {
    q: `Beach area vs Old Town—does ranking account for location?`,
    a: `Rankings use reviews and listing quality, not distance to the beach. Use maps on each gym profile and factor in your accommodation when you choose.`,
  },
  {
    q: `What is the best area to stay in Phuket for Muay Thai training?`,
    a: `There is no single best area—optimize for sleep, food, and a repeatable commute. Pick accommodation near your chosen gym (or a central area with easy transport) so you can realistically train 1–2 sessions per day for weeks.`,
  },
  {
    q: `Is Phuket good for beginners?`,
    a: `Yes. Many camps support beginners—but intensity varies. Read each gym profile for fundamentals blocks, coach ratios, and sparring policies so you can start safely and build volume gradually.`,
  },
  {
    q: `When is the best time of year to train in Phuket?`,
    a: `It depends on heat, rainfall, and crowds. Check weather seasonality before booking long stays, and remember humidity affects recovery as much as training volume.`,
  },
]

const EDITORIAL: Array<{ title: string; body: ReactNode }> = [
  {
    title: `Top picks on the island`,
    body: (
      <>
        <p>
          These are the highest review-momentum camps in our Phuket-filtered set—not a paid placement list. Compare
          morning and evening sessions, and whether you want walkable food options or a quieter road.
        </p>
      </>
    ),
  },
  {
    title: `Strong alternatives`,
    body: (
      <>
        <p>
          Still verified Muay Thai gyms with real listings. The gap from the top band is often review volume or a few
          rating points—open profiles to see coach ratios and class splits.
        </p>
      </>
    ),
  },
  {
    title: `Mid-list options worth a look`,
    body: (
      <>
        <p>
          Great for travelers who prioritize dates, budget, or a specific neighborhood. Cross-check commute from your hotel—
          Phuket traffic can matter more than a one-spot rank difference.
        </p>
      </>
    ),
  },
  {
    title: `Rounding out the shortlist`,
    body: (
      <>
        <p>
          Use these names as a comparison set against the{' '}
          <Link href="/blog/best-muay-thai-camps-thailand-2026" className="font-medium text-[#003580] underline">
            Thailand top 25 hub
          </Link>{' '}
          if you want a national view before you commit to the island.
        </p>
      </>
    ),
  },
  {
    title: `Final ranked slots`,
    body: (
      <>
        <p>
          Completes a deep shortlist so you are not stuck comparing only three camps from an old blog post. Always confirm
          current pricing on the gym page.
        </p>
      </>
    ),
  },
]

export default async function BestMuayThaiGymsPhuketPage() {
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
    mainEntityOfPage: absoluteUrl('/blog/best-muay-thai-gyms-phuket'),
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
      subtitle={`Ranked Muay Thai training camps in ${CITY}—live listings, not recycled “top 3” blog spam.`}
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
        imageSrc="/IMG_3557_246c0a62-a253-4f95-abfd-9cb306228c6c.jpg"
        imageAlt={`Muay Thai training in ${CITY}, Thailand`}
        priority
        overlayText={`${CITY} combines island life with serious Muay Thai—use this guide to compare camps by reviews, price, and real schedule data.`}
      />

      <GuideLeadRow
        tocItems={[
          { href: '#why-phuket', label: `Why ${CITY}` },
          { href: '#plan-trip', label: 'Plan your trip' },
          { href: '#ranked', label: 'Ranked gyms' },
          { href: '#faq', label: 'FAQ' },
        ]}
        statValue={gyms.length}
        statDescription={`Verified/trusted Muay Thai camps matching this ${CITY} guide on CombatBooking.`}
        statIcon={<Sun className="h-5 w-5" />}
      />

      <GuideSection variant="slate" className="mb-14">
        <div className="grid gap-8 md:grid-cols-2 md:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#003580]">Phuket trip planning</p>
            <h2 className="mt-2 text-2xl font-bold text-gray-900 md:text-3xl">Where people stay (and why it matters)</h2>
            <div className="mt-3 space-y-3 text-base leading-relaxed text-gray-700">
              <p>
                Search intent for <strong>best Muay Thai gyms in Phuket</strong> is often really about tradeoffs: beach access,
                quiet recovery, nightlife temptation, and whether you can repeat the commute twice daily for 2–4 weeks.
              </p>
              <p>
                Your “best gym” becomes the one you consistently attend. Pick an area that supports sleep, food, and routines—
                then choose a camp whose schedule fits your actual day.
              </p>
            </div>
          </div>
          <figure className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="relative aspect-[4/3] w-full">
              <Image
                src="https://images.unsplash.com/photo-1508009603885-50cf7c579365?auto=format&fit=crop&w=1400&q=80"
                alt="Phuket Thailand coastline and cityscape"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 520px"
              />
            </div>
            <figcaption className="px-4 py-3 text-xs text-gray-600">
              If you’re training hard, choose accommodation for recovery first—then optimize the fun stuff.
            </figcaption>
          </figure>
        </div>
      </GuideSection>

      <section id="why-phuket" className="mb-14 scroll-mt-24">
        <GuideAccentIntro icon={Anchor} title={`Why train Muay Thai in ${CITY}?`} subtitle="Island logistics + fight culture" />
        <div className="prose prose-gray max-w-none space-y-4 text-base leading-relaxed text-gray-800 md:prose-lg">
          <p>
            People searching for the <strong>best Muay Thai gyms in Phuket</strong> usually want two things at once: real
            training progression <em>and</em> a holiday setting. That is doable—but you should plan for heat, seasonal crowds,
            and transport time between your hotel and the gym.
          </p>
          <p>
            Unlike generic listicles, this page pulls <strong>only verified gyms</strong> that list Muay Thai on CombatBooking
            and match our {CITY} location filter. Rankings follow the same review-first logic as our national guides so you
            can compare consistently.
          </p>
        </div>
      </section>

      <GuideSection id="plan-trip" variant="slate" className="mb-14">
        <h2 className="mb-6 text-2xl font-bold text-gray-900 md:text-3xl">Plan smarter: training vs vacation mode</h2>
        <GuideThreeCards
          items={[
            {
              title: 'Session timing',
              body: `Morning pads hit different in tropical humidity. Check each profile for morning vs evening blocks and whether beginners have separate classes.`,
            },
            {
              title: 'Total trip cost',
              body: `Compare package types—not only per-day training. On-site rooms, meals, and airport transfers can swing value more than rank order.`,
            },
            {
              title: 'After training',
              body: `Recovery matters: sleep, food, and not partying through every night if you came to improve. Build rest into your island week.`,
            },
          ]}
        />
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">A realistic 7‑day Phuket training template</h3>
            <ul className="mt-3 space-y-2 text-sm text-gray-700">
              <li>
                <strong>Mon–Fri:</strong> 1–2 sessions/day (pads + technique), 1 light run or mobility, early sleep.
              </li>
              <li>
                <strong>Sat:</strong> skill day (lighter sparring, drills) + errands (laundry, gear, meal prep).
              </li>
              <li>
                <strong>Sun:</strong> full rest or easy swim/walk—this is when recovery makes next week better.
              </li>
            </ul>
            <p className="mt-3 text-sm text-gray-600">
              The best Phuket camps are the ones you can attend consistently without turning your week into a commute marathon.
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">What to check on every gym profile</h3>
            <ul className="mt-3 space-y-2 text-sm text-gray-700">
              <li>
                <strong>Schedule:</strong> morning vs evening blocks, beginner tracks, sparring rules.
              </li>
              <li>
                <strong>Package includes:</strong> private sessions, meals, accommodation, airport pickup.
              </li>
              <li>
                <strong>Coach ratios:</strong> group size vs how much feedback you get.
              </li>
              <li>
                <strong>Location:</strong> maps + commute from where you’ll sleep, not “close on paper.”
              </li>
            </ul>
          </div>
        </div>
        <p className="mt-8 text-center text-sm text-gray-600">
          National context:{' '}
          <Link href="/blog/best-muay-thai-camps-thailand-2026" className="font-medium text-[#003580] underline">
            25 best Muay Thai camps in Thailand
          </Link>
        </p>
      </GuideSection>

      <GuideSection variant="default" className="mb-14 border border-gray-200 bg-white">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#003580]">Further reading</p>
        <h2 className="mt-2 text-2xl font-bold text-gray-900 md:text-3xl">Weather and seasonality links</h2>
        <p className="mt-3 max-w-3xl text-base leading-relaxed text-gray-700">
          Phuket training feels very different across seasons. Before you book a month, check weather patterns and plan your
          recovery accordingly.
        </p>
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="grid gap-4 sm:grid-cols-2 lg:col-span-2">
            <a
              href="https://www.tmd.go.th/en/"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <p className="text-sm font-semibold text-gray-900">Thai Meteorological Department (TMD)</p>
              <p className="mt-1 text-xs text-gray-600">Official weather and seasonal outlooks.</p>
              <p className="mt-3 text-xs font-semibold text-[#003580]">Open →</p>
            </a>
            <a
              href="https://www.tourismthailand.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <p className="text-sm font-semibold text-gray-900">Tourism Authority of Thailand (TAT)</p>
              <p className="mt-1 text-xs text-gray-600">Destination guidance and travel updates.</p>
              <p className="mt-3 text-xs font-semibold text-[#003580]">Open →</p>
            </a>
          </div>
          <figure className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm lg:col-span-1">
            <div className="relative aspect-[4/3] w-full">
              <Image
                src="https://images.unsplash.com/photo-1526772662000-3f88f10405ff?auto=format&fit=crop&w=1400&q=80"
                alt="Tropical rain clouds over the sea in Thailand"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 360px"
              />
            </div>
            <figcaption className="px-4 py-3 text-xs text-gray-600">
              Seasonality affects training load. Heat and humidity change recovery more than people expect.
            </figcaption>
          </figure>
        </div>
      </GuideSection>

      <GuideCtaStrip
        title={`Browse every ${CITY} Muay Thai listing`}
        subtitle="Filter by price, dates, and amenities after you shortlist from this page."
        href={`/search?country=Thailand&location=${encodeURIComponent(CITY)}&discipline=Muay%20Thai`}
        buttonLabel={`Open ${CITY} search`}
      />

      <section id="ranked" className="mb-16 scroll-mt-24">
        <h2 className="mb-2 text-2xl font-bold text-gray-900 md:text-3xl">Ranked Muay Thai gyms in {CITY}</h2>
        <p className="mb-8 max-w-3xl text-gray-600">
          Structured data matches the order below: #1 first. We insert long-form context every five camps so the page reads
          like a guide—not a bare directory.
        </p>

        {gyms.length === 0 ? (
          <GuideEmptyState
            title={`No gyms matched “${CITY}” with Muay Thai yet`}
            description="Try the national hub or widen search. Owners should set city and disciplines so you appear here."
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

      <GuideSection id="faq" variant="default" padding="p-6 md:p-8" className="mb-14 shadow-sm">
        <h2 className="mb-2 text-2xl font-bold text-gray-900 md:text-3xl">FAQ</h2>
        <p className="mb-8 text-gray-600">Phuket-specific questions travelers ask before booking a camp.</p>
        <GuideFaqList items={FAQ_ITEMS} />
      </GuideSection>

      <RelatedGuides
        guides={[
          { title: '25 best Muay Thai camps in Thailand (2026)', href: '/blog/best-muay-thai-camps-thailand-2026' },
          { title: 'Best Muay Thai gyms in Bangkok', href: '/blog/best-muay-thai-gyms-bangkok' },
          { title: 'Best Muay Thai gyms in Chiang Mai', href: '/blog/best-muay-thai-gyms-chiang-mai' },
          { title: 'Thailand training visa / DTV', href: '/blog/thailand-training-visa-dtv' },
        ]}
      />
    </ArticleShell>
  )
}
