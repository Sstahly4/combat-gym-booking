import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { ArticleShell } from '@/components/guides/article-shell'
import { RelatedGuides } from '@/components/guides/related-guides'
import {
  GuideAccentIntro,
  GuideCtaStrip,
  GuideFaqList,
  GuideFeatureGrid,
  GuideHero,
  GuideLeadRow,
  GuideSection,
  GuideThreeCards,
} from '@/components/guides/guide-page-blocks'
import { GuideLogisticsBlocks } from '@/components/guides/guide-logistics-blocks'
import { buildArticleLd, buildBreadcrumbLd, buildFaqLd } from '@/lib/seo/guide-schema'
import { Check, Shield, Sparkles, Backpack, FileText, MapPin, Clock } from 'lucide-react'

const TITLE = 'The Ultimate Guide to Combat Sports Travel in Thailand (2026)'
const SEO_TITLE = 'Combat Sports Travel Thailand 2026 [Visa, Gear, Gym Selection]'
const PATH = '/blog/combat-sports-travel-guide-thailand-2026'
const DATE_PUBLISHED = '2026-05-08'
const DATE_MODIFIED = '2026-05-08'
const HERO_IMAGE =
  'https://images.unsplash.com/photo-1517832207067-4db24a2ae47c?auto=format&fit=crop&w=1400&q=80'
const DESCRIPTION =
  'A 2026, outcome-driven guide to combat sports travel in Thailand: choosing a gym, planning visas, packing, recovery, and how to avoid common trip mistakes.'

export const metadata: Metadata = {
  title: `${SEO_TITLE} | CombatStay`,
  description: DESCRIPTION,
  alternates: { canonical: PATH },
  openGraph: { title: `${SEO_TITLE} | CombatStay`, description: DESCRIPTION, type: 'article' },
  twitter: { card: 'summary_large_image', title: `${SEO_TITLE} | CombatStay`, description: DESCRIPTION },
}

const FAQ_ITEMS = [
  {
    q: 'How long should I stay to get real progress?',
    a: 'Most travelers feel meaningful progress after 2–4 weeks of consistent training with enough sleep and recovery. One week is great for experience; longer stays are where repetition compounds.',
  },
  {
    q: 'Do I need a “Muay Thai visa” or ED visa to train?',
    a: 'There is no single global “Muay Thai visa.” Visa needs depend on nationality and stay length. For longer stays, use official sources and start with our training visa overview and ED visa alternatives.',
  },
  {
    q: 'What’s the best city base for training (Bangkok vs Phuket vs Chiang Mai)?',
    a: 'Bangkok maximizes convenience and fight-scene density, Phuket blends beaches with serious training, and Chiang Mai suits a slower pace and cooler mornings. There is no universal best—optimize for the routine you can maintain.',
  },
  {
    q: 'What is the biggest mistake travelers make?',
    a: 'Overloading volume immediately. Two-a-days plus tours plus heat equals burnout. Build a repeatable week, then increase training only when sleep and soreness stabilize.',
  },
  {
    q: 'What does CombatStay mean by verified/trusted listings?',
    a: 'Guides prioritize live CombatStay listings with verification signals. It helps avoid stale, scraped “top 7” lists that never update.',
  },
]

export default function CombatSportsTravelGuideThailand2026Page() {
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
    { name: TITLE, path: PATH },
  ])

  return (
    <ArticleShell
      title={TITLE}
      subtitle="Visa, gear, recovery, and gym selection—built for high-intent travelers who want outcomes, not generic “cheap training” fluff."
      breadcrumbs={[{ label: 'Training Guides', href: '/blog' }]}
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      <GuideHero
        imageSrc={HERO_IMAGE}
        imageAlt="Training gloves and gym scene"
        priority
        overlayText="Combat sports travel is a logistics problem. Solve visas, recovery, and routine first—then “best gym” becomes obvious."
      />

      <GuideLeadRow
        tocItems={[
          { href: '#blueprint', label: 'The blueprint' },
          { href: '#choose', label: 'Choose a gym' },
          { href: '#cities', label: 'Pick a city base' },
          { href: '#week-plan', label: 'Build a repeatable week' },
          { href: '#logistics', label: 'Recovery & legality' },
          { href: '#packing', label: 'Packing' },
          { href: '#mistakes', label: 'Avoid these mistakes' },
          { href: '#faq', label: 'FAQ' },
        ]}
        statValue="2026"
        statDescription="Planning framework + internal links to specialist guides."
        statIcon={<Sparkles className="h-5 w-5" />}
      />

      <GuideSection id="blueprint" variant="slate" className="mb-14">
        <GuideAccentIntro title="The 2026 fighter’s blueprint (in 10 minutes)" subtitle="Plan like an athlete, not a tourist" />
        <GuideThreeCards
          items={[
            {
              title: 'Routine > hype',
              body: 'Pick a gym you can attend consistently. Commute and sleep determine outcomes more than brand name.',
            },
            {
              title: 'Recovery is a feature',
              body: 'Ice bath, sauna, physio, massage, mobility space—these are not luxuries when training twice a day.',
            },
            {
              title: 'Legality is part of training',
              body: 'If you’re staying longer, visa planning is the first constraint. Start early and use official sources.',
            },
          ]}
        />
        <div className="mt-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#003580]">Quick links</p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <Link href="/blog/best-muay-thai-camps-thailand-2026" className="font-medium text-[#003580] underline">
              25 best Muay Thai camps in Thailand (2026)
            </Link>
            <Link href="/blog/thailand-training-visa-dtv" className="font-medium text-[#003580] underline">
              Thailand training visa / DTV guide
            </Link>
            <Link href="/blog/ed-visa-martial-arts-training-thailand" className="font-medium text-[#003580] underline">
              ED visa for martial arts training (alternatives)
            </Link>
            <Link href="/blog/packing-list-combat-sports-camp-thailand" className="font-medium text-[#003580] underline">
              Packing list for a combat sports camp
            </Link>
          </div>
        </div>
      </GuideSection>

      <section id="choose" className="mb-14 scroll-mt-24">
        <GuideAccentIntro icon={Shield} title="How to choose a gym (what matters for outcomes)" subtitle="Use signals, not adjectives" />
        <GuideFeatureGrid
          items={[
            { icon: <Check className="h-5 w-5 text-green-600" aria-hidden />, title: 'Schedule clarity', text: 'Do they publish a real timetable and class types?' },
            { icon: <Check className="h-5 w-5 text-green-600" aria-hidden />, title: 'Recovery signals', text: 'Ice bath/sauna/physio/massage listed as amenities (structured, not vague copy).' },
            { icon: <Check className="h-5 w-5 text-green-600" aria-hidden />, title: 'Beginner vs fighter lanes', text: 'Do you know where you fit on day one?' },
            { icon: <Check className="h-5 w-5 text-green-600" aria-hidden />, title: 'Accommodation reality', text: 'On-site housing saves commute and increases attendance.' },
          ]}
        />
        <div className="mt-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#003580]">Info gain (what most lists never say)</p>
          <p className="mt-2 text-sm leading-relaxed text-gray-700">
            If you’re comparing two “top” camps, the deciding variables are usually not price or hype — they’re repeatability
            signals. In 2026, the strongest predictors of progress are <strong>attendance</strong>, <strong>sleep</strong>, and a
            training load you can sustain without injury.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-gray-700">
            CombatStay listings already expose structured amenities (recovery, housing, visa guidance). Next, we’ll layer in
            higher-moat metrics like coach ratio and sparring culture as gyms verify them.
          </p>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <figure className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="relative aspect-[4/3] w-full">
              <Image
                src="https://images.unsplash.com/photo-1521412644187-c49fa049e84d?auto=format&fit=crop&w=1400&q=80"
                alt="Training gear packed for a long stay"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 520px"
              />
            </div>
            <figcaption className="px-4 py-3 text-xs text-gray-600">If you can show up daily, you win. Plan for attendance.</figcaption>
          </figure>
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#003580]">Fast action</p>
            <h3 className="mt-2 text-lg font-semibold text-gray-900">Browse live listings instead of reading 10 blogs</h3>
            <p className="mt-2 text-sm text-gray-700">
              Use search to filter by country, city, discipline, and amenities—then open profiles to confirm schedules and booking details.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href="/search?country=Thailand"
                className="inline-flex items-center rounded-lg bg-[#003580] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#003580]/90"
              >
                Browse Thailand gyms
              </Link>
              <Link href="/blog" className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-900 hover:bg-gray-50">
                Training guides hub
              </Link>
            </div>
          </div>
        </div>
      </section>

      <GuideSection id="cities" variant="slate" className="mb-14">
        <GuideAccentIntro icon={MapPin} title="Pick a city base (and stop switching mid-trip)" subtitle="City choice is a recovery decision" />
        <GuideThreeCards
          items={[
            {
              title: 'Bangkok',
              body: (
                <p>
                  Convenience + fight-scene density. Great if you want stadium culture and short commutes via BTS/MRT—less great if traffic becomes your “third session.”
                </p>
              ),
            },
            {
              title: 'Phuket',
              body: (
                <p>
                  Beach lifestyle with serious gyms. Seasonality affects crowding and cost. If you’re doing two-a-days, prioritize housing proximity or you’ll burn hours.
                </p>
              ),
            },
            {
              title: 'Chiang Mai',
              body: (
                <p>
                  Slower pace + cooler mornings. Often a strong long-stay base if you want consistency and fewer distractions.
                </p>
              ),
            },
          ]}
        />
        <p className="mt-8 text-center text-sm text-gray-700">
          Shortcut city rankings:{' '}
          <Link href="/blog/best-muay-thai-gyms-bangkok" className="font-semibold text-[#003580] underline">
            Bangkok
          </Link>
          ,{' '}
          <Link href="/blog/best-muay-thai-gyms-phuket" className="font-semibold text-[#003580] underline">
            Phuket
          </Link>
          ,{' '}
          <Link href="/blog/best-muay-thai-gyms-chiang-mai" className="font-semibold text-[#003580] underline">
            Chiang Mai
          </Link>
          .
        </p>
      </GuideSection>

      <GuideSection id="week-plan" variant="default" className="mb-14 border border-gray-200 bg-white">
        <GuideAccentIntro icon={Clock} title="Build a repeatable week (the “anti-burnout” template)" subtitle="If you can repeat it, you can improve" />
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">Week 1 (adaptation)</h3>
            <ul className="mt-3 space-y-2 text-sm text-gray-700">
              <li>
                <strong>Days 1–3:</strong> 1 session/day + mobility + early sleep.
              </li>
              <li>
                <strong>Days 4–6:</strong> add a second session only if sleep/soreness stabilize.
              </li>
              <li>
                <strong>Day 7:</strong> full rest (tours count as training load).
              </li>
            </ul>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">Weeks 2–4 (progress)</h3>
            <ul className="mt-3 space-y-2 text-sm text-gray-700">
              <li>
                <strong>Hard / easy alternation:</strong> don’t stack max intensity daily.
              </li>
              <li>
                <strong>Recovery budget:</strong> sleep + food + (optional) massage/physio.
              </li>
              <li>
                <strong>Consistency goal:</strong> 5–6 training days/week you can repeat.
              </li>
            </ul>
          </div>
        </div>
        <p className="mt-6 text-sm text-gray-700">
          If you’re comparing trip lengths, use{' '}
          <Link href="/blog/muay-thai-camp-1-week-vs-1-month" className="font-semibold text-[#003580] underline">
            1-week vs 1-month camps
          </Link>{' '}
          to set realistic expectations.
        </p>
      </GuideSection>

      <GuideSection id="logistics" variant="default" className="mb-14 border border-gray-200 bg-white">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#003580]">Semantic gap coverage</p>
        <h2 className="mt-2 text-2xl font-bold text-gray-900 md:text-3xl">Recovery &amp; legality (the “hidden” trip constraints)</h2>
        <p className="mt-3 max-w-3xl text-base leading-relaxed text-gray-700">
          Most competitor posts ignore the entities that decide whether your trip works: visa planning and recovery infrastructure.
        </p>
        <GuideLogisticsBlocks cityLabel="Thailand" />
      </GuideSection>

      <GuideSection id="packing" variant="slate" className="mb-14">
        <GuideAccentIntro icon={Backpack} title="Packing: what to bring vs buy in Thailand" subtitle="Avoid luggage weight traps" />
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">Bring these</h3>
            <ul className="mt-3 space-y-2 text-sm text-gray-700">
              <li><strong>Mouthguard</strong> (harder to replace quickly).</li>
              <li><strong>Hand wraps</strong> you like + tape/blister care.</li>
              <li><strong>Quick-dry training gear</strong> (2–4 sets is enough with laundry).</li>
              <li><strong>Electrolytes</strong> if you have a preferred brand.</li>
            </ul>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">Often buy there</h3>
            <ul className="mt-3 space-y-2 text-sm text-gray-700">
              <li><strong>Gloves / shin guards</strong> (saves luggage; many gyms sell gear).</li>
              <li><strong>Extra shorts / tops</strong> (cheap locally).</li>
              <li><strong>Basic recovery tools</strong> (lacrosse ball, bands).</li>
            </ul>
          </div>
        </div>
        <p className="mt-6 text-sm text-gray-700">
          For the full checklist, use{' '}
          <Link href="/blog/packing-list-combat-sports-camp-thailand" className="font-medium text-[#003580] underline">
            the CombatStay Thailand packing list
          </Link>
          .
        </p>
      </GuideSection>

      <GuideSection id="mistakes" variant="amber" className="mb-14">
        <GuideAccentIntro icon={FileText} title="Don’t get burned: the 4 mistakes that wreck trips" subtitle="Read this before you pay" />
        <div className="grid gap-4 md:grid-cols-2">
          {[
            { t: 'Booking the gym before the routine', d: 'Pick the city area and commute first. Two-a-days collapse when logistics are painful.' },
            { t: 'Overtraining week one', d: 'Start at 1 session/day. Add volume only when sleep and soreness stabilize.' },
            { t: 'Ignoring recovery entities', d: 'Ice bath/sauna/physio/massage aren’t fluff when training is high volume.' },
            { t: 'Treating visa help as guaranteed', d: 'Use official sources. Gyms may offer guidance but can’t override immigration rules.' },
          ].map((x) => (
            <div key={x.t} className="rounded-xl border border-amber-200/70 bg-white/90 p-5 shadow-sm">
              <p className="text-sm font-semibold text-gray-900">{x.t}</p>
              <p className="mt-2 text-sm text-gray-700 leading-relaxed">{x.d}</p>
            </div>
          ))}
        </div>
      </GuideSection>

      <GuideCtaStrip
        title="Ready to plan a Thailand training trip?"
        subtitle="Browse live listings, shortlist by reviews, then filter by amenities and dates."
        href="/search?country=Thailand"
        buttonLabel="Browse Thailand gyms"
      />

      <GuideSection id="faq" variant="default" className="mb-14 border border-gray-200 bg-white p-6 md:p-8">
        <h2 className="mb-2 text-2xl font-bold text-gray-900 md:text-3xl">FAQ</h2>
        <p className="mb-8 text-gray-600">Trip planning questions that show up in search.</p>
        <GuideFaqList items={FAQ_ITEMS} />
      </GuideSection>

      <RelatedGuides
        guides={[
          { title: '25 best Muay Thai camps in Thailand (2026)', href: '/blog/best-muay-thai-camps-thailand-2026' },
          { title: 'Thailand training visa / DTV guide', href: '/blog/thailand-training-visa-dtv' },
          { title: 'Visas for martial arts training (ED visa + alternatives)', href: '/blog/ed-visa-martial-arts-training-thailand' },
          { title: 'Packing list for a combat sports camp in Thailand', href: '/blog/packing-list-combat-sports-camp-thailand' },
        ]}
      />
    </ArticleShell>
  )
}

