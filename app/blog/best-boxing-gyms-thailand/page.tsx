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
import { HandMetal, Sun } from 'lucide-react'

const TITLE = 'Best Boxing Gyms in Thailand (2026)'
const DESCRIPTION =
  'Boxing-only gym rankings in Thailand: real listings, prices, reviews, and long-form advice—separate from Muay Thai roundups.'

export const metadata: Metadata = {
  title: `${TITLE} | Hands & Conditioning | CombatBooking.com`,
  description: DESCRIPTION,
  alternates: { canonical: '/blog/best-boxing-gyms-thailand' },
  openGraph: { title: `${TITLE} - CombatBooking.com`, description: DESCRIPTION, type: 'article' },
  twitter: { card: 'summary_large_image', title: `${TITLE} - CombatBooking.com`, description: DESCRIPTION },
}

function absoluteUrl(path: string) {
  return `https://combatbooking.com${path}`
}

const FAQ_ITEMS = [
  {
    q: 'Is Thailand boxing different from Muay Thai training?',
    a: 'Yes—stance, scoring, and class drills differ. This page filters boxing-tagged gyms so you do not land in a pure Muay Thai camp by mistake.',
  },
  {
    q: 'Do I need fight experience?',
    a: 'Not necessarily. Read profiles for beginner bag classes vs competition teams, and ask about controlled sparring rules.',
  },
  {
    q: 'How are gyms ranked?',
    a: 'Verified Thailand listings with boxing disciplines, sorted by review score and volume—consistent with our other guides.',
  },
  {
    q: 'Is Thailand good for boxing beginners?',
    a: 'It can be. Many gyms welcome beginners, but the mix of fitness boxing vs technique coaching varies. Use profiles to confirm class format, coach feedback, and sparring policy before you commit.',
  },
  {
    q: 'Can I train boxing and Muay Thai on the same trip?',
    a: 'Yes—many travelers do. The key is workload: alternate hard days, protect your hands/wrists, and avoid stacking maximum sparring volume across disciplines.',
  },
  {
    q: 'What gloves should I use for boxing in Thailand?',
    a: 'It depends on gym rules and your bodyweight. Many gyms prefer 14–16oz gloves for sparring. Confirm gear requirements on the gym profile and consider buying locally to avoid luggage weight.',
  },
  {
    q: 'How much does boxing training cost in Thailand?',
    a: 'It varies by city and whether you buy drop-ins, weekly passes, or monthly membership. Use the ranked list to shortlist gyms, then confirm current pricing and package inclusions on each profile.',
  },
  {
    q: 'How long should I stay to improve at boxing?',
    a: 'Two to four weeks of consistent sessions is enough to feel measurable gains in timing and conditioning. Longer stays work best when you manage shoulder/wrist volume and protect sleep.',
  },
  {
    q: 'What should I pack for a boxing training trip?',
    a: 'Wraps, mouthguard, and lightweight training clothes. Many gyms prefer 14–16oz gloves for sparring, but rules vary—confirm on the listing. Consider buying gloves locally to reduce luggage weight.',
  },
]

const EDITORIAL: Array<{ title: string; body: ReactNode }> = [
  {
    title: 'Top boxing picks',
    body: (
      <p>
        Highest momentum in the boxing-filtered set. Compare conditioning emphasis vs technical drilling—some gyms skew
        fitness, others toward amateur competition.
      </p>
    ),
  },
  {
    title: 'Next tier',
    body: (
      <p>
        Still discipline-specific. Check coach credentials, class sizes, and whether mitt work is included in your package.
      </p>
    ),
  },
  {
    title: 'Mid-list',
    body: (
      <p>
        Expand options if your dates conflict with higher-ranked camps or if you need a neighborhood closer to your stay.
      </p>
    ),
  },
  {
    title: 'More gyms',
    body: (
      <p>
        Deep comparison set—useful if you want multiple quotes or trial days before committing to a month-long stay.
      </p>
    ),
  },
  {
    title: 'Final ranks',
    body: (
      <p>
        Completes the shortlist. Cross-trainers can also browse{' '}
        <Link href="/blog/best-mma-camps-thailand" className="font-medium text-[#003580] underline">
          MMA
        </Link>{' '}
        and{' '}
        <Link href="/blog/best-muay-thai-camps-thailand-2026" className="font-medium text-[#003580] underline">
          Muay Thai
        </Link>{' '}
        guides.
      </p>
    ),
  },
]

export default async function BestBoxingGymsThailandPage() {
  const gyms = await getThailandGymsForGuide({ discipline: 'Boxing' })

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
    mainEntityOfPage: absoluteUrl('/blog/best-boxing-gyms-thailand'),
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
      subtitle="Hands, footwork, and conditioning—boxed into a discipline-specific guide competitors cannot copy."
      breadcrumbs={[
        { label: 'Training Guides', href: '/blog' },
        { label: 'Thailand', href: '/search?country=Thailand' },
        { label: 'Boxing', href: '/search?country=Thailand&discipline=Boxing' },
      ]}
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />

      <GuideHero
        imageSrc="/Superbon-Singha-Mawynn-Chingiz-Allazov-ONE-Fight-Night-6-1920X1280-62.jpg"
        imageAlt="Boxing training in Thailand"
        priority
        overlayText="Boxing in Thailand: sharpen timing and cardio without pretending every camp is the same as Muay Thai—this list is boxing-tagged only."
      />

      <GuideLeadRow
        tocItems={[
          { href: '#why-boxing', label: 'Why boxing here' },
          { href: '#striking-mix', label: 'Combine sports' },
          { href: '#week-template', label: 'Week template' },
          { href: '#budget', label: 'Budget & packing' },
          { href: '#ranked', label: 'Ranked gyms' },
          { href: '#faq', label: 'FAQ' },
        ]}
        statValue={gyms.length}
        statDescription="Verified/trusted boxing-tagged gyms ranked on CombatBooking."
        statIcon={<Sun className="h-5 w-5" />}
      />

      <GuideSection variant="slate" className="mb-14">
        <div className="grid gap-8 md:grid-cols-2 md:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#003580]">Boxing training in Thailand</p>
            <h2 className="mt-2 text-2xl font-bold text-gray-900 md:text-3xl">Who this guide is for</h2>
            <div className="mt-3 space-y-3 text-base leading-relaxed text-gray-700">
              <p>
                Searchers who want the <strong>best boxing gyms in Thailand</strong> usually care about hands: jab mechanics,
                footwork, conditioning, and controlled sparring—not clinch-first Muay Thai.
              </p>
              <p>
                Use this list if you’re staying 1–8 weeks and want a boxing base you can stack with MMA or Muay Thai on other
                days without breaking your joints.
              </p>
            </div>
          </div>
          <figure className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="relative aspect-[4/3] w-full">
              <Image
                src="https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?auto=format&fit=crop&w=1400&q=80"
                alt="Boxing gloves close-up"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 520px"
              />
            </div>
            <figcaption className="px-4 py-3 text-xs text-gray-600">
              If your wrists/shoulders flare up, reduce volume before you change gyms—load management beats hype.
            </figcaption>
          </figure>
        </div>
      </GuideSection>

      <section id="why-boxing" className="mb-14 scroll-mt-24">
        <GuideAccentIntro icon={HandMetal} title="Why a boxing-only Thailand guide?" subtitle="Intent + clarity" />
        <div className="prose prose-gray max-w-none space-y-4 text-base leading-relaxed text-gray-800 md:prose-lg">
          <p>
            People searching <strong>best boxing gyms in Thailand</strong> often want Western boxing mechanics, bag rounds,
            and footwork progressions—not a Muay Thai camp with boxing bolted into the title tag. We post-filter listings so
            boxing appears in disciplines, then rank by verified reviews.
          </p>
          <p>
            That clarity helps SEO and travelers: you spend less time decoding whether “fight camp” means elbows and clinch
            or straight punches through the jab.
          </p>
        </div>
      </section>

      <GuideSection id="striking-mix" variant="slate" className="mb-14">
        <h2 className="mb-6 text-2xl font-bold text-gray-900 md:text-3xl">Mixing boxing with Muay Thai or MMA</h2>
        <GuideThreeCards
          items={[
            {
              title: 'Workload',
              body: 'Stacking hard striking sessions daily wears on shoulders and wrists. Plan recovery and sleep—not only gym hours.',
            },
            {
              title: 'Coach communication',
              body: 'Tell coaches if you are cross-training so they manage load and conflicting technique cues.',
            },
            {
              title: 'Gear',
              body: 'Glove weight, wraps, and mouthguard rules differ by gym. Confirm on the profile or message before you pack.',
            },
          ]}
        />
      </GuideSection>

      <GuideSection id="week-template" variant="slate" className="mb-14">
        <h2 className="mb-4 text-2xl font-bold text-gray-900 md:text-3xl">A realistic 7‑day boxing training template</h2>
        <p className="mb-6 max-w-3xl text-gray-700">
          This is a repeatable week for 1–8 week trips. It’s designed to keep hands and shoulders healthy enough to keep training.
        </p>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">Beginner-friendly week</h3>
            <ul className="mt-3 space-y-2 text-sm text-gray-700">
              <li>
                <strong>4 skill sessions:</strong> drills + pads + controlled bag rounds.
              </li>
              <li>
                <strong>1 conditioning day:</strong> roadwork or intervals, easy strength.
              </li>
              <li>
                <strong>1–2 recovery blocks:</strong> mobility + early sleep.
              </li>
            </ul>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">Cross-training week (MMA/Muay Thai)</h3>
            <ul className="mt-3 space-y-2 text-sm text-gray-700">
              <li>
                <strong>Alternate hard days:</strong> don’t stack max sparring across sports.
              </li>
              <li>
                <strong>Protect wrists:</strong> wrap well, scale volume before pain escalates.
              </li>
              <li>
                <strong>1 true rest day:</strong> sustain the trip and avoid burnout.
              </li>
            </ul>
          </div>
        </div>
      </GuideSection>

      <GuideSection id="budget" variant="default" className="mb-14 border border-gray-200 bg-white">
        <div className="grid gap-8 md:grid-cols-2 md:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#003580]">Budget & packing</p>
            <h2 className="mt-2 text-2xl font-bold text-gray-900 md:text-3xl">Compare total value, not just daily price</h2>
            <div className="mt-3 space-y-3 text-base leading-relaxed text-gray-700">
              <p>
                For long stays, “best boxing gym” usually means you can attend consistently. Compare class times, coach feedback,
                and mitt work access—not just a headline price.
              </p>
              <p>
                Total cost includes recovery (massage, nutrition), transport, and whether your accommodation lets you sleep well.
              </p>
            </div>
          </div>
          <figure className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="relative aspect-[4/3] w-full">
              <Image
                src="https://images.unsplash.com/photo-1555597673-b21d5c935865?auto=format&fit=crop&w=1400&q=80"
                alt="Boxing gloves and pads for training"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 520px"
              />
            </div>
            <figcaption className="px-4 py-3 text-xs text-gray-600">
              Pack wraps + mouthguard, then build a week you can repeat.
            </figcaption>
          </figure>
        </div>
      </GuideSection>

      <GuideSection variant="slate" className="mb-14">
        <div className="grid gap-8 md:grid-cols-2 md:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#003580]">Further reading</p>
            <h2 className="mt-2 text-2xl font-bold text-gray-900 md:text-3xl">Boxing rules and scoring context</h2>
            <p className="mt-3 text-base leading-relaxed text-gray-700">
              If you’re choosing a boxing gym for competition prep, you should know which rule set you’re aiming at. Use these
              references as background—then choose a gym based on coaching fit and schedule consistency.
            </p>
            <div className="mt-6 grid gap-4">
              <a
                href="https://en.wikipedia.org/wiki/Boxing"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                <p className="text-sm font-semibold text-gray-900">Boxing (reference)</p>
                <p className="mt-1 text-xs text-gray-600">Terminology, scoring basics, and rules overview.</p>
                <p className="mt-3 text-xs font-semibold text-[#003580]">Open →</p>
              </a>
              <a
                href="https://olympics.com/en/sports/boxing/"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                <p className="text-sm font-semibold text-gray-900">Olympic boxing (reference)</p>
                <p className="mt-1 text-xs text-gray-600">Competition context and rule framing.</p>
                <p className="mt-3 text-xs font-semibold text-[#003580]">Open →</p>
              </a>
            </div>
          </div>
          <figure className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="relative aspect-[4/3] w-full">
              <Image
                src="https://images.unsplash.com/photo-1517438476312-10d79c077509?auto=format&fit=crop&w=1400&q=80"
                alt="Boxing ring ropes and gym lighting"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 520px"
              />
            </div>
            <figcaption className="px-4 py-3 text-xs text-gray-600">
              Better boxing is built on boring repetitions—choose a gym you’ll attend consistently.
            </figcaption>
          </figure>
        </div>
      </GuideSection>

      <GuideCtaStrip
        title="Browse all boxing gyms in Thailand"
        subtitle="Directory filters go beyond this article."
        href="/search?country=Thailand&discipline=Boxing"
        buttonLabel="Open boxing search"
      />

      <section id="ranked" className="mb-16 scroll-mt-24">
        <h2 className="mb-2 text-2xl font-bold text-gray-900 md:text-3xl">Ranked boxing gyms</h2>
        <p className="mb-8 max-w-3xl text-gray-600">
          Editorial blocks between every five gyms add depth for readers and search engines.
        </p>
        {gyms.length === 0 ? (
          <GuideEmptyState
            title="No boxing-tagged gyms yet"
            description="Add Boxing to disciplines on your listing to qualify."
            searchHref="/search?country=Thailand&discipline=Boxing"
            searchLabel="Search boxing anyway"
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
        <p className="mb-8 text-gray-600">Boxing traveler questions.</p>
        <GuideFaqList items={FAQ_ITEMS} />
      </GuideSection>

      <RelatedGuides
        guides={[
          { title: 'Best MMA camps in Thailand', href: '/blog/best-mma-camps-thailand' },
          { title: 'Best BJJ gyms in Thailand', href: '/blog/best-bjj-gyms-thailand' },
          { title: '25 best Muay Thai camps', href: '/blog/best-muay-thai-camps-thailand-2026' },
        ]}
      />
    </ArticleShell>
  )
}
