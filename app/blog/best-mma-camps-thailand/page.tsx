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
  GuideFeatureGrid,
  GuideHero,
  GuideLeadRow,
  GuideSection,
  GuideThreeCards,
} from '@/components/guides/guide-page-blocks'
import { Check, Shield, Swords, Zap } from 'lucide-react'

const TITLE = 'Best MMA Camps in Thailand (2026)'
const DESCRIPTION =
  'Ranked MMA gyms in Thailand: only mixed martial arts listings, with prices, photos, schedule snippets, and long-form planning advice Muay-Thai-only sites cannot replicate.'

export const metadata: Metadata = {
  title: `${TITLE} | Striking + Grappling | CombatBooking.com`,
  description: DESCRIPTION,
  alternates: { canonical: '/blog/best-mma-camps-thailand' },
  openGraph: { title: `${TITLE} - CombatBooking.com`, description: DESCRIPTION, type: 'article' },
  twitter: { card: 'summary_large_image', title: `${TITLE} - CombatBooking.com`, description: DESCRIPTION },
}

function absoluteUrl(path: string) {
  return `https://combatbooking.com${path}`
}

const FAQ_ITEMS = [
  {
    q: 'Why a separate MMA guide from Muay Thai?',
    a: 'MMA requires different coaching, class structure, and often grappling infrastructure. Muay-Thai-only blogs cannot credibly rank MMA gyms—this page filters disciplines accordingly.',
  },
  {
    q: 'Do these gyms include only professional fighters?',
    a: 'No. Listings can serve hobbyists and competitors alike. Read each profile for beginner-friendly MMA fundamentals vs competition-focused training.',
  },
  {
    q: 'How is ranking calculated?',
    a: 'Verified Thailand gyms that list MMA-related disciplines, sorted by review score and volume—same transparency approach as our Muay Thai hub.',
  },
  {
    q: 'Is Thailand good for MMA beginners?',
    a: 'It can be. Many MMA gyms serve beginners, but class intensity and sparring culture differ. Read each profile for fundamentals blocks and ask about beginner-friendly sessions before you commit to a long stay.',
  },
  {
    q: 'Do Thailand MMA camps include wrestling?',
    a: 'Some do and some do not. Check whether a gym offers no-gi grappling, takedown work, and cage wrestling—not just pad rounds with MMA branding.',
  },
  {
    q: 'Can I combine MMA with Muay Thai while in Thailand?',
    a: 'Yes. The key is load management: stack hard sessions too aggressively and you’ll get injured. Use schedules and recovery days to build a plan you can repeat for weeks.',
  },
  {
    q: 'How much does MMA training cost in Thailand?',
    a: 'Pricing varies by city and whether packages include multiple disciplines or private sessions. Use the ranked list to shortlist, then confirm current rates and inclusions on each gym profile.',
  },
  {
    q: 'How long should I stay at an MMA camp to improve?',
    a: 'Most travelers feel meaningful progress with 2–4 weeks of consistent training and recovery. Longer stays work best when you keep intensity sustainable and protect sleep and joints.',
  },
  {
    q: 'What should I pack for an MMA camp in Thailand?',
    a: 'Mouthguard, wraps, and lightweight training clothes. For grappling, bring rashguards/spats; for sparring, confirm glove/shin guard requirements on the listing. Many travelers buy gear locally to reduce luggage weight.',
  },
]

const EDITORIAL: Array<{ title: string; body: ReactNode }> = [
  {
    title: 'Top MMA picks',
    body: (
      <p>
        Highest review momentum among MMA-tagged gyms. Compare striking vs grappling emphasis—some camps lean Muay
        style, others run more cage-work and wrestling entries.
      </p>
    ),
  },
  {
    title: 'Next tier',
    body: (
      <p>
        Still discipline-filtered. Open profiles for coach credentials, sparring policy, and whether gi/no-gi grappling is
        bundled or separate.
      </p>
    ),
  },
  {
    title: 'Mid-list',
    body: (
      <p>
        Use this band if you need specific dates or pricing. Rank is national—not “nearest to my hotel.”
      </p>
    ),
  },
  {
    title: 'More ranked camps',
    body: (
      <p>
        Expands your comparison set beyond short blog roundups. Always confirm gear requirements and gym rules before you
        fly.
      </p>
    ),
  },
  {
    title: 'Final ranked listings',
    body: (
      <p>
        If your favorite gym is missing, it may not tag MMA yet—owners can update disciplines to qualify.
      </p>
    ),
  },
]

export default async function BestMmaCampsThailandPage() {
  const gyms = await getThailandGymsForGuide({ discipline: 'MMA' })

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
    mainEntityOfPage: absoluteUrl('/blog/best-mma-camps-thailand'),
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
      subtitle="Thailand’s MMA scene is broader than pure Muay Thai—this guide owns search intent competitors literally cannot."
      breadcrumbs={[
        { label: 'Training Guides', href: '/blog' },
        { label: 'Thailand', href: '/search?country=Thailand' },
        { label: 'MMA', href: '/search?country=Thailand&discipline=MMA' },
      ]}
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />

      <GuideHero
        imageSrc="/tjj8r5ovjts8nhqjhkqc.avif"
        imageAlt="MMA training in Thailand"
        priority
        overlayText="MMA in Thailand: blend striking tradition with cage-ready grappling—compare real gyms with transparent listings, not generic travel fluff."
      />

      <GuideLeadRow
        tocItems={[
          { href: '#why-mma', label: 'Why this guide' },
          { href: '#striking-grappling', label: 'Striking vs grappling' },
          { href: '#method', label: 'How we rank' },
          { href: '#week-template', label: 'Week template' },
          { href: '#budget', label: 'Budget & packing' },
          { href: '#ranked', label: 'Ranked camps' },
          { href: '#faq', label: 'FAQ' },
        ]}
        statValue={gyms.length}
        statDescription="Verified/trusted MMA-tagged gyms in Thailand on CombatBooking (this page ranks all that qualify)."
        statIcon={<Swords className="h-5 w-5" />}
      />

      <GuideSection variant="slate" className="mb-14">
        <div className="grid gap-8 md:grid-cols-2 md:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#003580]">MMA camp selection</p>
            <h2 className="mt-2 text-2xl font-bold text-gray-900 md:text-3xl">What “MMA camp” means in Thailand</h2>
            <div className="mt-3 space-y-3 text-base leading-relaxed text-gray-700">
              <p>
                A lot of pages try to rank <strong>best MMA camps in Thailand</strong> but quietly list Muay Thai gyms.
                This guide keeps intent clean: MMA‑tagged listings only.
              </p>
              <p>
                Even within MMA, camps differ. Some are striking-heavy with a little grappling; others have true no‑gi depth.
                If you’re staying a month, that split matters more than a one‑spot rank difference.
              </p>
            </div>
          </div>
          <figure className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="relative aspect-[4/3] w-full">
              <Image
                src="https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?auto=format&fit=crop&w=1400&q=80"
                alt="MMA gloves and training gear"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 520px"
              />
            </div>
            <figcaption className="px-4 py-3 text-xs text-gray-600">
              Clarify whether you’re optimizing for striking, grappling, or full MMA—then pick a schedule you’ll repeat.
            </figcaption>
          </figure>
        </div>
      </GuideSection>

      <section id="why-mma" className="mb-14 scroll-mt-24">
        <GuideAccentIntro icon={Zap} title="Why an MMA-specific Thailand guide matters" subtitle="Authority + intent" />
        <div className="prose prose-gray max-w-none space-y-4 text-base leading-relaxed text-gray-800 md:prose-lg">
          <p>
            Searchers typing <strong>best MMA camps in Thailand</strong> need mixed martial arts coaching—not a Muay Thai
            list retitled for clicks. CombatBooking is discipline-aware: this article only surfaces gyms whose profiles
            include MMA or mixed martial arts tags, then ranks them using the same review signals as our other guides.
          </p>
          <p>
            That matters for SEO <em>and</em> for travelers. You get grappling blocks, cage context, and coaching styles
            that pure striking gyms may not offer—without guessing from a vague “fight camp” blog.
          </p>
        </div>
      </section>

      <GuideSection id="striking-grappling" variant="slate" className="mb-14">
        <h2 className="mb-6 text-2xl font-bold text-gray-900 md:text-3xl">Striking tradition vs modern MMA</h2>
        <GuideThreeCards
          items={[
            {
              title: 'Muay Thai base',
              body: 'Many athletes want Thai-style timing and conditioning even while building MMA. Check whether standup classes are separate from MMA hybrid sessions.',
            },
            {
              title: 'Grappling depth',
              body: 'Ask about wrestling entries, cage wrestling, and BJJ/no-gi availability—MMA gyms differ wildly.',
            },
            {
              title: 'Sparring policy',
              body: 'Hard sparring is not mandatory for everyone. Confirm beginner tracks and coach supervision on profiles.',
            },
          ]}
        />
      </GuideSection>

      <section id="method" className="mb-14 scroll-mt-24">
        <h2 className="mb-4 text-2xl font-bold text-gray-900 md:text-3xl">Ranking methodology</h2>
        <p className="mb-6 max-w-3xl text-gray-600">
          We publish this so rankings are inspectable—not a mystery editor’s whim.
        </p>
        <GuideFeatureGrid
          items={[
            { icon: <Check className="h-5 w-5 text-green-600" />, title: 'Discipline filter', text: 'only gyms that list MMA-related disciplines after post-validation.' },
            { icon: <Check className="h-5 w-5 text-green-600" />, title: 'Thailand only', text: 'country filter with live verified/trusted listings.' },
            { icon: <Check className="h-5 w-5 text-green-600" />, title: 'Review signal', text: 'rating average plus volume so one review cannot dominate.' },
            { icon: <Shield className="h-5 w-5 text-[#003580]" />, title: 'Safety', text: 'insurance and gym rules still belong to you and the camp—confirm on site.' },
          ]}
        />
      </section>

      <GuideSection id="week-template" variant="slate" className="mb-14">
        <h2 className="mb-4 text-2xl font-bold text-gray-900 md:text-3xl">A realistic 7‑day MMA camp template</h2>
        <p className="mb-6 max-w-3xl text-gray-700">
          The biggest mistake MMA travelers make is stacking maximal intensity every day. Use this template to stay healthy enough
          to train for weeks.
        </p>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">Beginner-friendly week</h3>
            <ul className="mt-3 space-y-2 text-sm text-gray-700">
              <li>
                <strong>4–5 sessions:</strong> fundamentals + technical rounds.
              </li>
              <li>
                <strong>1 strength/mobility block:</strong> joint prehab + conditioning.
              </li>
              <li>
                <strong>1–2 recovery blocks:</strong> sleep, walking, light mobility.
              </li>
            </ul>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">Experienced week (2–6+ weeks)</h3>
            <ul className="mt-3 space-y-2 text-sm text-gray-700">
              <li>
                <strong>6–9 sessions/week:</strong> alternate hard and technical days.
              </li>
              <li>
                <strong>Protect sparring:</strong> controlled rounds beat ego rounds.
              </li>
              <li>
                <strong>1 true rest day:</strong> keep it sacred to sustain volume.
              </li>
            </ul>
          </div>
        </div>
      </GuideSection>

      <GuideSection id="budget" variant="default" className="mb-14 border border-gray-200 bg-white">
        <div className="grid gap-8 md:grid-cols-2 md:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#003580]">Budget & packing</p>
            <h2 className="mt-2 text-2xl font-bold text-gray-900 md:text-3xl">How to compare MMA camps without getting misled</h2>
            <div className="mt-3 space-y-3 text-base leading-relaxed text-gray-700">
              <p>
                “Best MMA camp Thailand” is usually a schedule + coaching question, not a hype question. Compare grappling depth,
                takedown work, and whether MMA sessions are real mixed sessions (not just pads with MMA branding).
              </p>
              <p>
                For longer stays, total cost includes recovery (massage/nutrition), gear replacement, and transport. Choose the option
                you can attend consistently.
              </p>
            </div>
          </div>
          <figure className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="relative aspect-[4/3] w-full">
              <Image
                src="https://images.unsplash.com/photo-1555597673-b21d5c935865?auto=format&fit=crop&w=1400&q=80"
                alt="MMA training gloves and pads"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 520px"
              />
            </div>
            <figcaption className="px-4 py-3 text-xs text-gray-600">
              Choose a camp you can repeat for weeks—then let consistency do the work.
            </figcaption>
          </figure>
        </div>
      </GuideSection>

      <GuideSection variant="slate" className="mb-14">
        <div className="grid gap-8 md:grid-cols-2 md:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#003580]">Further reading</p>
            <h2 className="mt-2 text-2xl font-bold text-gray-900 md:text-3xl">Thailand fight-scene context</h2>
            <p className="mt-3 text-base leading-relaxed text-gray-700">
              If you’re planning a longer MMA trip, it helps to understand the broader fight ecosystem (events, gyms, and
              culture). Use these as background context—your gym choice should still come from the listings and schedules.
            </p>
            <div className="mt-6 grid gap-4">
              <a
                href="https://en.wikipedia.org/wiki/Mixed_martial_arts"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                <p className="text-sm font-semibold text-gray-900">Mixed martial arts (reference)</p>
                <p className="mt-1 text-xs text-gray-600">Rulesets, terms, and training structure background.</p>
                <p className="mt-3 text-xs font-semibold text-[#003580]">Open →</p>
              </a>
              <a
                href="https://www.onefc.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                <p className="text-sm font-semibold text-gray-900">ONE Championship</p>
                <p className="mt-1 text-xs text-gray-600">Major combat sports promotion in the region (context for travel planning).</p>
                <p className="mt-3 text-xs font-semibold text-[#003580]">Open →</p>
              </a>
            </div>
          </div>
          <figure className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="relative aspect-[4/3] w-full">
              <Image
                src="https://images.unsplash.com/photo-1555597673-b21d5c935865?auto=format&fit=crop&w=1400&q=80"
                alt="MMA training gloves and pads"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 520px"
              />
            </div>
            <figcaption className="px-4 py-3 text-xs text-gray-600">
              For month-long plans, build a schedule you can recover from—not the hardest week you can survive.
            </figcaption>
          </figure>
        </div>
      </GuideSection>

      <GuideCtaStrip
        title="Browse all MMA camps in Thailand"
        subtitle="Filter beyond this article anytime."
        href="/search?country=Thailand&discipline=MMA"
        buttonLabel="Open MMA search"
      />

      <section id="ranked" className="mb-16 scroll-mt-24">
        <h2 className="mb-2 text-2xl font-bold text-gray-900 md:text-3xl">Ranked MMA camps</h2>
        <p className="mb-8 max-w-3xl text-gray-600">
          Long sections between every five gyms break up the grid and add keyword-rich context for search engines and readers.
        </p>
        {gyms.length === 0 ? (
          <GuideEmptyState
            title="No MMA-tagged gyms yet"
            description="Pure Muay Thai listings are excluded on purpose. Owners should add MMA to disciplines to appear here."
            searchHref="/search?country=Thailand&discipline=MMA"
            searchLabel="Search MMA anyway"
          />
        ) : (
          <ChunkedGymGrid
            gyms={gyms}
            chunkSize={5}
            editorialBetweenChunks={EDITORIAL.slice(0, Math.ceil(gyms.length / 5))}
          />
        )}
      </section>

      <GuideSection id="faq" variant="default" className="mb-14 border border-gray-200 bg-white p-6 md:p-8">
        <h2 className="mb-2 text-2xl font-bold text-gray-900 md:text-3xl">FAQ</h2>
        <p className="mb-8 text-gray-600">MMA-specific questions.</p>
        <GuideFaqList items={FAQ_ITEMS} />
      </GuideSection>

      <RelatedGuides
        guides={[
          { title: 'Best BJJ gyms in Thailand', href: '/blog/best-bjj-gyms-thailand' },
          { title: 'Best boxing gyms in Thailand', href: '/blog/best-boxing-gyms-thailand' },
          { title: '25 best Muay Thai camps', href: '/blog/best-muay-thai-camps-thailand-2026' },
          { title: 'Thailand visa / DTV', href: '/blog/thailand-training-visa-dtv' },
        ]}
      />
    </ArticleShell>
  )
}
