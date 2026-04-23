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

const CITY = 'Hua Hin'
const TITLE = `Best Muay Thai Gyms in ${CITY} (2026)`
const SEO_TITLE = `Best Muay Thai Gyms in ${CITY} 2026 [Prices + Reviews]`
const PATH = '/blog/best-muay-thai-gyms-hua-hin'
const DATE_PUBLISHED = '2025-10-15'
const DATE_MODIFIED = '2026-04-20'
const HERO_IMAGE = 'https://images.unsplash.com/photo-1526481280695-3c687fd5432c?auto=format&fit=crop&w=1400&q=80'
const DESCRIPTION =
  'Ranked Muay Thai camps in Hua Hin, Thailand: verified listings, prices, photos, reviews, and long-stay planning tips for training with a calmer coastal routine.'

export const metadata: Metadata = {
  title: `${SEO_TITLE} | CombatStay`,
  description: DESCRIPTION,
  alternates: { canonical: PATH },
  openGraph: { title: `${SEO_TITLE} | CombatStay`, description: DESCRIPTION, type: 'article' },
  twitter: { card: 'summary_large_image', title: `${SEO_TITLE} | CombatStay`, description: DESCRIPTION },
}

const FAQ_ITEMS = [
  {
    q: `Is Hua Hin good for Muay Thai training?`,
    a: `Yes—especially for long stays if you want a calmer routine than Bangkok or Phuket. Choose accommodation for sleep and a gym you can commute to consistently for 2–6 weeks.`,
  },
  {
    q: `How are gyms ranked on this Hua Hin page?`,
    a: `We filter for verified/trusted CombatStay listings that match the Hua Hin city filter and list Muay Thai, then rank primarily by review score and review volume.`,
  },
  {
    q: `How long should I stay in Hua Hin to improve?`,
    a: `Most people feel meaningful improvement with 2–4 weeks of consistent training and recovery. Longer stays work best when you keep intensity sustainable and prioritize sleep.`,
  },
  {
    q: `Is Hua Hin beginner-friendly?`,
    a: `Often yes, but it depends on the gym. Read each profile for fundamentals blocks, class structure, coach ratios, and sparring policy so you can ramp up safely.`,
  },
  {
    q: `How much do Muay Thai gyms in Hua Hin cost?`,
    a: `Prices vary by gym and package type (training-only vs bundles). Use this ranked shortlist, then confirm current rates and inclusions on each gym page before you commit to a month.`,
  },
  {
    q: `Can I train twice per day in Hua Hin?`,
    a: `Many people can, but ramp up gradually. Start with one daily session for a few days, then add a second session when sleep and soreness are stable. Treat sparring as optional unless your coach recommends it.`,
  },
  {
    q: `What should I pack for a 2–4 week Muay Thai stay?`,
    a: `Wraps, mouthguard, lightweight training clothes, blister/tape basics, and hydration support. Many travelers buy gloves/shin guards locally to avoid luggage weight—confirm gym rules on the listing.`,
  },
  {
    q: `Does the ranking include every Muay Thai gym in Hua Hin?`,
    a: `No. This list only includes verified/trusted CombatStay listings that match the Hua Hin city filter and list Muay Thai. If a famous gym is missing, it may not have a live listing yet.`,
  },
]

const EDITORIAL: Array<{ title: string; body: ReactNode }> = [
  { title: `Top ${CITY} picks`, body: <p>Highest review momentum inside the {CITY} filter. Compare schedule fit and class structure—not only the rank number.</p> },
  { title: `Strong alternatives`, body: <p>Still verified/trusted listings—differences are often review history and availability.</p> },
  { title: `Mid-list options`, body: <p>Good when you need specific dates, budget fit, or a quieter environment.</p> },
  { title: `More gyms`, body: <p>Expand your shortlist beyond what old forum threads repeat.</p> },
  { title: `Final ranked slots`, body: <p>Completes the ranked list so you can compare more options.</p> },
]

export default async function BestMuayThaiGymsHuaHinPage() {
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
      subtitle={`${CITY} is a strong long-stay pick if you want a calmer base. Use this ranked guide to compare verified camps, then choose the schedule you’ll actually follow.`}
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
        imageAlt="Hua Hin Thailand coastline"
        priority
        overlayText="Hua Hin Muay Thai camps ranked from verified listings—compare schedules, prices, and reviews, then book the right fit."
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
        statDescription={`Verified/trusted Muay Thai camps matching ${CITY} on CombatStay.`}
        statIcon={<Waves className="h-5 w-5" />}
      />

      <section id="why" className="mb-14 scroll-mt-24">
        <GuideAccentIntro icon={MapPin} title={`Why train Muay Thai in ${CITY}?`} subtitle="Calmer routine, consistent weeks" />
        <div className="prose prose-gray max-w-none space-y-4 text-base leading-relaxed text-gray-800 md:prose-lg">
          <p>
            Searchers looking for <strong>best Muay Thai gyms in {CITY}</strong> often want a stable daily rhythm: train,
            recover, sleep, repeat. That’s where {CITY} can shine compared to higher-distraction hubs—if you choose a gym you
            can reach consistently.
          </p>
          <p>
            This page ranks only verified/trusted listings that match our {CITY} filter and list Muay Thai, so you can
            compare apples to apples.
          </p>
        </div>
      </section>

      <GuideSection id="plan" variant="slate" className="mb-14">
        <h2 className="mb-6 text-2xl font-bold text-gray-900 md:text-3xl">Plan a {CITY} training stay that actually works</h2>
        <GuideThreeCards
          items={[
            { title: 'Consistency', body: 'For 2–6 week stays, the biggest lever is simply showing up. Choose commute + schedule you can repeat.' },
            { title: 'Recovery', body: 'Heat and pad rounds add up. Hydration, food, and sleep determine whether you can train again tomorrow.' },
            { title: 'Beginner ramp', body: 'Start with one session/day for a few days. Add volume only when soreness and sleep stabilize.' },
          ]}
        />
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">Common mistakes</h3>
            <ul className="mt-3 space-y-2 text-sm text-gray-700">
              <li>
                <strong>Overtraining early:</strong> you get injured before you adapt.
              </li>
              <li>
                <strong>Ignoring commute:</strong> travel time kills two-a-days.
              </li>
              <li>
                <strong>Not sleeping:</strong> technique doesn’t stick when you’re exhausted.
              </li>
            </ul>
          </div>
          <figure className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="relative aspect-[4/3] w-full">
              <Image
                src="https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?auto=format&fit=crop&w=1400&q=80"
                alt="Training gloves and gym gear"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 520px"
              />
            </div>
            <figcaption className="px-4 py-3 text-xs text-gray-600">
              Progress comes from repeatable weeks, not the hardest single day.
            </figcaption>
          </figure>
        </div>
      </GuideSection>

      <GuideSection id="week-template" variant="slate" className="mb-14">
        <h2 className="mb-4 text-2xl font-bold text-gray-900 md:text-3xl">A realistic 7‑day Hua Hin training template</h2>
        <p className="mb-6 max-w-3xl text-gray-700">
          This is a practical routine that keeps people training longer (and ranking pages tend to perform better when they
          actually help readers plan).
        </p>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">If you’re new (week 1)</h3>
            <ul className="mt-3 space-y-2 text-sm text-gray-700">
              <li>
                <strong>Mon–Fri:</strong> 1 session/day + easy walk or mobility, early sleep.
              </li>
              <li>
                <strong>Sat:</strong> technique + light conditioning (optional), laundry/errands.
              </li>
              <li>
                <strong>Sun:</strong> full rest (or easy swim/walk).
              </li>
            </ul>
            <p className="mt-3 text-sm text-gray-600">
              Your goal is consistency. Add intensity only when your body adapts.
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">If you’re experienced (week 2+)</h3>
            <ul className="mt-3 space-y-2 text-sm text-gray-700">
              <li>
                <strong>4–6 hard days/week:</strong> 1–2 sessions/day depending on recovery.
              </li>
              <li>
                <strong>1 true rest day:</strong> protect joints and sleep so volume compounds.
              </li>
              <li>
                <strong>Sparring:</strong> keep it controlled; technical rounds beat ego rounds.
              </li>
            </ul>
            <p className="mt-3 text-sm text-gray-600">
              Two-a-days work when you treat sleep, food, and hydration like training variables.
            </p>
          </div>
        </div>
      </GuideSection>

      <GuideSection id="budget" variant="default" className="mb-14 border border-gray-200 bg-white">
        <div className="grid gap-8 md:grid-cols-2 md:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#003580]">Budget & packing</p>
            <h2 className="mt-2 text-2xl font-bold text-gray-900 md:text-3xl">Costs aren’t just gym fees</h2>
            <div className="mt-3 space-y-3 text-base leading-relaxed text-gray-700">
              <p>
                When people search “best Muay Thai gyms {CITY},” they’re usually comparing more than training. For longer stays,
                your real cost is <strong>gym + accommodation + food + transport + recovery</strong>.
              </p>
              <p>
                Use the ranked list as your shortlist, then open each profile to confirm package inclusions (private sessions,
                accommodation, meals, airport pickup) so you can compare total value—not just rank order.
              </p>
            </div>
          </div>
          <figure className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="relative aspect-[4/3] w-full">
              <Image
                src="https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1400&q=80"
                alt="Training gear laid out for a longer stay"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 520px"
              />
            </div>
            <figcaption className="px-4 py-3 text-xs text-gray-600">
              For long stays, pack for consistency: wraps, mouthguard, and recovery basics.
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
        title="Ready to pick your Hua Hin Muay Thai camp?"
        subtitle="Compare verified Hua Hin camps — live prices, real reviews, flexible dates — and book directly."
        href="/search?country=Thailand&location=Hua%20Hin&discipline=Muay%20Thai"
        buttonLabel="Find your Hua Hin camp"
      />



      <RelatedGuides
        guides={[
          { title: '25 best Muay Thai camps in Thailand (2026)', href: '/blog/best-muay-thai-camps-thailand-2026' },
          { title: 'Best Muay Thai gyms in Bangkok', href: '/blog/best-muay-thai-gyms-bangkok' },
          { title: 'Best Muay Thai gyms in Pattaya', href: '/blog/best-muay-thai-gyms-pattaya' },
          { title: 'Thailand training visa / DTV', href: '/blog/thailand-training-visa-dtv' },
        ]}
      />
    </ArticleShell>
  )
}

