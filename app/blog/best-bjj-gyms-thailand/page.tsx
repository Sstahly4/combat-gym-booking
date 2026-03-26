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
import { CircleDot, Users } from 'lucide-react'

const TITLE = 'Best BJJ Gyms in Thailand (2026)'
const DESCRIPTION =
  'Brazilian Jiu-Jitsu gyms in Thailand: ranked by reviews, with gi/no-gi tips, pricing signals, and discipline-only filtering—not generic fight camp lists.'

export const metadata: Metadata = {
  title: `${TITLE} | Gi, No-Gi & Grappling | CombatBooking.com`,
  description: DESCRIPTION,
  alternates: { canonical: '/blog/best-bjj-gyms-thailand' },
  openGraph: { title: `${TITLE} - CombatBooking.com`, description: DESCRIPTION, type: 'article' },
  twitter: { card: 'summary_large_image', title: `${TITLE} - CombatBooking.com`, description: DESCRIPTION },
}

function absoluteUrl(path: string) {
  return `https://combatbooking.com${path}`
}

const FAQ_ITEMS = [
  {
    q: 'Gi vs no-gi—which do Thailand BJJ gyms emphasize?',
    a: 'It varies by gym and coach lineups. Read each profile for class types, nogi schedules, and competition teams.',
  },
  {
    q: 'Are these gyms only for competitors?',
    a: 'No. Many listings welcome hobbyists. Confirm fundamentals class frequency and open mat rules on the gym page.',
  },
  {
    q: 'Why not use a Muay Thai guide for grappling?',
    a: 'Disciplines differ. This page filters BJJ/grappling tags so you do not waste time on striking-only camps.',
  },
  {
    q: 'Is no-gi common in Thailand BJJ gyms?',
    a: 'Many gyms offer no-gi, but schedules vary. Check each listing for class types and weekly frequency—some gyms run mostly gi with a few no-gi sessions.',
  },
  {
    q: 'Do Thailand BJJ gyms allow drop-ins?',
    a: 'Often yes, but policies differ. Confirm drop-in rules, open mat times, and hygiene expectations on the gym profile before you show up.',
  },
  {
    q: 'How much does BJJ training cost in Thailand?',
    a: 'Prices vary by city and membership length. Short stays may pay drop-in or weekly rates; longer stays often get better monthly pricing. Confirm current rates on each gym page.',
  },
  {
    q: 'Is Thailand BJJ safe for beginners?',
    a: 'It can be, but intensity and partner matching vary. Look for fundamentals classes, controlled rolling, and clear hygiene rules. If you’re brand new, prioritize consistency and learning over “hard rounds.”',
  },
  {
    q: 'What should I pack for BJJ training in Thailand?',
    a: 'A gi if you already own one (or confirm if the gym sells/rents), a rashguard for no-gi, tape for fingers, and a mouthguard if you cross-train striking. Many travelers buy gear locally to reduce luggage weight.',
  },
  {
    q: 'How long should I stay to improve at BJJ while traveling?',
    a: 'Two to four weeks of consistent classes and open mats is enough to feel real progress. Longer stays work best when you manage training intensity and protect sleep and recovery.',
  },
]

const EDITORIAL: Array<{ title: string; body: ReactNode }> = [
  {
    title: 'Top BJJ picks',
    body: (
      <p>
        Highest review momentum among BJJ-tagged gyms. Compare class density, coach ratios, and whether competition travel
        is part of the culture.
      </p>
    ),
  },
  {
    title: 'Next tier',
    body: (
      <p>
        Still grappling-filtered. Look for open mat times, shower facilities, and whether drop-ins are welcome—especially in
        tourist-heavy areas.
      </p>
    ),
  },
  {
    title: 'Mid-list',
    body: (
      <p>
        Great for travelers comparing price and schedule fit. Rank is not personality—read “about” sections closely.
      </p>
    ),
  },
  {
    title: 'More gyms',
    body: (
      <p>
        Expands your shortlist beyond the first page of Google. All entries still meet discipline and verification rules.
      </p>
    ),
  },
  {
    title: 'Final ranks',
    body: (
      <p>
        If you also train MMA, cross-check our{' '}
        <Link href="/blog/best-mma-camps-thailand" className="font-medium text-[#003580] underline">
          MMA Thailand guide
        </Link>
        .
      </p>
    ),
  },
]

export default async function BestBjjGymsThailandPage() {
  const gyms = await getThailandGymsForGuide({ discipline: 'BJJ' })

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
    mainEntityOfPage: absoluteUrl('/blog/best-bjj-gyms-thailand'),
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
      subtitle="Grappling-only rankings—own search terms pure Muay Thai competitors cannot touch."
      breadcrumbs={[
        { label: 'Training Guides', href: '/blog' },
        { label: 'Thailand', href: '/search?country=Thailand' },
        { label: 'BJJ', href: '/search?country=Thailand&discipline=BJJ' },
      ]}
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />

      <GuideHero
        imageSrc="/ChatGPT Image Mar 18, 2026 at 05_02_15 PM.png"
        imageAlt="Brazilian Jiu-Jitsu training in Thailand"
        priority
        overlayText="Thailand’s BJJ scene pairs well with MMA and Muay Thai—this guide ranks grappling gyms with real discipline tags and live reviews."
      />

      <GuideLeadRow
        tocItems={[
          { href: '#why-bjj', label: 'Why BJJ in Thailand' },
          { href: '#gi-nogi', label: 'Gi & no-gi' },
          { href: '#week-template', label: 'Week template' },
          { href: '#budget', label: 'Budget & packing' },
          { href: '#ranked', label: 'Ranked gyms' },
          { href: '#faq', label: 'FAQ' },
        ]}
        statValue={gyms.length}
        statDescription="Verified/trusted BJJ / grappling-tagged gyms ranked on CombatBooking."
        statIcon={<CircleDot className="h-5 w-5" />}
      />

      <GuideSection variant="slate" className="mb-14">
        <div className="grid gap-8 md:grid-cols-2 md:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#003580]">Grappling travel</p>
            <h2 className="mt-2 text-2xl font-bold text-gray-900 md:text-3xl">How to choose a Thailand BJJ gym for a long stay</h2>
            <div className="mt-3 space-y-3 text-base leading-relaxed text-gray-700">
              <p>
                Ranking matters—but retention comes from routine. For a 2–8 week trip, optimize for a schedule you’ll keep:
                class frequency, open mats, recovery, and whether the gym culture fits your personality.
              </p>
              <p>
                If you’re also training MMA, make sure no‑gi classes align with MMA sessions so you’re not doubling hard rounds
                every day.
              </p>
            </div>
          </div>
          <figure className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="relative aspect-[4/3] w-full">
              <Image
                src="https://images.unsplash.com/photo-1521412644187-c49fa049e84d?auto=format&fit=crop&w=1400&q=80"
                alt="Jiu-jitsu gi and belt"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 520px"
              />
            </div>
            <figcaption className="px-4 py-3 text-xs text-gray-600">
              Long-stay tip: prioritize mat time consistency over “hardest room” ego.
            </figcaption>
          </figure>
        </div>
      </GuideSection>

      <section id="why-bjj" className="mb-14 scroll-mt-24">
        <GuideAccentIntro icon={Users} title="Why train BJJ in Thailand?" subtitle="Grappling + travel" />
        <div className="prose prose-gray max-w-none space-y-4 text-base leading-relaxed text-gray-800 md:prose-lg">
          <p>
            People searching <strong>best BJJ gyms in Thailand</strong> want open mats, coach quality, and schedules that
            survive jet lag—not a renamed kickboxing article. We filter listings so only gyms that tag Brazilian Jiu-Jitsu,
            grappling, or clear BJJ variants appear here, then rank by verified guest feedback.
          </p>
          <p>
            Thailand’s appeal is lifestyle + training density: you can pair grappling with striking tourism, recovery, and
            food—if you pace the workload.
          </p>
        </div>
      </section>

      <GuideSection id="gi-nogi" variant="slate" className="mb-14">
        <h2 className="mb-6 text-2xl font-bold text-gray-900 md:text-3xl">Gi, no-gi, and competition tracks</h2>
        <GuideThreeCards
          items={[
            {
              title: 'Class design',
              body: 'Some gyms split fundamentals and advanced streams; others mix levels. Profiles spell out typical structure when owners provide it.',
            },
            {
              title: 'Hygiene & culture',
              body: 'Mat culture matters—clean gis, trimmed nails, and respectful rolling. Ask about shoe rules off the mat.',
            },
            {
              title: 'Cross-training',
              body: 'If you also want MMA or Muay Thai, verify schedule overlap so you are not double-booking intensity every day.',
            },
          ]}
        />
      </GuideSection>

      <GuideSection id="week-template" variant="slate" className="mb-14">
        <h2 className="mb-4 text-2xl font-bold text-gray-900 md:text-3xl">A realistic 7‑day BJJ training template</h2>
        <p className="mb-6 max-w-3xl text-gray-700">
          If you want to stay longer (and actually improve), build a week you can repeat. This structure works for 1–8 week trips.
        </p>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">Beginner-friendly week</h3>
            <ul className="mt-3 space-y-2 text-sm text-gray-700">
              <li>
                <strong>3–4 classes:</strong> focus on fundamentals + positional sparring.
              </li>
              <li>
                <strong>1 open mat:</strong> controlled rounds, ask questions, don’t chase taps.
              </li>
              <li>
                <strong>2 recovery blocks:</strong> mobility, walking, early sleep.
              </li>
            </ul>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">Competition / cross-training week</h3>
            <ul className="mt-3 space-y-2 text-sm text-gray-700">
              <li>
                <strong>5–6 sessions/week:</strong> alternate hard and technical days.
              </li>
              <li>
                <strong>Protect joints:</strong> tap early; don’t stack max rounds daily.
              </li>
              <li>
                <strong>If you train MMA:</strong> sync no‑gi days with MMA sessions.
              </li>
            </ul>
          </div>
        </div>
      </GuideSection>

      <GuideSection id="budget" variant="default" className="mb-14 border border-gray-200 bg-white">
        <div className="grid gap-8 md:grid-cols-2 md:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#003580]">Budget & packing</p>
            <h2 className="mt-2 text-2xl font-bold text-gray-900 md:text-3xl">How to compare BJJ gyms for a long stay</h2>
            <div className="mt-3 space-y-3 text-base leading-relaxed text-gray-700">
              <p>
                “Best” isn’t just a rank number. Compare <strong>class frequency</strong>, <strong>open mat access</strong>, shower facilities,
                drop-in policy, and whether gi/no‑gi aligns with your goals.
              </p>
              <p>
                For longer trips, total cost is more than membership: laundry, transport, recovery, and how easy it is to show up consistently.
              </p>
            </div>
          </div>
          <figure className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="relative aspect-[4/3] w-full">
              <Image
                src="https://images.unsplash.com/photo-1521412644187-c49fa049e84d?auto=format&fit=crop&w=1400&q=80"
                alt="BJJ gi and belt packed for travel"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 520px"
              />
            </div>
            <figcaption className="px-4 py-3 text-xs text-gray-600">
              Pack basics, then prioritize consistent mat time. That’s where progress comes from.
            </figcaption>
          </figure>
        </div>
      </GuideSection>

      <GuideSection variant="slate" className="mb-14">
        <div className="grid gap-8 md:grid-cols-2 md:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#003580]">Further reading</p>
            <h2 className="mt-2 text-2xl font-bold text-gray-900 md:text-3xl">Rulesets and competition context</h2>
            <p className="mt-3 text-base leading-relaxed text-gray-700">
              If you’re choosing a gym for competition prep, it helps to know which ruleset and format you’re training for.
              Use these as references—then choose a Thailand gym based on schedule, coaching fit, and culture.
            </p>
            <div className="mt-6 grid gap-4">
              <a
                href="https://ibjjf.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                <p className="text-sm font-semibold text-gray-900">IBJJF (reference)</p>
                <p className="mt-1 text-xs text-gray-600">Rule context and terminology for many gi competitions.</p>
                <p className="mt-3 text-xs font-semibold text-[#003580]">Open →</p>
              </a>
              <a
                href="https://adcombat.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                <p className="text-sm font-semibold text-gray-900">ADCC (reference)</p>
                <p className="mt-1 text-xs text-gray-600">Ruleset context for no-gi / submission grappling.</p>
                <p className="mt-3 text-xs font-semibold text-[#003580]">Open →</p>
              </a>
            </div>
          </div>
          <figure className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="relative aspect-[4/3] w-full">
              <Image
                src="https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1400&q=80"
                alt="Gym mat and training space"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 520px"
              />
            </div>
            <figcaption className="px-4 py-3 text-xs text-gray-600">
              Competition prep is about repeatable weeks—choose a schedule you can maintain.
            </figcaption>
          </figure>
        </div>
      </GuideSection>

      <GuideCtaStrip
        title="Browse all BJJ gyms in Thailand"
        subtitle="Filter price, city, and more."
        href="/search?country=Thailand&discipline=BJJ"
        buttonLabel="Open BJJ search"
      />

      <section id="ranked" className="mb-16 scroll-mt-24">
        <h2 className="mb-2 text-2xl font-bold text-gray-900 md:text-3xl">Ranked BJJ gyms</h2>
        <p className="mb-8 max-w-3xl text-gray-600">
          Chunked layout with editorial breaks keeps long-form SEO value high without hiding the directory.
        </p>
        {gyms.length === 0 ? (
          <GuideEmptyState
            title="No BJJ-tagged gyms yet"
            description="Owners should add BJJ / grappling to disciplines. Muay-Thai-only gyms are excluded on purpose."
            searchHref="/search?country=Thailand&discipline=BJJ"
            searchLabel="Search BJJ anyway"
          />
        ) : (
          <ChunkedGymGrid
            gyms={gyms}
            chunkSize={5}
            fallbackImageSrc="/IMG_3557_246c0a62-a253-4f95-abfd-9cb306228c6c.jpg"
            editorialBetweenChunks={EDITORIAL.slice(0, Math.ceil(gyms.length / 5))}
          />
        )}
      </section>

      <GuideSection id="faq" variant="default" className="mb-14 border border-gray-200 bg-white p-6 md:p-8">
        <h2 className="mb-2 text-2xl font-bold text-gray-900 md:text-3xl">FAQ</h2>
        <p className="mb-8 text-gray-600">BJJ traveler questions.</p>
        <GuideFaqList items={FAQ_ITEMS} />
      </GuideSection>

      <RelatedGuides
        guides={[
          { title: 'Best MMA camps in Thailand', href: '/blog/best-mma-camps-thailand' },
          { title: 'Best boxing gyms in Thailand', href: '/blog/best-boxing-gyms-thailand' },
          { title: '25 best Muay Thai camps', href: '/blog/best-muay-thai-camps-thailand-2026' },
        ]}
      />
    </ArticleShell>
  )
}
