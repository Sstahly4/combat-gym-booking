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
import { Anchor, MapPin, Sun } from 'lucide-react'

const CITY = 'Krabi'
const TITLE = `Best Muay Thai Gyms in ${CITY} (2026)`
const SEO_TITLE = `Best Muay Thai Gyms in ${CITY} 2026 [Prices + Reviews]`
const PATH = '/blog/best-muay-thai-gyms-krabi'
const DATE_PUBLISHED = '2025-10-15'
const DATE_MODIFIED = '2026-04-20'
const HERO_IMAGE = 'https://images.unsplash.com/photo-1549973890-38b8d7b51b2a?auto=format&fit=crop&w=1400&q=80'
const DESCRIPTION =
  'Ranked Muay Thai camps in Krabi, Thailand: verified listings, prices, photos, reviews, and long-stay planning tips for training near Ao Nang and the limestone coast.'

export const metadata: Metadata = {
  title: `${SEO_TITLE} | Combatbooking`,
  description: DESCRIPTION,
  alternates: { canonical: PATH },
  openGraph: { title: `${SEO_TITLE} | Combatbooking`, description: DESCRIPTION, type: 'article' },
  twitter: { card: 'summary_large_image', title: `${SEO_TITLE} | Combatbooking`, description: DESCRIPTION },
}

const FAQ_ITEMS = [
  {
    q: `Is Krabi good for Muay Thai training?`,
    a: `Yes—Krabi can be great for training + recovery if you want beach access and a calmer base than Phuket. Choose a camp you can reach consistently and don’t underestimate humidity.`,
  },
  {
    q: `Ao Nang vs Krabi Town—what is better for training?`,
    a: `It depends on your routine. Ao Nang often suits travelers who want walkable food and beaches; Krabi Town can be quieter. Pick based on commute to your chosen gym.`,
  },
  {
    q: `How are these gyms ranked?`,
    a: `We filter for verified/trusted listings that match the Krabi city filter and list Muay Thai, then rank primarily by review score and review volume.`,
  },
  {
    q: `When is the best season to train in Krabi?`,
    a: `It depends on heat, rainfall, and crowds. Check official weather patterns and plan recovery—humidity affects training load as much as session count.`,
  },
  {
    q: `Is Krabi beginner-friendly for Muay Thai?`,
    a: `Often yes, but it depends on the gym. Check profiles for fundamentals blocks, coach ratios, and sparring policy so you can ramp up safely.`,
  },
  {
    q: `How much does Muay Thai training cost in Krabi?`,
    a: `Pricing varies by gym and whether you buy training-only or a bundle. Use the ranked list to shortlist, then confirm current rates and inclusions on each gym page.`,
  },
  {
    q: `Can I train and still do island tours in Krabi?`,
    a: `Yes—plan your week. Treat tours like training load: keep one recovery day and don’t stack the hardest sessions with the longest boat days.`,
  },
  {
    q: `Does this list include every Muay Thai gym in Krabi?`,
    a: `No. This guide includes verified/trusted CombatBooking listings that match the Krabi city filter and list Muay Thai. If a gym is missing, it may not have a live listing yet.`,
  },
]

const EDITORIAL: Array<{ title: string; body: ReactNode }> = [
  { title: `Top ${CITY} picks`, body: <p>Highest review momentum inside the Krabi filter. Compare class structure and schedule fit.</p> },
  { title: `Strong alternatives`, body: <p>Still verified listings—differences are often review recency and availability.</p> },
  { title: `Mid-list options`, body: <p>Useful when you prioritize dates, budget, or a specific area.</p> },
  { title: `More gyms`, body: <p>Widen your shortlist beyond old blog roundups.</p> },
  { title: `Final ranked slots`, body: <p>Completes a deeper ranked list so you can compare more options.</p> },
]

export default async function BestMuayThaiGymsKrabiPage() {
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
      subtitle={`${CITY} pairs training with recovery: beach access, quieter routines, and a strong long-stay vibe—if you choose a gym you can actually attend consistently.`}
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
        imageAlt="Krabi Thailand limestone cliffs and beach"
        priority
        overlayText="Krabi Muay Thai camps ranked from verified listings—compare schedules, prices, and reviews, then book the right fit."
      />

      <GuideLeadRow
        tocItems={[
          { href: '#why', label: `Why ${CITY}` },
          { href: '#plan', label: 'Plan your stay' },
          { href: '#week-template', label: 'Week template' },
          { href: '#where-to-stay', label: 'Where to stay' },
          { href: '#ranked', label: 'Ranked gyms' },
          { href: '#faq', label: 'FAQ' },
        ]}
        statValue={gyms.length}
        statDescription={`Verified/trusted Muay Thai camps matching ${CITY} on CombatBooking.`}
        statIcon={<Sun className="h-5 w-5" />}
      />

      <section id="why" className="mb-14 scroll-mt-24">
        <GuideAccentIntro icon={Anchor} title={`Why train Muay Thai in ${CITY}?`} subtitle="Beach recovery + calmer weeks" />
        <div className="prose prose-gray max-w-none space-y-4 text-base leading-relaxed text-gray-800 md:prose-lg">
          <p>
            People searching <strong>best Muay Thai gyms in {CITY}</strong> often want training that still leaves room for
            recovery. Krabi’s pace can support that—if you don’t overload your schedule on day one.
          </p>
          <p>
            This page only includes verified/trusted listings that match our {CITY} filter and list Muay Thai. Rankings follow
            the same review-first approach as our other guides.
          </p>
        </div>
      </section>

      <GuideSection id="plan" variant="slate" className="mb-14">
        <h2 className="mb-6 text-2xl font-bold text-gray-900 md:text-3xl">Plan a Krabi training stay that actually works</h2>
        <GuideThreeCards
          items={[
            { title: 'Humidity is real', body: 'In coastal heat, recovery and hydration determine whether you can train again tomorrow.' },
            { title: 'Commute matters', body: 'Choose accommodation based on gym proximity. Two-a-days fail when the commute is a grind.' },
            { title: 'Beginner ramp', body: 'Start with one session/day for a few days. Add volume only when sleep and soreness stabilize.' },
          ]}
        />
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">Common mistakes</h3>
            <ul className="mt-3 space-y-2 text-sm text-gray-700">
              <li>
                <strong>Stacking tours + two-a-days:</strong> your joints and sleep collapse.
              </li>
              <li>
                <strong>Not eating enough:</strong> volume requires calories.
              </li>
              <li>
                <strong>Choosing by hype:</strong> pick the gym you’ll attend consistently.
              </li>
            </ul>
          </div>
          <figure className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="relative aspect-[4/3] w-full">
              <Image
                src="https://images.unsplash.com/photo-1526772662000-3f88f10405ff?auto=format&fit=crop&w=1400&q=80"
                alt="Tropical sea and storm clouds"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 520px"
              />
            </div>
            <figcaption className="px-4 py-3 text-xs text-gray-600">
              Plan recovery like training—Krabi heat changes how much volume you can sustain.
            </figcaption>
          </figure>
        </div>
      </GuideSection>

      <GuideSection id="week-template" variant="slate" className="mb-14">
        <h2 className="mb-4 text-2xl font-bold text-gray-900 md:text-3xl">A realistic 7‑day Krabi training template</h2>
        <p className="mb-6 max-w-3xl text-gray-700">
          Krabi trips go best when you commit to a routine. Use this as a baseline and adjust based on your experience level.
        </p>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">Beginner-friendly week</h3>
            <ul className="mt-3 space-y-2 text-sm text-gray-700">
              <li>
                <strong>Mon–Fri:</strong> 1 session/day + mobility; early sleep.
              </li>
              <li>
                <strong>Sat:</strong> technique + light conditioning; errands/laundry.
              </li>
              <li>
                <strong>Sun:</strong> full rest (or an easy walk/swim).
              </li>
            </ul>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">Long-stay week (2–6 weeks)</h3>
            <ul className="mt-3 space-y-2 text-sm text-gray-700">
              <li>
                <strong>4–6 training days:</strong> 1–2 sessions/day based on recovery.
              </li>
              <li>
                <strong>1 recovery day:</strong> protect joints; hydration is mandatory.
              </li>
              <li>
                <strong>Tour day:</strong> treat it like load—don’t combine with max sparring.
              </li>
            </ul>
          </div>
        </div>
      </GuideSection>

      <GuideSection id="where-to-stay" variant="default" className="mb-14 border border-gray-200 bg-white">
        <div className="grid gap-8 md:grid-cols-2 md:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#003580]">Where to stay</p>
            <h2 className="mt-2 text-2xl font-bold text-gray-900 md:text-3xl">Ao Nang vs Krabi Town (the real tradeoff)</h2>
            <div className="mt-3 space-y-3 text-base leading-relaxed text-gray-700">
              <p>
                For long stays, your accommodation choice determines your sleep and commute—two variables that control how much
                training you can sustain.
              </p>
              <p>
                Ao Nang can be convenient for walkable food and beach recovery. Krabi Town can feel quieter. The “best” area
                is the one that keeps you consistent for weeks.
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
                <p className="mt-1 text-xs text-gray-600">Check rainfall/heat before long bookings.</p>
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
                src="https://images.unsplash.com/photo-1549973890-38b8d7b51b2a?auto=format&fit=crop&w=1400&q=80"
                alt="Krabi limestone cliffs and coastline"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 520px"
              />
            </div>
            <figcaption className="px-4 py-3 text-xs text-gray-600">
              If you’re staying 3–6 weeks, pick accommodation for recovery first.
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
        title="Ready to pick your Krabi Muay Thai camp?"
        subtitle="Filter verified Krabi gyms by dates, price, and amenities — book directly on Combatbooking."
        href="/search?country=Thailand&location=Krabi&discipline=Muay%20Thai"
        buttonLabel="Find your Krabi camp"
      />



      <RelatedGuides
        guides={[
          { title: 'Best Muay Thai gyms in Phuket', href: '/blog/best-muay-thai-gyms-phuket' },
          { title: '25 best Muay Thai camps in Thailand (2026)', href: '/blog/best-muay-thai-camps-thailand-2026' },
          { title: 'Thailand training visa / DTV', href: '/blog/thailand-training-visa-dtv' },
          { title: 'Training guides hub', href: '/blog' },
        ]}
      />
    </ArticleShell>
  )
}

