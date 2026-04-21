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
import { Users, Trophy, Shield } from 'lucide-react'

const TITLE = 'Best Judo Gyms in Thailand (2026)'
const SEO_TITLE = 'Best Judo Gyms in Thailand 2026 [Prices + Reviews]'
const PATH = '/blog/best-judo-gyms-thailand'
const DATE_PUBLISHED = '2025-10-15'
const DATE_MODIFIED = '2026-04-20'
const HERO_IMAGE = 'https://images.unsplash.com/photo-1521412644187-c49fa049e84d?auto=format&fit=crop&w=1400&q=80'
const DESCRIPTION =
  'Judo gyms in Thailand: ranked by reviews with real listings, schedules, and travel planning advice. Discipline-filtered so you get true judo options, not generic fight camps.'

export const metadata: Metadata = {
  title: `${SEO_TITLE} | Combatbooking`,
  description: DESCRIPTION,
  alternates: { canonical: PATH },
  openGraph: { title: `${SEO_TITLE} | Combatbooking`, description: DESCRIPTION, type: 'article' },
  twitter: { card: 'summary_large_image', title: `${SEO_TITLE} | Combatbooking`, description: DESCRIPTION },
}

const FAQ_ITEMS = [
  {
    q: 'Is judo common in Thailand?',
    a: 'It exists but is less ubiquitous than Muay Thai. That’s why this guide filters for judo-tagged listings—so you can find genuine options when they’re available.',
  },
  {
    q: 'Can I combine judo with BJJ or MMA in Thailand?',
    a: 'Yes. Many travelers cross-train. The key is recovery and joint management—throwing volume plus hard rounds can be intense. Use schedules to plan sustainable weeks.',
  },
  {
    q: 'Do these gyms accept beginners?',
    a: 'Many do, but class structure varies. Check each profile for fundamentals sessions and whether beginners are paired safely.',
  },
  {
    q: 'Are these rankings paid?',
    a: 'No. Rankings follow review signals from verified/trusted listings on CombatBooking, not paid placements.',
  },
  {
    q: 'How much does judo training cost in Thailand?',
    a: 'Prices vary by gym and location. Use the ranked list to shortlist options, then confirm current rates and schedules on each gym profile.',
  },
  {
    q: 'Is judo in Thailand mostly for kids or adults?',
    a: 'It depends on the program. Some gyms have strong kids classes; others run adult-focused sessions. Check listings for age groups and weekly schedules.',
  },
  {
    q: 'What should I pack for judo training in Thailand?',
    a: 'A gi if you already own one (or confirm if the gym sells/rents), tape for fingers, and basic recovery items. If you cross-train striking, pack a mouthguard and manage weekly load.',
  },
  {
    q: 'How long should I stay to improve at judo while traveling?',
    a: 'Two to four weeks of consistent practice can create meaningful gains, especially in grips and movement. Longer stays work best when intensity is controlled and recovery is prioritized.',
  },
]

const EDITORIAL: Array<{ title: string; body: ReactNode }> = [
  { title: 'Top judo picks', body: <p>Highest review momentum among judo-tagged listings. Confirm schedule frequency and coaching style.</p> },
  { title: 'Next tier', body: <p>Still discipline-filtered. Differences are often review count and recency.</p> },
  { title: 'Mid-list', body: <p>Useful when you need specific dates or location fit. Read profiles for class times.</p> },
  { title: 'More gyms', body: <p>Expand beyond the few names that dominate forums.</p> },
  { title: 'Final ranks', body: <p>Completes the shortlist so you can compare more options.</p> },
]

export default async function BestJudoGymsThailandPage() {
  const gyms = await getThailandGymsForGuide({ discipline: 'Judo' })

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
    { name: TITLE, path: PATH },
  ])

  return (
    <ArticleShell
      title={TITLE}
      subtitle="A judo-specific Thailand guide—throws, grips, and training structure—built to match search intent and keep you from landing in a striking-only camp."
      breadcrumbs={[
        { label: 'Training Guides', href: '/blog' },
        { label: 'Thailand', href: '/search?country=Thailand' },
        { label: 'Judo', href: '/search?country=Thailand&discipline=Judo' },
      ]}
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      <GuideHero
        imageSrc={HERO_IMAGE}
        imageAlt="Grappling uniform and belt"
        priority
        overlayText="Judo in Thailand: find real judo gyms, compare schedules, and plan a sustainable training stay."
      />

      <GuideLeadRow
        tocItems={[
          { href: '#why-judo', label: 'Why judo here' },
          { href: '#how-to-choose', label: 'How to choose' },
          { href: '#week-template', label: 'Week template' },
          { href: '#budget', label: 'Budget & packing' },
          { href: '#ranked', label: 'Ranked gyms' },
          { href: '#faq', label: 'FAQ' },
        ]}
        statValue={gyms.length}
        statDescription="Verified/trusted judo-tagged gyms in Thailand on CombatBooking."
        statIcon={<Trophy className="h-5 w-5" />}
      />

      <section id="why-judo" className="mb-14 scroll-mt-24">
        <GuideAccentIntro icon={Users} title="Why train judo in Thailand?" subtitle="A niche with upside" />
        <div className="prose prose-gray max-w-none space-y-4 text-base leading-relaxed text-gray-800 md:prose-lg">
          <p>
            People searching <strong>best judo gyms in Thailand</strong> often want a grappling base that complements BJJ or MMA.
            This guide filters for judo-tagged listings and ranks them using the same review-first logic as our other guides.
          </p>
          <p>
            For long stays, judo progress comes from repeatable weeks: quality uchikomi, controlled randori, and good recovery.
            Choose a gym whose schedule matches your life outside training.
          </p>
        </div>
      </section>

      <GuideSection id="how-to-choose" variant="slate" className="mb-14">
        <h2 className="mb-6 text-2xl font-bold text-gray-900 md:text-3xl">How to choose a judo gym in Thailand</h2>
        <GuideThreeCards
          items={[
            { title: 'Schedule frequency', body: 'Judo benefits from consistent weekly sessions. Confirm how many classes per week are offered.' },
            { title: 'Safety & partners', body: 'Ask how beginners are paired and what mat rules exist. Controlled intensity keeps you training longer.' },
            { title: 'Cross-training fit', body: 'If you’re mixing BJJ/MMA, avoid stacking maximal rounds every day. Plan recovery like training.' },
          ]}
        />
      </GuideSection>

      <GuideSection id="week-template" variant="slate" className="mb-14">
        <h2 className="mb-4 text-2xl font-bold text-gray-900 md:text-3xl">A realistic 7‑day judo training template</h2>
        <p className="mb-6 max-w-3xl text-gray-700">
          Judo progress comes from repeatable weeks. Use this as a structure for 2–6 week trips.
        </p>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">Travel week (balanced)</h3>
            <ul className="mt-3 space-y-2 text-sm text-gray-700">
              <li>
                <strong>3–4 judo sessions:</strong> technique + controlled rounds.
              </li>
              <li>
                <strong>2 strength/mobility blocks:</strong> prehab for joints and grips.
              </li>
              <li>
                <strong>1 full rest day:</strong> keep it sacred.
              </li>
            </ul>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">Cross-training week (BJJ/MMA)</h3>
            <ul className="mt-3 space-y-2 text-sm text-gray-700">
              <li>
                <strong>Don’t stack impact daily:</strong> throws + hard sparring = injury risk.
              </li>
              <li>
                <strong>Pick one “hard day” focus:</strong> either judo intensity or striking intensity.
              </li>
              <li>
                <strong>Protect hands:</strong> tape grips, manage randori volume.
              </li>
            </ul>
          </div>
        </div>
      </GuideSection>

      <GuideSection id="budget" variant="slate" className="mb-14">
        <div className="grid gap-8 md:grid-cols-2 md:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#003580]">Budget & packing</p>
            <h2 className="mt-2 text-2xl font-bold text-gray-900 md:text-3xl">How to plan a judo long stay</h2>
            <div className="mt-3 space-y-3 text-base leading-relaxed text-gray-700">
              <p>
                For longer trips, cost is more than class fees. Consider accommodation proximity to the dojo, recovery costs, and how many
                sessions per week are actually offered.
              </p>
              <p>
                Confirm gi requirements (buy/rent), hygiene rules, and class times on the listing before you book accommodation.
              </p>
            </div>
          </div>
          <figure className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="relative aspect-[4/3] w-full">
              <Image
                src="https://images.unsplash.com/photo-1521412644187-c49fa049e84d?auto=format&fit=crop&w=1400&q=80"
                alt="Judo gi and belt"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 520px"
              />
            </div>
            <figcaption className="px-4 py-3 text-xs text-gray-600">
              Grip and repetition are the game—plan a schedule you can repeat.
            </figcaption>
          </figure>
        </div>
      </GuideSection>

      <GuideSection variant="default" className="mb-14 border border-gray-200 bg-white">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#003580]">Further reading</p>
        <h2 className="mt-2 text-2xl font-bold text-gray-900 md:text-3xl">Judo rules and reference links</h2>
        <p className="mt-3 max-w-3xl text-base leading-relaxed text-gray-700">
          Use these to align expectations on rulesets and competition context. Gym choice should still be driven by coaching fit and schedule.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <a
            href="https://www.ijf.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
          >
            <p className="text-sm font-semibold text-gray-900">International Judo Federation (IJF)</p>
            <p className="mt-1 text-xs text-gray-600">Rules and competition reference context.</p>
            <p className="mt-3 text-xs font-semibold text-[#003580]">Open →</p>
          </a>
          <a
            href="https://en.wikipedia.org/wiki/Judo"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
          >
            <p className="text-sm font-semibold text-gray-900">Judo (reference)</p>
            <p className="mt-1 text-xs text-gray-600">Terminology and basics overview.</p>
            <p className="mt-3 text-xs font-semibold text-[#003580]">Open →</p>
          </a>
        </div>
        <div className="mt-6 flex items-start gap-3 rounded-xl border border-gray-200 bg-slate-50 p-5">
          <Shield className="mt-0.5 h-5 w-5 shrink-0 text-[#003580]" aria-hidden />
          <p className="text-sm text-gray-700">
            Throws add impact. For long stays, prioritize safe partners, controlled intensity, and recovery so you stay healthy enough to train.
          </p>
        </div>
      </GuideSection>

      <GuideCtaStrip
        title="Browse all judo gyms in Thailand"
        subtitle="Filter by city and compare listings beyond this guide."
        href="/search?country=Thailand&discipline=Judo"
        buttonLabel="Open judo search"
      />

      <section id="ranked" className="mb-16 scroll-mt-24">
        <h2 className="mb-2 text-2xl font-bold text-gray-900 md:text-3xl">Ranked judo gyms</h2>
        <p className="mb-8 max-w-3xl text-gray-600">
          Discipline-filtered rankings from verified/trusted listings. Sections keep it readable and useful.
        </p>
        {gyms.length === 0 ? (
          <GuideEmptyState
            title="No judo-tagged gyms yet"
            description="Owners should add Judo to disciplines to qualify. If you run a judo program, publish a listing to appear here."
            searchHref="/search?country=Thailand&discipline=Judo"
            searchLabel="Search anyway"
          />
        ) : (
          <ChunkedGymGrid gyms={gyms} chunkSize={5} editorialBetweenChunks={EDITORIAL.slice(0, Math.ceil(gyms.length / 5))} />
        )}
      </section>

      <GuideSection id="faq" variant="default" className="mb-14 border border-gray-200 bg-white p-6 md:p-8">
        <h2 className="mb-2 text-2xl font-bold text-gray-900 md:text-3xl">FAQ</h2>
        <p className="mb-8 text-gray-600">High-intent questions from judo travel searches.</p>
        <GuideFaqList items={FAQ_ITEMS} />
      </GuideSection>
      <GuideCtaStrip
        title="Ready to pick your Thailand judo gym?"
        subtitle="Compare every verified Thailand judo gym — live prices, reviews, dates — and book directly."
        href="/search?country=Thailand&discipline=Judo"
        buttonLabel="Find your judo gym"
      />



      <RelatedGuides
        guides={[
          { title: 'Best BJJ gyms in Thailand', href: '/blog/best-bjj-gyms-thailand' },
          { title: 'Best MMA camps in Thailand', href: '/blog/best-mma-camps-thailand' },
          { title: 'Best boxing gyms in Thailand', href: '/blog/best-boxing-gyms-thailand' },
          { title: 'Thailand training visa / DTV', href: '/blog/thailand-training-visa-dtv' },
        ]}
      />
    </ArticleShell>
  )
}

