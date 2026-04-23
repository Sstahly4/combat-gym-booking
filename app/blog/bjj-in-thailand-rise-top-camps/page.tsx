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
import { Swords, TrendingUp } from 'lucide-react'

const TITLE = 'The Rise of Brazilian Jiu-Jitsu in Thailand: Top Camps to Visit (2026)'
const SEO_TITLE = 'BJJ in Thailand 2026 [Top Camps + Why It Is Growing]'
const PATH = '/blog/bjj-in-thailand-rise-top-camps'
const DATE_PUBLISHED = '2026-04-21'
const DATE_MODIFIED = '2026-04-21'
const HERO_IMAGE = '/tjj8r5ovjts8nhqjhkqc.avif'
const DESCRIPTION =
  'How BJJ in Thailand grew from a handful of mats to a real training destination. Top camps in Bangkok, Phuket, Chiang Mai, and the islands—plus what to expect on the mats.'

export const metadata: Metadata = {
  title: `${SEO_TITLE} | CombatStay`,
  description: DESCRIPTION,
  alternates: { canonical: PATH },
  openGraph: { title: `${SEO_TITLE} | CombatStay`, description: DESCRIPTION, type: 'article' },
  twitter: { card: 'summary_large_image', title: `${SEO_TITLE} | CombatStay`, description: DESCRIPTION },
}

const FAQ_ITEMS = [
  {
    q: 'Is BJJ good in Thailand compared to Brazil or the US?',
    a: 'Top Thai-based academies have black belts from established lineages and regular international rolling. It is not Brazil, but the quality at the better camps is genuinely high and improving fast.',
  },
  {
    q: 'Can I cross-train Muay Thai and BJJ in Thailand?',
    a: 'Yes&mdash;many camps, particularly MMA-focused ones, offer both under one roof. Some travelers split their stay between a Muay Thai camp and a BJJ academy in the same city.',
  },
  {
    q: 'Where is the best BJJ in Thailand?',
    a: 'Bangkok has the most academies and the deepest black-belt bench. Phuket has strong MMA-crossover gyms. Chiang Mai and the islands have smaller but legitimate scenes. It depends on what you are optimizing for.',
  },
  {
    q: 'Do I need gi and no-gi gear?',
    a: 'Bring a gi if you roll in one at home. No-gi clothing (rash guards, shorts) is cheap and available locally. Many academies offer both classes; some lean heavily toward one format.',
  },
  {
    q: 'Are drop-in fees normal at Thai BJJ gyms?',
    a: 'Yes. Most academies sell single classes, weekly passes, and monthly memberships. Weekly passes are usually the best value for travelers staying 7&ndash;14 days.',
  },
  {
    q: 'Is there an open mat culture in Thailand?',
    a: 'In Bangkok and parts of Phuket, yes. Open mats are a great way to meet training partners and compare styles. Smaller towns may not run formal open mats.',
  },
  {
    q: 'What is the competition scene like?',
    a: 'Thailand hosts regional IBJJF, ADCC-style, and local tournaments across the year. If you are travel-training, you can often time a visit around a local comp&mdash;check academy Instagram feeds for dates.',
  },
  {
    q: 'Is BJJ safer than Muay Thai for long trips?',
    a: 'Injury profiles differ&mdash;BJJ is lower on concussion risk, higher on joint/soft-tissue strain. Neither is risk-free. For multi-week stays, work in rest days and technical drilling blocks regardless of discipline.',
  },
]

export default function BjjRiseThailandPage() {
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
      subtitle="Five years ago, &ldquo;Thailand BJJ&rdquo; meant one or two academies in Bangkok. Today it means a legitimate national scene—here is why, where, and how to train."
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
        imageAlt="Brazilian Jiu-Jitsu training at a Thailand BJJ academy"
        priority
        overlayText="Thailand is no longer just a Muay Thai destination—its BJJ scene has grown into a real, visit-worthy grappling ecosystem."
      />

      <GuideLeadRow
        tocItems={[
          { href: '#why-growing', label: 'Why BJJ is growing' },
          { href: '#bangkok', label: 'Bangkok BJJ' },
          { href: '#phuket', label: 'Phuket BJJ' },
          { href: '#chiang-mai-islands', label: 'Chiang Mai &amp; islands' },
          { href: '#what-to-expect', label: 'What to expect' },
          { href: '#cross-training', label: 'Cross-training Muay Thai + BJJ' },
          { href: '#faq', label: 'FAQ' },
        ]}
        statValue="4 cities"
        statDescription="Legitimate BJJ training hubs in Thailand&mdash;Bangkok, Phuket, Chiang Mai, and the Samui/Phangan islands."
        statIcon={<TrendingUp className="h-5 w-5" />}
      />

      <section id="why-growing" className="mb-14 scroll-mt-24">
        <GuideAccentIntro icon={TrendingUp} title="Why BJJ exploded in Thailand" subtitle="Three converging trends" />
        <div className="prose prose-gray max-w-none space-y-4 text-base leading-relaxed text-gray-800 md:prose-lg">
          <p>
            Three forces created the current Thailand BJJ scene: <strong>ONE Championship</strong>, which raised the profile of grappling across Southeast Asia; <strong>MMA-focused camps</strong> like Tiger Muay Thai and others in Phuket, which integrated BJJ deeply into their schedules; and <strong>the digital-nomad migration</strong>, which brought a wave of consistent, gi-wearing training partners to Thailand for months at a time.
          </p>
          <p>
            Add in black belts relocating full-time, regional IBJJF-style competitions, and better gi shops&mdash;and you have a scene that has matured from &ldquo;try a class while you&rsquo;re here&rdquo; to &ldquo;plan a real training block.&rdquo;
          </p>
          <p>
            The growth is most visible in <strong>Bangkok</strong>, where the density of academies rivals any second-tier global BJJ market, and in <strong>Phuket</strong>, where MMA camps have deepened their grappling programs in parallel with their striking.
          </p>
        </div>
      </section>

      <GuideSection id="bangkok" variant="slate" className="mb-14">
        <div className="grid gap-8 md:grid-cols-2 md:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#003580]">Capital density</p>
            <h2 className="mt-2 text-2xl font-bold text-gray-900 md:text-3xl">Bangkok: the depth of the Thai BJJ scene</h2>
            <div className="mt-3 space-y-3 text-base leading-relaxed text-gray-700">
              <p>
                Bangkok has the largest concentration of BJJ academies in Thailand, with a real mix of lineages, gi and no-gi specialists, and a rolling open-mat culture. Sukhumvit, Silom, and Thonglor all host multiple gyms within a short commute, and most academies run evening classes that fit around a workday.
              </p>
              <p>
                For travelers staying 1&ndash;3 weeks, Bangkok lets you sample different coaching styles in a single trip. For longer stays, pick one home academy and use open mats at others to expand your rolling partner pool.
              </p>
              <p>
                See ranked options in the <Link href="/blog/best-bjj-gyms-thailand" className="font-medium text-[#003580] underline">best BJJ gyms in Thailand</Link> guide, then filter by Bangkok on the{' '}
                <Link href="/search?country=Thailand&location=Bangkok&discipline=BJJ" className="font-medium text-[#003580] underline">BJJ Bangkok search page</Link>.
              </p>
            </div>
          </div>
          <figure className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="relative aspect-[4/3] w-full">
              <Image
                src="https://images.unsplash.com/photo-1545231097-cbd1d5ebee26?auto=format&fit=crop&w=1400&q=80"
                alt="Bangkok skyline near BJJ training districts"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 520px"
              />
            </div>
            <figcaption className="px-4 py-3 text-xs text-gray-600">
              Bangkok is where Thai BJJ is deepest&mdash;multiple academies per district and real open-mat culture.
            </figcaption>
          </figure>
        </div>
      </GuideSection>

      <GuideSection id="phuket" variant="default" className="mb-14 border border-gray-200 bg-white">
        <div className="grid gap-8 md:grid-cols-2 md:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#003580]">MMA crossover</p>
            <h2 className="mt-2 text-2xl font-bold text-gray-900 md:text-3xl">Phuket: BJJ inside the big MMA camps</h2>
            <div className="mt-3 space-y-3 text-base leading-relaxed text-gray-700">
              <p>
                Phuket&rsquo;s BJJ scene is anchored inside the island&rsquo;s MMA camps, which have built genuine grappling programs alongside their Muay Thai and MMA schedules. For travelers who want to train both striking and grappling daily in the same facility, Phuket is still the country&rsquo;s best single-stop destination.
              </p>
              <p>
                The trade-off is that Phuket BJJ often follows an MMA rhythm: heavy no-gi presence, wrestling integration, and schedules built around big camp weeks. If you are a pure gi player, you may prefer Bangkok.
              </p>
              <p>
                Compare specific Phuket options on the <Link href="/blog/best-mma-camps-thailand" className="font-medium text-[#003580] underline">best MMA camps in Thailand</Link> guide and filter the{' '}
                <Link href="/search?country=Thailand&location=Phuket&discipline=BJJ" className="font-medium text-[#003580] underline">Phuket BJJ listings</Link>.
              </p>
            </div>
          </div>
          <figure className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="relative aspect-[4/3] w-full">
              <Image
                src="/Superbon-Singha-Mawynn-Chingiz-Allazov-ONE-Fight-Night-6-1920X1280-62.jpg"
                alt="ONE Championship fight night, reflecting grappling and striking culture"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 520px"
              />
            </div>
            <figcaption className="px-4 py-3 text-xs text-gray-600">
              Phuket&rsquo;s BJJ scene is wired into the island&rsquo;s MMA infrastructure.
            </figcaption>
          </figure>
        </div>
      </GuideSection>

      <GuideSection id="chiang-mai-islands" variant="slate" className="mb-14">
        <h2 className="mb-6 text-2xl font-bold text-gray-900 md:text-3xl">Chiang Mai &amp; the islands: smaller but growing</h2>
        <GuideThreeCards
          items={[
            {
              title: 'Chiang Mai',
              body: 'Fewer academies, but a consistent long-stay trainee base and a digital-nomad community that fills mats reliably. Good for 2&ndash;4 week blocks blended with Muay Thai.',
            },
            {
              title: 'Koh Phangan &amp; Koh Samui',
              body: 'Small but real scenes&mdash;often one to two serious academies per island, with open mat culture and decent coaching. Best for combining BJJ with island lifestyle.',
            },
            {
              title: 'Koh Tao',
              body: 'Very limited BJJ. If grappling is your main goal, Koh Tao is usually the wrong island. It is better for Muay Thai and diving than BJJ.',
            },
          ]}
        />
      </GuideSection>

      <section id="what-to-expect" className="mb-14 scroll-mt-24">
        <GuideAccentIntro icon={Swords} title="What to expect on the mats in Thailand" subtitle="Culture, intensity, and etiquette" />
        <div className="prose prose-gray max-w-none space-y-4 text-base leading-relaxed text-gray-800 md:prose-lg">
          <p>
            Thai BJJ academies are overwhelmingly international. You will roll with Brazilian, European, American, Australian, Korean, Japanese, and Thai training partners in the same session. The etiquette is the same global BJJ etiquette&mdash;bow to the mat, tap early, listen to the coach&mdash;but the rolling diversity is a real feature.
          </p>
          <p>
            Intensity varies widely. Some academies run hard competition-style rolls, others protect a technical flow. Ask what today&rsquo;s class looks like before you warm up, especially on your first day. A good coach will match you to the right partner.
          </p>
        </div>
      </section>

      <GuideSection id="cross-training" variant="default" className="mb-14 border border-gray-200 bg-white">
        <div className="grid gap-8 md:grid-cols-2 md:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#003580]">Cross-training</p>
            <h2 className="mt-2 text-2xl font-bold text-gray-900 md:text-3xl">Muay Thai + BJJ: the full Thailand stack</h2>
            <div className="mt-3 space-y-3 text-base leading-relaxed text-gray-700">
              <p>
                One of the reasons travelers pick Thailand over pure-grappling destinations is the ability to build a real striking-plus-grappling stack. A sustainable weekly template: 4&ndash;5 Muay Thai sessions, 3&ndash;4 BJJ sessions, one protected rest day, optional conditioning.
              </p>
              <p>
                Two rules make cross-training actually work: <strong>separate the sessions by at least 4 hours</strong>, and <strong>never schedule hard sparring in both disciplines on the same day</strong>. Your neck and hips will thank you by week 3.
              </p>
            </div>
          </div>
          <figure className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="relative aspect-[4/3] w-full">
              <Image
                src="/1296749132.jpg"
                alt="Cross-training Muay Thai and BJJ in Thailand"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 520px"
              />
            </div>
            <figcaption className="px-4 py-3 text-xs text-gray-600">
              Thailand is one of the best places in the world to train striking and grappling on the same day.
            </figcaption>
          </figure>
        </div>
      </GuideSection>

      <GuideCtaStrip
        title="Browse verified BJJ academies in Thailand"
        subtitle="Filter by city, gi/no-gi, and rating to find your training fit."
        href="/search?country=Thailand&discipline=BJJ"
        buttonLabel="Open BJJ search"
      />

      <GuideSection id="faq" variant="default" padding="p-6 md:p-8" className="mb-14 shadow-sm">
        <h2 className="mb-2 text-2xl font-bold text-gray-900 md:text-3xl">FAQ</h2>
        <p className="mb-8 text-gray-600">The BJJ-in-Thailand questions travelers actually ask.</p>
        <GuideFaqList items={FAQ_ITEMS} />
      </GuideSection>

      <RelatedGuides
        guides={[
          { title: 'Best BJJ gyms in Thailand', href: '/blog/best-bjj-gyms-thailand' },
          { title: 'Best MMA camps in Thailand', href: '/blog/best-mma-camps-thailand' },
          { title: 'Packing list for a combat sports camp in Thailand', href: '/blog/packing-list-combat-sports-camp-thailand' },
          { title: 'Thailand training visa / DTV guide', href: '/blog/thailand-training-visa-dtv' },
        ]}
      />
    </ArticleShell>
  )
}
