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
import { Zap, Sun, Target } from 'lucide-react'

const TITLE = 'Best Kickboxing Gyms in Thailand (2026)'
const SEO_TITLE = 'Best Kickboxing Gyms in Thailand 2026 [Prices + Reviews]'
const PATH = '/blog/best-kickboxing-gyms-thailand'
const DATE_PUBLISHED = '2025-10-15'
const DATE_MODIFIED = '2026-04-20'
const HERO_IMAGE = 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?auto=format&fit=crop&w=1400&q=80'
const DESCRIPTION =
  'Kickboxing gyms in Thailand: ranked by reviews with real listings, photos, and planning advice. Discipline-filtered so you do not land in a Muay-Thai-only camp by mistake.'

export const metadata: Metadata = {
  title: `${SEO_TITLE} | Combatbooking`,
  description: DESCRIPTION,
  alternates: { canonical: PATH },
  openGraph: { title: `${SEO_TITLE} | Combatbooking`, description: DESCRIPTION, type: 'article' },
  twitter: { card: 'summary_large_image', title: `${SEO_TITLE} | Combatbooking`, description: DESCRIPTION },
}

const FAQ_ITEMS = [
  {
    q: 'Is kickboxing different from Muay Thai in Thailand?',
    a: 'Yes. Muay Thai uses clinch, elbows, knees, and different scoring. Kickboxing gyms often emphasize boxing + kicks and different sparring rhythms. This guide filters for kickboxing-tagged listings to match intent.',
  },
  {
    q: 'Can I train kickboxing and Muay Thai on the same trip?',
    a: 'Yes—many travelers do. The key is load management: alternate hard sparring days, protect shins/wrists, and plan recovery so you can stay consistent for weeks.',
  },
  {
    q: 'Are these rankings paid placements?',
    a: 'No. Rankings are driven by verified/trusted listings on CombatBooking and sorted primarily by review score and review volume, so community feedback matters.',
  },
  {
    q: 'How much does kickboxing training cost in Thailand?',
    a: 'Prices vary by city and package type. Use the ranked list to shortlist gyms, then confirm current rates and inclusions on each gym profile.',
  },
  {
    q: 'Is Thailand good for kickboxing beginners?',
    a: 'It can be. Many gyms welcome beginners, but intensity and sparring culture vary. Look for fundamentals blocks, coach feedback, and optional sparring policies on the gym profile.',
  },
  {
    q: 'What gear should I bring for kickboxing in Thailand?',
    a: 'Wraps, mouthguard, and lightweight training clothes are the essentials. Many travelers buy gloves/shin guards locally to reduce luggage weight—confirm gym gear rules and sparring expectations before you pack.',
  },
  {
    q: 'How long should I stay to improve in kickboxing?',
    a: 'Most people feel real progress after 2–4 weeks of consistent training and recovery. Longer stays work best when you keep intensity sustainable and protect sleep.',
  },
  {
    q: 'Do these rankings include Muay Thai gyms that also offer kickboxing?',
    a: 'Only if the listing clearly tags kickboxing. This guide is discipline-filtered to match kickboxing intent; Muay-Thai-only camps are excluded on purpose.',
  },
]

const EDITORIAL: Array<{ title: string; body: ReactNode }> = [
  {
    title: 'Top kickboxing picks',
    body: (
      <p>
        Highest review momentum among kickboxing-tagged listings. Compare class structure (pads, drills, sparring) and
        whether beginners have a fundamentals track.
      </p>
    ),
  },
  {
    title: 'Next tier',
    body: <p>Still discipline-filtered. Differences are often review volume and recency, not legitimacy.</p>,
  },
  {
    title: 'Mid-list',
    body: <p>Good options when you need specific dates, neighborhoods, or pricing—open profiles and compare schedules.</p>,
  },
  {
    title: 'More gyms',
    body: <p>Use these to widen your shortlist beyond generic “top 5” listicles.</p>,
  },
  {
    title: 'Final ranks',
    body: <p>Completes the ranked set so you can compare more than the usual few names on the internet.</p>,
  },
]

export default async function BestKickboxingGymsThailandPage() {
  const gyms = await getThailandGymsForGuide({ discipline: 'Kickboxing' })

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
      subtitle="Kickboxing-specific rankings and planning advice—built for the search term “best kickboxing gyms Thailand,” not recycled Muay Thai lists."
      breadcrumbs={[
        { label: 'Training Guides', href: '/blog' },
        { label: 'Thailand', href: '/search?country=Thailand' },
        { label: 'Kickboxing', href: '/search?country=Thailand&discipline=Kickboxing' },
      ]}
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      <GuideHero
        imageSrc={HERO_IMAGE}
        imageAlt="Kickboxing gloves and training gear"
        priority
        overlayText="Kickboxing in Thailand: sharpen hands + kicks with discipline-filtered rankings, schedules, and honest planning advice."
      />

      <GuideLeadRow
        tocItems={[
          { href: '#why-kickboxing', label: 'Why kickboxing here' },
          { href: '#how-to-choose', label: 'How to choose' },
          { href: '#week-template', label: 'Week template' },
          { href: '#budget', label: 'Budget & packing' },
          { href: '#ranked', label: 'Ranked gyms' },
          { href: '#faq', label: 'FAQ' },
        ]}
        statValue={gyms.length}
        statDescription="Verified/trusted kickboxing-tagged gyms in Thailand on CombatBooking."
        statIcon={<Target className="h-5 w-5" />}
      />

      <section id="why-kickboxing" className="mb-14 scroll-mt-24">
        <GuideAccentIntro icon={Zap} title="Why a kickboxing-only Thailand guide?" subtitle="Intent + clarity" />
        <div className="prose prose-gray max-w-none space-y-4 text-base leading-relaxed text-gray-800 md:prose-lg">
          <p>
            “Kickboxing Thailand” searches usually mean one thing: boxing mechanics plus kicks, with a training rhythm that
            is not necessarily clinch-first Muay Thai. This page keeps intent clean by pulling only kickboxing-tagged
            listings and ranking them by review signals.
          </p>
          <p>
            If you want elbows, knees, and clinch as the primary focus, use our Muay Thai hubs. If you want a kickboxing
            base you can cross-train with MMA or boxing, start here.
          </p>
        </div>
      </section>

      <GuideSection id="how-to-choose" variant="slate" className="mb-14">
        <h2 className="mb-6 text-2xl font-bold text-gray-900 md:text-3xl">How to choose a kickboxing gym in Thailand</h2>
        <GuideThreeCards
          items={[
            {
              title: 'Class structure',
              body: 'Look for a repeatable weekly plan: drills, pads, conditioning, and optional sparring you can scale as you adapt.',
            },
            {
              title: 'Sparring culture',
              body: 'Hard sparring is not required for progress. Confirm beginner tracks and supervision policies on the gym profile.',
            },
            {
              title: 'Cross-training fit',
              body: 'If you’re mixing MMA/boxing/Muay Thai, plan intensity so your joints survive a long stay.',
            },
          ]}
        />
      </GuideSection>

      <GuideSection id="week-template" variant="slate" className="mb-14">
        <h2 className="mb-4 text-2xl font-bold text-gray-900 md:text-3xl">A realistic 7‑day kickboxing training template</h2>
        <p className="mb-6 max-w-3xl text-gray-700">
          This routine is built for travelers staying 1–4 weeks who want results without burning out.
        </p>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">Week 1 (adaptation)</h3>
            <ul className="mt-3 space-y-2 text-sm text-gray-700">
              <li>
                <strong>Mon–Fri:</strong> 1 skill session/day (pads + drills) + mobility; early sleep.
              </li>
              <li>
                <strong>Sat:</strong> technique + light conditioning; errands/laundry.
              </li>
              <li>
                <strong>Sun:</strong> full rest.
              </li>
            </ul>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">Week 2+ (progress)</h3>
            <ul className="mt-3 space-y-2 text-sm text-gray-700">
              <li>
                <strong>4–6 days/week:</strong> 1–2 sessions/day based on recovery.
              </li>
              <li>
                <strong>Sparring:</strong> keep it controlled; technical rounds beat ego rounds.
              </li>
              <li>
                <strong>1 recovery day:</strong> protect shins, wrists, and sleep.
              </li>
            </ul>
          </div>
        </div>
      </GuideSection>

      <GuideSection id="budget" variant="slate" className="mb-14">
        <div className="grid gap-8 md:grid-cols-2 md:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#003580]">Budget & packing</p>
            <h2 className="mt-2 text-2xl font-bold text-gray-900 md:text-3xl">How to compare gyms without getting misled</h2>
            <div className="mt-3 space-y-3 text-base leading-relaxed text-gray-700">
              <p>
                The “best kickboxing gym Thailand” choice is rarely about a single number. Compare total value: schedule fit,
                coach feedback frequency, included private sessions, and how easy it is to attend consistently.
              </p>
              <p>
                For longer stays, don’t forget recovery costs (massage, nutrition, rest days). Those details influence your
                results more than hype.
              </p>
            </div>
          </div>
          <figure className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="relative aspect-[4/3] w-full">
              <Image
                src="https://images.unsplash.com/photo-1555597673-b21d5c935865?auto=format&fit=crop&w=1400&q=80"
                alt="Kickboxing gloves and pads"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 520px"
              />
            </div>
            <figcaption className="px-4 py-3 text-xs text-gray-600">
              The best gym is the one you can attend consistently for weeks.
            </figcaption>
          </figure>
        </div>
      </GuideSection>

      <GuideSection variant="default" className="mb-14 border border-gray-200 bg-white">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#003580]">Further reading</p>
        <h2 className="mt-2 text-2xl font-bold text-gray-900 md:text-3xl">Kickboxing references</h2>
        <p className="mt-3 max-w-3xl text-base leading-relaxed text-gray-700">
          These are useful for terminology and rule context. Your best gym choice still comes from schedules, coaching fit, and
          consistent attendance.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <a
            href="https://en.wikipedia.org/wiki/Kickboxing"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
          >
            <p className="text-sm font-semibold text-gray-900">Kickboxing (reference)</p>
            <p className="mt-1 text-xs text-gray-600">Terminology and history overview.</p>
            <p className="mt-3 text-xs font-semibold text-[#003580]">Open →</p>
          </a>
          <a
            href="https://www.wako.sport/"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
          >
            <p className="text-sm font-semibold text-gray-900">WAKO (reference)</p>
            <p className="mt-1 text-xs text-gray-600">Kickboxing federation and competition context.</p>
            <p className="mt-3 text-xs font-semibold text-[#003580]">Open →</p>
          </a>
        </div>
      </GuideSection>

      <GuideCtaStrip
        title="Browse all kickboxing gyms in Thailand"
        subtitle="Filter by city and compare listings beyond this article."
        href="/search?country=Thailand&discipline=Kickboxing"
        buttonLabel="Open kickboxing search"
      />

      <section id="ranked" className="mb-16 scroll-mt-24">
        <h2 className="mb-2 text-2xl font-bold text-gray-900 md:text-3xl">Ranked kickboxing gyms</h2>
        <p className="mb-8 max-w-3xl text-gray-600">
          This list is discipline-filtered and sorted by review signals. We break it into sections so it reads like a guide.
        </p>
        {gyms.length === 0 ? (
          <GuideEmptyState
            title="No kickboxing-tagged gyms yet"
            description="Owners should add Kickboxing to disciplines to qualify. Muay-Thai-only gyms are excluded on purpose."
            searchHref="/search?country=Thailand&discipline=Kickboxing"
            searchLabel="Search anyway"
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
        <p className="mb-8 text-gray-600">Kickboxing travel questions that come up in search.</p>
        <GuideFaqList items={FAQ_ITEMS} />
      </GuideSection>
      <GuideCtaStrip
        title="Ready to pick your Thailand kickboxing gym?"
        subtitle="Filter every verified Thailand kickboxing gym by price, dates, and striking style — book directly."
        href="/search?country=Thailand&discipline=Kickboxing"
        buttonLabel="Find your kickboxing gym"
      />



      <RelatedGuides
        guides={[
          { title: '25 best Muay Thai camps in Thailand (2026)', href: '/blog/best-muay-thai-camps-thailand-2026' },
          { title: 'Best boxing gyms in Thailand', href: '/blog/best-boxing-gyms-thailand' },
          { title: 'Best MMA camps in Thailand', href: '/blog/best-mma-camps-thailand' },
          { title: 'Thailand training visa / DTV', href: '/blog/thailand-training-visa-dtv' },
        ]}
      />
    </ArticleShell>
  )
}

