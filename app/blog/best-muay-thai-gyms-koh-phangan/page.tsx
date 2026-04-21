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
import { Anchor, Moon, Sun } from 'lucide-react'

const CITY = 'Koh Phangan'
const TITLE = `Best Muay Thai Gyms in ${CITY} (2026)`
const SEO_TITLE = `Best Muay Thai Gyms in ${CITY} 2026 [Prices + Reviews]`
const PATH = '/blog/best-muay-thai-gyms-koh-phangan'
const DATE_PUBLISHED = '2025-10-15'
const DATE_MODIFIED = '2026-04-20'
const HERO_IMAGE = 'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1400&q=80'
const DESCRIPTION =
  'Ranked Muay Thai camps in Koh Phangan, Thailand: verified listings, prices, photos, reviews, and long-stay planning tips for island training routines.'

export const metadata: Metadata = {
  title: `${SEO_TITLE} | Combatbooking`,
  description: DESCRIPTION,
  alternates: { canonical: PATH },
  openGraph: { title: `${SEO_TITLE} | Combatbooking`, description: DESCRIPTION, type: 'article' },
  twitter: { card: 'summary_large_image', title: `${SEO_TITLE} | Combatbooking`, description: DESCRIPTION },
}

const FAQ_ITEMS = [
  {
    q: `Is Koh Phangan good for Muay Thai training?`,
    a: `It can be—especially for travelers who want island life with training. Your success depends on routine: choose accommodation for sleep and a gym you can reach consistently for weeks.`,
  },
  {
    q: `How are Koh Phangan gyms ranked?`,
    a: `We filter for verified/trusted CombatBooking listings that match the Koh Phangan city filter and list Muay Thai, then rank primarily by review score and review volume.`,
  },
  {
    q: `Can I train hard on Koh Phangan and still enjoy the island?`,
    a: `Yes—plan your week. Train hard 4–6 days, keep one recovery day, and protect sleep. If you overdo nightlife, your training quality drops fast.`,
  },
  {
    q: `When is the best time of year to train on Koh Phangan?`,
    a: `It depends on weather and crowds. Check official patterns before a long stay—humidity affects recovery and training volume.`,
  },
  {
    q: `Is Koh Phangan beginner-friendly for Muay Thai?`,
    a: `Often yes, but intensity varies. Use profiles to confirm fundamentals blocks, coach ratios, and sparring policy so you can ramp up safely.`,
  },
  {
    q: `How much does Muay Thai cost on Koh Phangan?`,
    a: `Pricing varies by gym and package type. Shortlist from this guide, then confirm current rates and what is included on each gym page.`,
  },
  {
    q: `How long should I stay on Koh Phangan to improve?`,
    a: `Most people feel meaningful progress after 2–4 weeks of consistent sessions and recovery. Longer stays work best when you protect sleep and avoid overbooking nightlife.`,
  },
  {
    q: `Does this list include every gym on Koh Phangan?`,
    a: `No. It includes verified/trusted CombatBooking listings that match the Koh Phangan filter and list Muay Thai. A gym can be missing if it is not live on the marketplace yet.`,
  },
]

const EDITORIAL: Array<{ title: string; body: ReactNode }> = [
  { title: `Top ${CITY} picks`, body: <p>Highest review momentum inside the Koh Phangan filter. Compare schedule fit and class structure.</p> },
  { title: `Strong alternatives`, body: <p>Still verified/trusted listings—differences are often review recency and availability.</p> },
  { title: `Mid-list options`, body: <p>Useful when you prioritize dates, budget, or a specific area.</p> },
  { title: `More gyms`, body: <p>Expand beyond whatever one blog repeats.</p> },
  { title: `Final ranked slots`, body: <p>Completes the ranked list so you can compare more options.</p> },
]

export default async function BestMuayThaiGymsKohPhanganPage() {
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
      subtitle="Koh Phangan can support long-stay training—if you plan your schedule and protect sleep. Use this guide to shortlist verified camps and compare routines."
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
        imageAlt="Koh Phangan Thailand beach and palm trees"
        priority
        overlayText="Koh Phangan Muay Thai camps ranked from verified listings—compare schedules, prices, and reviews, then book the right fit."
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
        <GuideAccentIntro icon={Moon} title={`Why train Muay Thai in ${CITY}?`} subtitle="Island life + discipline" />
        <div className="prose prose-gray max-w-none space-y-4 text-base leading-relaxed text-gray-800 md:prose-lg">
          <p>
            Searchers looking for <strong>best Muay Thai gyms in {CITY}</strong> want a training base that still feels like an island.
            The tradeoff is distractions. You’ll improve fastest if you pick a routine and keep it consistent for weeks.
          </p>
          <p>
            This page ranks verified/trusted listings that match our {CITY} filter and list Muay Thai, so you are not comparing random camps with no booking-ready details.
          </p>
        </div>
      </section>

      <GuideSection id="plan" variant="slate" className="mb-14">
        <h2 className="mb-6 text-2xl font-bold text-gray-900 md:text-3xl">Plan a Koh Phangan training stay that actually works</h2>
        <GuideThreeCards
          items={[
            { title: 'Sleep wins', body: 'If you’re training hard, protect sleep. Late nights destroy morning sessions.' },
            { title: 'Recovery day', body: 'Keep one true recovery day per week—walk, swim, stretch, and eat well.' },
            { title: 'Beginner ramp', body: 'Start with one session/day for a few days, then scale up if your body adapts.' },
          ]}
        />
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">Common mistakes</h3>
            <ul className="mt-3 space-y-2 text-sm text-gray-700">
              <li>
                <strong>Vacation-first planning:</strong> you train inconsistently and stall progress.
              </li>
              <li>
                <strong>Overtraining early:</strong> you get injured before adaptation.
              </li>
              <li>
                <strong>Ignoring heat:</strong> dehydration ruins recovery.
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
              A month-long island stay is won on routines: sleep, food, and consistent sessions.
            </figcaption>
          </figure>
        </div>
      </GuideSection>

      <GuideSection id="week-template" variant="slate" className="mb-14">
        <h2 className="mb-4 text-2xl font-bold text-gray-900 md:text-3xl">A realistic 7‑day Koh Phangan training template</h2>
        <p className="mb-6 max-w-3xl text-gray-700">
          The goal is to create a repeatable week so you stay longer and improve more.
        </p>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">Week 1 (build the habit)</h3>
            <ul className="mt-3 space-y-2 text-sm text-gray-700">
              <li>
                <strong>Mon–Fri:</strong> 1 session/day + mobility; early sleep.
              </li>
              <li>
                <strong>Sat:</strong> technique + errands.
              </li>
              <li>
                <strong>Sun:</strong> full rest.
              </li>
            </ul>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">Week 2+ (add volume)</h3>
            <ul className="mt-3 space-y-2 text-sm text-gray-700">
              <li>
                <strong>4–6 days/week:</strong> 1–2 sessions/day based on recovery.
              </li>
              <li>
                <strong>1 recovery day:</strong> protect joints and sleep.
              </li>
              <li>
                <strong>Nightlife:</strong> schedule it—don’t let it schedule you.
              </li>
            </ul>
          </div>
        </div>
      </GuideSection>

      <GuideSection id="budget" variant="default" className="mb-14 border border-gray-200 bg-white">
        <div className="grid gap-8 md:grid-cols-2 md:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#003580]">Budget & packing</p>
            <h2 className="mt-2 text-2xl font-bold text-gray-900 md:text-3xl">Compare total trip cost, not just gym fees</h2>
            <div className="mt-3 space-y-3 text-base leading-relaxed text-gray-700">
              <p>
                On islands, transport and convenience can matter more than a small price difference. A camp that’s easier to reach
                can lead to more sessions—and better results—over a month.
              </p>
              <p>
                Pack wraps + mouthguard, and consider buying gloves/shin guards locally. Confirm gym expectations on the listing.
              </p>
            </div>
          </div>
          <figure className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="relative aspect-[4/3] w-full">
              <Image
                src="https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1400&q=80"
                alt="Training gear for a longer stay"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 520px"
              />
            </div>
            <figcaption className="px-4 py-3 text-xs text-gray-600">
              Long stays are won on routines: sleep, food, and showing up consistently.
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
      <GuideCtaStrip
        title="Ready to pick your Koh Phangan Muay Thai camp?"
        subtitle="Filter verified Koh Phangan gyms by dates, price, and amenities — book directly on Combatbooking."
        href="/search?country=Thailand&location=Koh%20Phangan&discipline=Muay%20Thai"
        buttonLabel="Find your Koh Phangan camp"
      />



      <RelatedGuides
        guides={[
          { title: 'Best Muay Thai gyms in Koh Samui', href: '/blog/best-muay-thai-gyms-koh-samui' },
          { title: 'Best Muay Thai gyms in Phuket', href: '/blog/best-muay-thai-gyms-phuket' },
          { title: '25 best Muay Thai camps in Thailand (2026)', href: '/blog/best-muay-thai-camps-thailand-2026' },
          { title: 'Thailand training visa / DTV', href: '/blog/thailand-training-visa-dtv' },
        ]}
      />
    </ArticleShell>
  )
}

