import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { ArticleShell } from '@/components/guides/article-shell'
import { RelatedGuides } from '@/components/guides/related-guides'
import {
  GuideAccentIntro,
  GuideCtaStrip,
  GuideFaqList,
  GuideHero,
  GuideLeadRow,
  GuideSection,
  GuideThreeCards,
} from '@/components/guides/guide-page-blocks'
import { buildArticleLd, buildBreadcrumbLd, buildFaqLd } from '@/lib/seo/guide-schema'
import { CalendarDays, Hourglass, Timer } from 'lucide-react'

const TITLE = '1-Week vs 1-Month Muay Thai Camp Packages: What to Expect (2026)'
const SEO_TITLE = '1-Week vs 1-Month Muay Thai Camp Thailand 2026 [Compared]'
const PATH = '/blog/muay-thai-camp-1-week-vs-1-month'
const DATE_PUBLISHED = '2026-04-21'
const DATE_MODIFIED = '2026-04-21'
const HERO_IMAGE = '/training-center-1.avif'
const DESCRIPTION =
  'Decide between a 1-week and 1-month Muay Thai camp in Thailand: cost per day, realistic progress, recovery, and who each stay length actually suits.'

export const metadata: Metadata = {
  title: `${SEO_TITLE} | Combatbooking`,
  description: DESCRIPTION,
  alternates: { canonical: PATH },
  openGraph: { title: `${SEO_TITLE} | Combatbooking`, description: DESCRIPTION, type: 'article' },
  twitter: { card: 'summary_large_image', title: `${SEO_TITLE} | Combatbooking`, description: DESCRIPTION },
}

const FAQ_ITEMS = [
  {
    q: 'Is 1 week long enough to train Muay Thai in Thailand?',
    a: 'It is long enough to get a meaningful taste, improve a handful of technical details, and experience Thai training culture. It is not long enough for body composition change, significant skill development, or fight preparation.',
  },
  {
    q: 'How much progress do you actually make in a month?',
    a: 'Most people who train consistently for a full month see visible improvement in stance, kick mechanics, pad timing, and conditioning. Sparring composure usually starts to settle around weeks 3&ndash;4.',
  },
  {
    q: 'Is a 1-month package cheaper per day than 1 week?',
    a: 'Almost always. Gyms discount weekly and monthly packages significantly compared to drop-in and daily rates. A month often costs 2.5&ndash;3x a week, not 4x.',
  },
  {
    q: 'Can I do a 1-week camp as a total beginner?',
    a: 'Yes, if you manage expectations. Stick to one session per day, avoid sparring, and use the week to learn the rhythm rather than chase conditioning gains. You will leave sore but educated.',
  },
  {
    q: 'Is 2 weeks a better middle ground?',
    a: 'Often, yes. Two weeks is long enough to start consolidating technique without the recovery demands of a full month. Many first-time trainees book 14 days and stay longer if they love it.',
  },
  {
    q: 'Do camps let you start a 1-month package on any day?',
    a: 'Most gyms do. Some run structured Monday-to-Saturday blocks and prefer you to start on a Monday. Ask before you book flights.',
  },
  {
    q: 'What happens if I get injured in week 1 of a 1-month stay?',
    a: 'Talk to your coach immediately. Good camps will adjust&mdash;lighter pads, bag-only work, technique days&mdash;so you can keep training around the injury. Travel insurance with physio coverage helps.',
  },
  {
    q: 'Can I extend from 1 week to 1 month once I arrive?',
    a: 'Usually yes, and many gyms will re-price the remainder at weekly or monthly rates. You may also need to extend your visa&mdash;check that before you commit.',
  },
]

export default function OneWeekVsOneMonthPage() {
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
      subtitle="A week gets you a taste. A month changes you. Here is exactly what each stay length delivers&mdash;and what it does not."
      breadcrumbs={[
        { label: 'Training Guides', href: '/blog' },
        { label: 'Thailand', href: '/search?country=Thailand' },
      ]}
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      <GuideHero
        imageSrc={HERO_IMAGE}
        imageAlt="Muay Thai training ring in Thailand"
        priority
        overlayText="The gap between a 7-day Muay Thai holiday and a 30-day Muay Thai camp is not linear. Four weeks is not four times as much training—it is a different experience."
      />

      <GuideLeadRow
        tocItems={[
          { href: '#comparison', label: 'At a glance' },
          { href: '#one-week', label: 'The 1-week camp' },
          { href: '#one-month', label: 'The 1-month camp' },
          { href: '#progress', label: 'Realistic progress curve' },
          { href: '#cost-per-day', label: 'Cost per day' },
          { href: '#who-picks-what', label: 'Who should pick what' },
          { href: '#faq', label: 'FAQ' },
        ]}
        statValue="30 days"
        statDescription="The stay length where most first-time trainees report feeling they left a different person than they arrived."
        statIcon={<CalendarDays className="h-5 w-5" />}
      />

      <section id="comparison" className="mb-14 scroll-mt-24">
        <GuideAccentIntro icon={Hourglass} title="1 week vs 1 month at a glance" subtitle="The short answer" />
        <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-sm">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
              <tr>
                <th className="px-4 py-3">Dimension</th>
                <th className="px-4 py-3">1 week</th>
                <th className="px-4 py-3">1 month</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white text-gray-800">
              {[
                ['Total training sessions', '~8–12', '~40–55'],
                ['Realistic technique change', 'Minor', 'Significant'],
                ['Conditioning change', 'Minimal', 'Visible'],
                ['Sparring readiness', 'Usually no', 'Often yes, if coached'],
                ['Jet lag impact', 'Eats 1–2 days of trip', 'Absorbed by week 1'],
                ['Cost per training day', 'Highest', 'Lowest'],
                ['Gear payoff', 'Minimal', 'Full ROI'],
                ['Recovery planning', 'Optional', 'Mandatory'],
                ['Burnout risk', 'Low', 'Medium–High'],
                ['Best for', 'Tasters, breaks, reset', 'Skill building, lifestyle'],
              ].map(([d, w, m]) => (
                <tr key={d}>
                  <td className="px-4 py-3 font-semibold">{d}</td>
                  <td className="px-4 py-3">{w}</td>
                  <td className="px-4 py-3">{m}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <GuideSection id="one-week" variant="slate" className="mb-14">
        <div className="grid gap-8 md:grid-cols-2 md:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#003580]">Short &amp; punchy</p>
            <h2 className="mt-2 text-2xl font-bold text-gray-900 md:text-3xl">What the 1-week camp actually delivers</h2>
            <div className="mt-3 space-y-3 text-base leading-relaxed text-gray-700">
              <p>
                A 1-week Muay Thai camp in Thailand is honestly a <strong>flavored holiday</strong>, and that is not an insult. It is an excellent introduction: you experience Thai training culture, meet coaches, work on 3&ndash;5 technical cues, and come home with a clear idea of whether you want to return for longer.
              </p>
              <p>
                Do not expect body composition change, real sparring confidence, or fight prep. Do expect shin bruises, an overhauled opinion of your conditioning, and a list of drills to take home.
              </p>
              <p>
                <strong>One-week trip tactic:</strong> one session per day, every day, plus one optional morning run. Avoid two-a-days unless you already train hard at home&mdash;you will wreck your last three days.
              </p>
            </div>
          </div>
          <figure className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="relative aspect-[4/3] w-full">
              <Image
                src="/blog14_p13_9f088f99a5.webp"
                alt="Muay Thai short-stay camp training"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 520px"
              />
            </div>
            <figcaption className="px-4 py-3 text-xs text-gray-600">
              A week is a taster. Plan it like one and you will actually enjoy it.
            </figcaption>
          </figure>
        </div>
      </GuideSection>

      <GuideSection id="one-month" variant="default" className="mb-14 border border-gray-200 bg-white">
        <div className="grid gap-8 md:grid-cols-2 md:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#003580]">Transformational</p>
            <h2 className="mt-2 text-2xl font-bold text-gray-900 md:text-3xl">What the 1-month camp actually delivers</h2>
            <div className="mt-3 space-y-3 text-base leading-relaxed text-gray-700">
              <p>
                A month is where Muay Thai in Thailand starts to become a skill instead of an experience. By day 21, your stance is quieter, your kicks land cleaner, your clinch feels less chaotic, and you understand why Thai coaches drill the same 4 combos forever.
              </p>
              <p>
                The cost structure also shifts. Training packages get cheaper per day, gear pays itself off, and food becomes routine instead of tourism. The main risk is not cost&mdash;it is burnout. Week 3 is when most first-timers hit a wall.
              </p>
              <p>
                <strong>Month-long tactic:</strong> build the week like a training block, not a holiday. One protected rest day. Roadwork 3x per week. Sparring only when your coach invites you. See the{' '}
                <Link href="/blog/beginners-guide-muay-thai-chiang-mai" className="font-medium text-[#003580] underline">beginner Chiang Mai guide</Link>{' '}
                for a week-by-week template that carries across cities.
              </p>
            </div>
          </div>
          <figure className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="relative aspect-[4/3] w-full">
              <Image
                src="/Khun_3_c4e13bdce8_c0b7f8b5b5.avif"
                alt="Long-stay Muay Thai training in Thailand"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 520px"
              />
            </div>
            <figcaption className="px-4 py-3 text-xs text-gray-600">
              A month earns you depth&mdash;but only if you respect recovery.
            </figcaption>
          </figure>
        </div>
      </GuideSection>

      <section id="progress" className="mb-14 scroll-mt-24">
        <h2 className="mb-6 text-2xl font-bold text-gray-900 md:text-3xl">Realistic progress curve (per week)</h2>
        <GuideThreeCards
          items={[
            {
              title: 'Week 1',
              body: 'Adaptation. You are fighting heat, soreness, new rhythm. Big technical gains are unusual&mdash;focus on stance, teep, and pad basics.',
            },
            {
              title: 'Weeks 2–3',
              body: 'The cliff. Technique starts to stick. Your third session of the week feels different from your first. This is why a month matters.',
            },
            {
              title: 'Week 4',
              body: 'Consolidation. Drop novelty and repeat your cleanest 3&ndash;4 combos. You will leave with something portable, not just memories.',
            },
          ]}
        />
      </section>

      <GuideSection id="cost-per-day" variant="slate" className="mb-14">
        <div className="grid gap-8 md:grid-cols-2 md:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#003580]">Cost per day</p>
            <h2 className="mt-2 text-2xl font-bold text-gray-900 md:text-3xl">Why the month is cheaper per training day</h2>
            <div className="mt-3 space-y-3 text-base leading-relaxed text-gray-700">
              <p>
                Gyms price longer stays to fill their floor predictably. A monthly training package in Thailand typically costs around 2.5&ndash;3x a weekly package, not 4x. Accommodation and food also cheapen per day&mdash;monthly apartments are dramatically cheaper than nightly hotels, and you stop eating like a tourist by week two.
              </p>
              <p>
                The practical result: the incremental cost of your <em>second</em> week is lower than the first, and the third and fourth weeks cost even less per day. For a full breakdown, see the{' '}
                <Link href="/blog/muay-thai-camp-thailand-cost" className="font-medium text-[#003580] underline">Thailand Muay Thai camp cost guide</Link>{' '}
                with the 2026 summary table.
              </p>
            </div>
          </div>
          <figure className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="relative aspect-[4/3] w-full">
              <Image
                src="/N-8427.jpeg.avif"
                alt="Muay Thai long-stay camp accommodation"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 520px"
              />
            </div>
            <figcaption className="px-4 py-3 text-xs text-gray-600">
              Long stays compound&mdash;training costs, rent, and food all scale better than a week.
            </figcaption>
          </figure>
        </div>
      </GuideSection>

      <section id="who-picks-what" className="mb-14 scroll-mt-24">
        <h2 className="mb-6 text-2xl font-bold text-gray-900 md:text-3xl">Who should pick which</h2>
        <GuideThreeCards
          items={[
            {
              title: 'Pick 1 week if…',
              body: 'You are layering Muay Thai on a wider Thailand trip, testing the sport before a bigger commitment, or using training as a reset between work sprints.',
            },
            {
              title: 'Pick 2 weeks if…',
              body: 'You want meaningful technical change without the recovery demands of a full month. Often the sweet spot for working professionals.',
            },
            {
              title: 'Pick 1 month if…',
              body: 'You want real skill change, have the time and visa room, and are willing to treat it as a structured training block, not a vacation.',
            },
          ]}
        />
      </section>

      <GuideSection variant="amber" className="mb-14">
        <div className="flex items-start gap-4">
          <Timer className="mt-1 h-8 w-8 shrink-0 text-[#003580]" aria-hidden />
          <div>
            <h2 className="text-2xl font-bold text-gray-900 md:text-3xl">The honest bias: book longer if you can</h2>
            <p className="mt-3 text-sm leading-relaxed text-gray-800">
              Almost nobody who does a full month regrets it. Plenty of people who do a week regret not staying longer. If the visa and logistics allow it, book for three to four weeks&mdash;you can always cut short a week if needed, but you cannot retroactively add training days to a week-long trip.
            </p>
          </div>
        </div>
      </GuideSection>

      <GuideCtaStrip
        title="Compare packages across verified Thailand camps"
        subtitle="Filter weekly and monthly rates across every major training city."
        href="/search?country=Thailand&discipline=Muay%20Thai"
        buttonLabel="Find your camp"
      />

      <GuideSection id="faq" variant="default" padding="p-6 md:p-8" className="mb-14 shadow-sm">
        <h2 className="mb-2 text-2xl font-bold text-gray-900 md:text-3xl">FAQ</h2>
        <p className="mb-8 text-gray-600">The stay-length questions travelers actually ask.</p>
        <GuideFaqList items={FAQ_ITEMS} />
      </GuideSection>

      <RelatedGuides
        guides={[
          { title: 'How much does a Muay Thai camp in Thailand cost?', href: '/blog/muay-thai-camp-thailand-cost' },
          { title: "A beginner's guide to Muay Thai in Chiang Mai", href: '/blog/beginners-guide-muay-thai-chiang-mai' },
          { title: '25 best Muay Thai camps in Thailand (2026)', href: '/blog/best-muay-thai-camps-thailand-2026' },
          { title: 'Thailand training visa / DTV guide', href: '/blog/thailand-training-visa-dtv' },
        ]}
      />
    </ArticleShell>
  )
}
