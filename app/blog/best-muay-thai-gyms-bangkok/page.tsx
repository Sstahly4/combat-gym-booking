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
import { Building2, Sun } from 'lucide-react'

const CITY = 'Bangkok'
const TITLE = `Best Muay Thai Gyms in ${CITY} (2026)`
const SEO_TITLE = `Best Muay Thai Gyms in ${CITY} 2026 [Prices + Reviews]`
const PATH = '/blog/best-muay-thai-gyms-bangkok'
const DATE_PUBLISHED = '2025-10-15'
const DATE_MODIFIED = '2026-04-20'
const HERO_IMAGE = '/1296749132.jpg'
const DESCRIPTION = `Ranked Muay Thai camps in Bangkok: live prices, photos, reviews, and schedule snippets. Find the best gyms in Thailand’s capital.`

export const metadata: Metadata = {
  title: `${SEO_TITLE} | Combatbooking`,
  description: DESCRIPTION,
  alternates: { canonical: PATH },
  openGraph: { title: `${SEO_TITLE} | Combatbooking`, description: DESCRIPTION, type: 'article' },
  twitter: { card: 'summary_large_image', title: `${SEO_TITLE} | Combatbooking`, description: DESCRIPTION },
}

const FAQ_ITEMS = [
  {
    q: 'Is Bangkok good for beginners in Muay Thai?',
    a: 'Yes—many camps offer fundamentals classes and tourist-friendly schedules. Read each profile for beginner blocks, coach ratios, and whether sparring is optional.',
  },
  {
    q: 'How do I choose between camps in different neighborhoods?',
    a: 'Rank reflects reviews, not your commute. Factor in BTS/MRT access, heat, and how many sessions per day you will realistically attend.',
  },
  {
    q: 'Why is a gym missing from this Bangkok list?',
    a: 'It must be live on CombatBooking, list Muay Thai, and have a city field matching our Bangkok filter. Update the listing if the name is spelled differently.',
  },
  {
    q: 'What neighborhoods are best for Muay Thai in Bangkok?',
    a: 'The best neighborhood is the one that keeps your commute sustainable. Prioritize BTS/MRT access, food options, and sleep-friendly areas—then pick a gym whose schedule you can repeat for weeks.',
  },
  {
    q: 'How much do Muay Thai gyms in Bangkok cost?',
    a: 'Prices vary by gym and whether packages include private sessions or accommodation. Use the ranked list to shortlist, then confirm current pricing on each profile before booking.',
  },
  {
    q: 'Can I train Muay Thai in Bangkok and still explore the city?',
    a: 'Yes—plan your week. Many travelers train hard 4–6 days/week and keep one recovery/light sightseeing day so fatigue does not accumulate.',
  },
  {
    q: 'Can I realistically do two-a-days in Bangkok?',
    a: 'Yes, but only if commute and sleep are handled. Pick accommodation near your gym (or near BTS/MRT access), start with one session/day for a few days, then add a second session once recovery stabilizes.',
  },
  {
    q: 'What should I pack for Muay Thai training in Bangkok?',
    a: 'Wraps, mouthguard, lightweight training clothes, and blister/tape basics. Many travelers buy gloves/shin guards locally to avoid luggage weight—confirm gym rules on each listing.',
  },
]

const EDITORIAL: Array<{ title: string; body: ReactNode }> = [
  {
    title: 'Leading Bangkok picks',
    body: (
      <p>
        High review scores with enough volume to trust the average. Compare class times—Bangkok traffic makes “two sessions
        per day” harder than it sounds if you are far from the gym.
      </p>
    ),
  },
  {
    title: 'Strong alternatives',
    body: (
      <p>
        Same eligibility rules as the top band. Often the difference is recency of reviews or a hair-splitting rating gap.
        Read accommodation and package lines before deciding.
      </p>
    ),
  },
  {
    title: 'Mid-list',
    body: (
      <p>
        Useful when you need specific dates or a quieter room line. Cross-check distance from where you are staying—use map
        links on each gym page.
      </p>
    ),
  },
  {
    title: 'More options',
    body: (
      <p>
        Still verified Muay Thai gyms in the Bangkok filter. Pair this list with the{' '}
        <Link href="/blog/best-muay-thai-camps-thailand-2026" className="font-medium text-[#003580] underline">
          national top 25
        </Link>{' '}
        if you are open to training outside the city on part of your trip.
      </p>
    ),
  },
  {
    title: 'Final ranked slots',
    body: (
      <p>
        Completes a deep shortlist for capital-city training. Confirm current rates on the profile—Bangkok camps update
        packages frequently.
      </p>
    ),
  },
]

export default async function BestMuayThaiGymsBangkokPage() {
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
      subtitle="Bangkok’s density of Muay Thai gyms means you can optimize for schedule, neighborhood, and budget—if you read past the headline rank."
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
        imageAlt={`Muay Thai gyms in ${CITY}`}
        priority
        overlayText="Bangkok: maximum convenience, huge variety, and easy access to stadium shows—pick a camp that fits your commute and schedule, not only its rank."
      />

      <GuideLeadRow
        tocItems={[
          { href: '#why-bangkok', label: 'Why Bangkok' },
          { href: '#city-tips', label: 'City tips' },
          { href: '#week-template', label: 'Week template' },
          { href: '#budget', label: 'Budget & packing' },
          { href: '#ranked', label: 'Ranked gyms' },
          { href: '#faq', label: 'FAQ' },
        ]}
        statValue={gyms.length}
        statDescription={`Verified/trusted Muay Thai listings matching ${CITY} on CombatBooking.`}
        statIcon={<Sun className="h-5 w-5" />}
      />

      <GuideSection variant="slate" className="mb-14">
        <div className="grid gap-8 md:grid-cols-2 md:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#003580]">Bangkok logistics</p>
            <h2 className="mt-2 text-2xl font-bold text-gray-900 md:text-3xl">Pick a gym you’ll actually reach twice a day</h2>
            <p className="mt-3 text-base leading-relaxed text-gray-700">
              In Bangkok, the best camp for your results is often the one with a commute you can repeat for 2–6 weeks.
              Use this ranked list as a shortlist, then choose based on neighborhood fit and schedule.
            </p>
          </div>
          <figure className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="relative aspect-[4/3] w-full">
              <Image
                src="/1296749132.jpg"
                alt="Bangkok Muay Thai guide visual"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 520px"
              />
            </div>
            <figcaption className="px-4 py-3 text-xs text-gray-600">
              Pro tip: plan around heat + traffic, not just rank numbers.
            </figcaption>
          </figure>
        </div>
      </GuideSection>

      <section id="why-bangkok" className="mb-14 scroll-mt-24">
        <GuideAccentIntro icon={Building2} title="Why train Muay Thai in Bangkok?" subtitle="Capital advantages + tradeoffs" />
        <div className="prose prose-gray max-w-none space-y-4 text-base leading-relaxed text-gray-800 md:prose-lg">
          <p>
            Search demand for <strong>best Muay Thai gyms in Bangkok</strong> keeps growing because the city offers the
            easiest logistics in Thailand: transit, food, medical, and fight shows. The tradeoff is heat, traffic, and
            decision fatigue—there are many gyms, not all of them fit your routine.
          </p>
          <p>
            This ranking uses the same review-first methodology as our other guides, but filtered to gyms that match{' '}
            <strong>{CITY}</strong> in the city field and list <strong>Muay Thai</strong> in disciplines.
          </p>
        </div>
      </section>

      <GuideSection id="city-tips" variant="slate" className="mb-14">
        <h2 className="mb-6 text-2xl font-bold text-gray-900 md:text-3xl">Make Bangkok training sustainable</h2>
        <GuideThreeCards
          items={[
            {
              title: 'Commute reality',
              body: 'Two-a-days sound great until the Grab queue hits. Pick a camp you can reach consistently in rush hour if you plan double sessions.',
            },
            {
              title: 'Stadium nights',
              body: 'Watching fights can inspire your training—just protect sleep if you are stacking hard morning sessions.',
            },
            {
              title: 'Hydration & recovery',
              body: 'Urban heat plus pad work adds up. Budget time for food, massage, and rest—not only gym hours.',
            },
          ]}
        />
      </GuideSection>

      <GuideSection id="week-template" variant="slate" className="mb-14">
        <h2 className="mb-4 text-2xl font-bold text-gray-900 md:text-3xl">A realistic 7‑day Bangkok training template</h2>
        <p className="mb-6 max-w-3xl text-gray-700">
          Bangkok rewards routines. This template is designed for 2–6 week stays where you want progress without burnout.
        </p>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">Week 1 (adaptation)</h3>
            <ul className="mt-3 space-y-2 text-sm text-gray-700">
              <li>
                <strong>Mon–Fri:</strong> 1 session/day + mobility; early sleep.
              </li>
              <li>
                <strong>Sat:</strong> technique + errands/laundry.
              </li>
              <li>
                <strong>Sun:</strong> full rest (or easy walk).
              </li>
            </ul>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">Week 2+ (progress)</h3>
            <ul className="mt-3 space-y-2 text-sm text-gray-700">
              <li>
                <strong>4–6 hard days/week:</strong> 1–2 sessions/day based on recovery.
              </li>
              <li>
                <strong>1 true rest day:</strong> protect joints and sleep.
              </li>
              <li>
                <strong>Commute rule:</strong> if travel time is killing two-a-days, move accommodation—not gyms.
              </li>
            </ul>
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
                For longer stays, your real cost is <strong>gym + accommodation + transport + recovery</strong>. A slightly
                higher-priced gym can be better value if it saves commute time and improves consistency.
              </p>
              <p>
                Use this ranked list as a shortlist, then open each profile to confirm what’s included (privates, packages,
                accommodation) before you compare “price.”
              </p>
            </div>
          </div>
          <figure className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="relative aspect-[4/3] w-full">
              <Image
                src="https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1400&q=80"
                alt="Muay Thai gear packed for a long stay"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 520px"
              />
            </div>
            <figcaption className="px-4 py-3 text-xs text-gray-600">
              Pack wraps + mouthguard, then optimize routines. Consistency is the real advantage.
            </figcaption>
          </figure>
        </div>
      </GuideSection>
      <GuideSection variant="slate" className="mb-14">
        <div className="grid gap-8 md:grid-cols-2 md:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#003580]">City guide links</p>
            <h2 className="mt-2 text-2xl font-bold text-gray-900 md:text-3xl">Transit and planning resources</h2>
            <p className="mt-3 text-base leading-relaxed text-gray-700">
              If you’re picking a gym based on commute, bookmark transit resources so you can sanity-check travel times before
              committing to a month-long routine.
            </p>
            <div className="mt-6 grid gap-4">
              <a
                href="https://www.bts.co.th/eng/"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                <p className="text-sm font-semibold text-gray-900">BTS Skytrain (official)</p>
                <p className="mt-1 text-xs text-gray-600">Maps, lines, and service information.</p>
                <p className="mt-3 text-xs font-semibold text-[#003580]">Open →</p>
              </a>
              <a
                href="https://www.bangkokmetro.co.th/"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                <p className="text-sm font-semibold text-gray-900">MRT Bangkok (official)</p>
                <p className="mt-1 text-xs text-gray-600">Routes and updates for the metro system.</p>
                <p className="mt-3 text-xs font-semibold text-[#003580]">Open →</p>
              </a>
            </div>
          </div>
          <figure className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="relative aspect-[4/3] w-full">
              <Image
                src="https://images.unsplash.com/photo-1549693578-d683be217e58?auto=format&fit=crop&w=1400&q=80"
                alt="Bangkok skyline at sunset"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 520px"
              />
            </div>
            <figcaption className="px-4 py-3 text-xs text-gray-600">
              For long stays, commute time is a training variable—treat it like part of your program.
            </figcaption>
          </figure>
        </div>
      </GuideSection>

      <GuideCtaStrip
        title={`Search all ${CITY} Muay Thai camps`}
        subtitle="Filter price, packages, and more on the directory."
        href={`/search?country=Thailand&location=${encodeURIComponent(CITY)}&discipline=Muay%20Thai`}
        buttonLabel="Open Bangkok search"
      />

      <section id="ranked" className="mb-16 scroll-mt-24">
        <h2 className="mb-2 text-2xl font-bold text-gray-900 md:text-3xl">Ranked gyms</h2>
        <p className="mb-8 max-w-3xl text-gray-600">
          Long-form sections break up the grid every five camps so the page stays readable and keyword-rich.
        </p>
        {gyms.length === 0 ? (
          <GuideEmptyState
            title="No Bangkok Muay Thai gyms matched"
            description="Adjust search or ask owners to list with correct city + Muay Thai discipline."
            searchHref={`/search?country=Thailand&location=${encodeURIComponent(CITY)}&discipline=Muay%20Thai`}
            searchLabel="Search Bangkok"
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
        <p className="mb-8 text-gray-600">Bangkok-specific planning questions.</p>
        <GuideFaqList items={FAQ_ITEMS} />
      </GuideSection>
      <GuideCtaStrip
        title="Ready to pick your Bangkok Muay Thai camp?"
        subtitle="Filter verified Bangkok gyms by price, dates, and neighborhood — then book the one that fits your week."
        href="/search?country=Thailand&location=Bangkok&discipline=Muay%20Thai"
        buttonLabel="Find your Bangkok camp"
      />



      <RelatedGuides
        guides={[
          { title: '25 best Muay Thai camps (Thailand)', href: '/blog/best-muay-thai-camps-thailand-2026' },
          { title: 'Best Muay Thai gyms in Phuket', href: '/blog/best-muay-thai-gyms-phuket' },
          { title: 'Best Muay Thai gyms in Chiang Mai', href: '/blog/best-muay-thai-gyms-chiang-mai' },
          { title: 'Thailand visa / DTV guide', href: '/blog/thailand-training-visa-dtv' },
        ]}
      />
    </ArticleShell>
  )
}
