import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { ArticleShell } from '@/components/guides/article-shell'
import { RelatedGuides } from '@/components/guides/related-guides'
import { GuideLogisticsBlocks } from '@/components/guides/guide-logistics-blocks'
import { buildArticleLd, buildBreadcrumbLd, buildFaqLd } from '@/lib/seo/guide-schema'
import {
  GuideAccentIntro,
  GuideCtaStrip,
  GuideFaqList,
  GuideHero,
  GuideLeadRow,
  GuideSection,
  GuideThreeCards,
} from '@/components/guides/guide-page-blocks'
import { AlertTriangle, CheckCircle2, Shield, ClipboardList, MapPin, Dumbbell } from 'lucide-react'

const TITLE = "Don’t Get Burned: 4 Things to Check Before Booking a Thailand Training Trip"
const SEO_TITLE = 'Thailand Training Trip Checklist 2026 [Avoid These Mistakes]'
const PATH = '/blog/dont-get-burned-thailand-training-trip'
const DATE_PUBLISHED = '2026-05-08'
const DATE_MODIFIED = '2026-05-08'
const HERO_IMAGE =
  'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1400&q=80'
const DESCRIPTION =
  'A high-intent checklist for Thailand Muay Thai/BJJ/MMA travelers: what to verify before you pay, how to avoid burnout, and which logistics entities (visas, recovery) most blogs ignore.'

export const metadata: Metadata = {
  title: `${SEO_TITLE} | CombatStay`,
  description: DESCRIPTION,
  alternates: { canonical: PATH },
  openGraph: { title: `${SEO_TITLE} | CombatStay`, description: DESCRIPTION, type: 'article' },
  twitter: { card: 'summary_large_image', title: `${SEO_TITLE} | CombatStay`, description: DESCRIPTION },
}

const FAQ_ITEMS = [
  {
    q: 'Is training twice per day safe for beginners?',
    a: 'Sometimes, but don’t force it. Start with one session/day for a few days, prioritize sleep, and treat sparring as optional until you adapt.',
  },
  {
    q: 'What’s the fastest way to compare real options?',
    a: 'Use live listings and filters. Shortlist by reviews, then filter by amenities (recovery, accommodation) and dates.',
  },
  {
    q: 'Do gyms help with visas?',
    a: 'Some list “visa / stay guidance” as an amenity. Treat it as guidance, not a guarantee, and verify using official sources.',
  },
  {
    q: 'What should I ask a gym before paying?',
    a: 'Ask for a weekly timetable, class types (technique/sparring/clinch), beginner vs fighter lanes, and what recovery options exist on-site or nearby.',
  },
  {
    q: 'What should I do if a gym has no schedule listed?',
    a: 'Assume uncertainty. Ask for a weekly timetable, class types, and whether beginners have a fundamentals track.',
  },
]

export default function DontGetBurnedThailandTrainingTripPage() {
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
      subtitle="Most blogs sell vibes. This page checks the boring stuff that decides whether you can actually train for weeks."
      breadcrumbs={[{ label: 'Training Guides', href: '/blog' }]}
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      <GuideHero
        imageSrc={HERO_IMAGE}
        imageAlt="Training intensity and planning"
        priority
        overlayText="If you want progress, protect your routine. These four checks prevent the most common Thailand training-trip failures."
      />

      <GuideLeadRow
        tocItems={[
          { href: '#checklist', label: 'The 4 checks' },
          { href: '#questions', label: 'Questions to ask' },
          { href: '#logistics', label: 'Recovery & legality' },
          { href: '#week', label: 'A sustainable week' },
          { href: '#faq', label: 'FAQ' },
        ]}
        statValue="4"
        statDescription="High-impact checks before you pay."
        statIcon={<AlertTriangle className="h-5 w-5" />}
      />

      <section id="checklist" className="mb-14 scroll-mt-24">
        <GuideAccentIntro icon={Shield} title="The 4 checks (in priority order)" subtitle="Do these before booking" />
        <div className="grid gap-6 md:grid-cols-2">
          {[
            {
              t: 'Check #1: Commute reality',
              d: 'Two-a-days fail when commute is painful. Pick accommodation based on gym proximity, not a beach photo.',
            },
            {
              t: 'Check #2: Schedule clarity',
              d: 'Ask for a weekly timetable and class types (technique vs sparring vs clinch). Don’t assume.',
            },
            {
              t: 'Check #3: Recovery signals',
              d: 'Ice bath/sauna/physio/massage aren’t marketing fluff at high volume. If you want outcomes, prioritize recovery infrastructure.',
            },
            {
              t: 'Check #4: Legality planning',
              d: 'If you’re staying longer, visa planning sets your booking window. Start early and use official sources.',
            },
          ].map((x) => (
            <div key={x.t} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-gray-900">{x.t}</p>
              <p className="mt-2 text-sm text-gray-700 leading-relaxed">{x.d}</p>
              <p className="mt-4 text-xs text-gray-500">
                Shortcut: browse listings and use filters after you shortlist —{' '}
                <Link href="/search?country=Thailand" className="font-semibold text-[#003580] underline">
                  open Thailand search
                </Link>
                .
              </p>
            </div>
          ))}
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
              <MapPin className="h-4 w-4 text-[#003580]" aria-hidden /> Commute wins
            </div>
            <p className="mt-2 text-sm text-gray-700">
              A “better” gym you rarely attend loses to a “good” gym you attend 5–6 days/week.
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
              <Dumbbell className="h-4 w-4 text-[#003580]" aria-hidden /> Load management
            </div>
            <p className="mt-2 text-sm text-gray-700">
              Don’t stack the hardest sessions daily. Your joints decide your trip length, not motivation.
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
              <ClipboardList className="h-4 w-4 text-[#003580]" aria-hidden /> Verify entities
            </div>
            <p className="mt-2 text-sm text-gray-700">
              Recovery and visa guidance should be explicit — not “we can help with anything.”
            </p>
          </div>
        </div>
      </section>

      <GuideSection id="questions" variant="slate" className="mb-14">
        <GuideAccentIntro title="Questions to ask before you pay" subtitle="Copy/paste this into WhatsApp" />
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">Training structure</h3>
            <ul className="mt-3 space-y-2 text-sm text-gray-700">
              <li><strong>What’s the weekly timetable?</strong> (morning/evening, days off)</li>
              <li><strong>What are class types?</strong> (technique, sparring, clinch, conditioning)</li>
              <li><strong>Beginner lane?</strong> (fundamentals, optional sparring)</li>
              <li><strong>Coach feedback frequency?</strong> (pads, corrections, 1:1 time)</li>
            </ul>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">Logistics & recovery</h3>
            <ul className="mt-3 space-y-2 text-sm text-gray-700">
              <li><strong>Is accommodation on-site?</strong> If not, how far?</li>
              <li><strong>Recovery facilities?</strong> (ice bath, sauna, physio, massage)</li>
              <li><strong>What gear is required?</strong> (gloves/shins, gi, rashguards)</li>
              <li><strong>Visa guidance?</strong> Ask what they actually provide and what documents, if any.</li>
            </ul>
          </div>
        </div>
        <p className="mt-6 text-sm text-gray-700">
          For deep planning, start at{' '}
          <Link href="/blog/combat-sports-travel-guide-thailand-2026" className="font-semibold text-[#003580] underline">
            the Ultimate Combat Sports Travel guide (2026)
          </Link>
          .
        </p>
      </GuideSection>

      <GuideSection id="logistics" variant="default" className="mb-14 border border-gray-200 bg-white">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#003580]">Semantic gap coverage</p>
        <h2 className="mt-2 text-2xl font-bold text-gray-900 md:text-3xl">Recovery &amp; legality blocks (what Google misses)</h2>
        <p className="mt-3 max-w-3xl text-base leading-relaxed text-gray-700">
          Visa and recovery entities are high-intent. Most competitors avoid specifics; we make them explicit and link to deeper guides.
        </p>
        <GuideLogisticsBlocks cityLabel="Thailand" />
      </GuideSection>

      <GuideSection id="week" variant="slate" className="mb-14">
        <GuideAccentIntro icon={CheckCircle2} title="A sustainable week (so you don’t burn out)" subtitle="Repeatable beats heroic" />
        <GuideThreeCards
          items={[
            { title: 'Days 1–3', body: '1 session/day + mobility + early sleep. Adapt to heat and volume.' },
            { title: 'Days 4–6', body: 'Add a second session only if sleep and soreness are stable. Keep sparring controlled.' },
            { title: 'Day 7', body: 'Full rest or easy walk/swim. Tours count as load—don’t stack with hard sparring.' },
          ]}
        />
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <figure className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="relative aspect-[4/3] w-full">
              <Image
                src="https://images.unsplash.com/photo-1546483875-ad9014c88eba?auto=format&fit=crop&w=1400&q=80"
                alt="Recovery and rest"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 520px"
              />
            </div>
            <figcaption className="px-4 py-3 text-xs text-gray-600">Treat recovery like training—it’s what lets you train again tomorrow.</figcaption>
          </figure>
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">Where to start next</h3>
            <div className="mt-3 space-y-2 text-sm">
              <Link href="/blog/best-muay-thai-camps-thailand-2026" className="font-semibold text-[#003580] underline">
                25 best Muay Thai camps in Thailand (2026)
              </Link>
              <div>
                <Link href="/blog/best-bjj-gyms-thailand" className="font-semibold text-[#003580] underline">
                  Best BJJ gyms in Thailand (2026)
                </Link>
              </div>
              <div>
                <Link href="/blog/muay-thai-camp-thailand-cost" className="font-semibold text-[#003580] underline">
                  How much a Thailand camp costs (2026)
                </Link>
              </div>
            </div>
          </div>
        </div>
      </GuideSection>

      <GuideCtaStrip
        title="Ready to shortlist gyms the smart way?"
        subtitle="Use live listings and filter by amenities, price, and dates."
        href="/search?country=Thailand"
        buttonLabel="Browse Thailand gyms"
      />

      <GuideSection id="faq" variant="default" className="mb-14 border border-gray-200 bg-white p-6 md:p-8">
        <h2 className="mb-2 text-2xl font-bold text-gray-900 md:text-3xl">FAQ</h2>
        <p className="mb-8 text-gray-600">Quick answers for common booking questions.</p>
        <GuideFaqList items={FAQ_ITEMS} />
      </GuideSection>

      <RelatedGuides
        guides={[
          { title: 'Ultimate combat sports travel guide (2026)', href: '/blog/combat-sports-travel-guide-thailand-2026' },
          { title: 'Thailand training visa / DTV guide', href: '/blog/thailand-training-visa-dtv' },
          { title: 'Visas for martial arts training (ED visa + alternatives)', href: '/blog/ed-visa-martial-arts-training-thailand' },
          { title: 'Packing list for a combat sports camp in Thailand', href: '/blog/packing-list-combat-sports-camp-thailand' },
        ]}
      />
    </ArticleShell>
  )
}

