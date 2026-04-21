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
import { Scale, Waves } from 'lucide-react'

const TITLE = 'Koh Tao vs Koh Phangan: Where Is the Best Place to Train Muay Thai? (2026)'
const SEO_TITLE = 'Koh Tao vs Koh Phangan for Muay Thai 2026 [Honest Comparison]'
const PATH = '/blog/koh-tao-vs-koh-phangan-muay-thai'
const DATE_PUBLISHED = '2026-04-21'
const DATE_MODIFIED = '2026-04-21'
const HERO_IMAGE = '/481020258.avif'
const DESCRIPTION =
  'A direct comparison of Koh Tao vs Koh Phangan for Muay Thai training: gym density, cost, vibe, nightlife, logistics, and who should pick each island in 2026.'

export const metadata: Metadata = {
  title: `${SEO_TITLE} | Combatbooking`,
  description: DESCRIPTION,
  alternates: { canonical: PATH },
  openGraph: { title: `${SEO_TITLE} | Combatbooking`, description: DESCRIPTION, type: 'article' },
  twitter: { card: 'summary_large_image', title: `${SEO_TITLE} | Combatbooking`, description: DESCRIPTION },
}

const FAQ_ITEMS = [
  {
    q: 'Koh Tao or Koh Phangan—which is better for Muay Thai?',
    a: 'Neither is objectively better. Koh Phangan has more gyms, more variety, and a bigger long-stay training community. Koh Tao is smaller, quieter, diving-focused, and better if you want low-distraction training and a shorter trip.',
  },
  {
    q: 'Which island is cheaper for a month of Muay Thai?',
    a: 'Koh Phangan typically has more accommodation tiers and therefore more budget-friendly options for long stays. Koh Tao can be competitive, but apartment supply is tighter and food tends to be pricier on average.',
  },
  {
    q: 'Is there good Muay Thai on Koh Tao at all?',
    a: 'Yes—there are legitimate camps on Koh Tao, but the overall gym count is low compared to Phangan or Phuket. If you want one good option and a calm island, Koh Tao works. If you want choice, Phangan is better.',
  },
  {
    q: 'Can I combine diving with Muay Thai on Koh Tao?',
    a: 'Many travelers do, but diving and hard pad rounds compete for recovery. Cap diving days at 1&ndash;2 per week during a serious training block, and never dive on the same day as two sessions.',
  },
  {
    q: 'Does the Full Moon Party ruin training on Koh Phangan?',
    a: 'Only if you let it. Full Moon week attracts a different crowd and some gyms see attendance dip; some long-term trainees leave the island that week. Most of the month is quiet and focused.',
  },
  {
    q: 'How do I get to Koh Tao or Koh Phangan for a training trip?',
    a: 'Most travelers fly into Koh Samui (USM) or Surat Thani (URT), then take a ferry. Factor a travel day on each end&mdash;do not schedule training for the day you arrive.',
  },
  {
    q: 'Are there fights on either island?',
    a: 'Both islands host local cards and tourist fight nights, but serious fight development is usually on the mainland. For stadium fight culture, Bangkok and Phuket are still the leaders.',
  },
  {
    q: 'Which island is better for female solo travelers?',
    a: 'Both are common for solo female travelers. Koh Phangan has larger long-stay yoga and wellness communities that many women find welcoming; Koh Tao is smaller and more self-contained.',
  },
]

export default function KohTaoVsKohPhanganPage() {
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
      subtitle="Two very different islands, two very different training experiences. This guide helps you pick the one that matches your goal, not the one with the prettiest beach drone shot."
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
        imageAlt="Thai island beach near Muay Thai training destinations"
        priority
        overlayText="Koh Tao and Koh Phangan share a ferry route and almost nothing else. Pick based on how you want to train, not how you want to be photographed."
      />

      <GuideLeadRow
        tocItems={[
          { href: '#at-a-glance', label: 'At a glance' },
          { href: '#koh-tao', label: 'Koh Tao for Muay Thai' },
          { href: '#koh-phangan', label: 'Koh Phangan for Muay Thai' },
          { href: '#side-by-side', label: 'Side-by-side' },
          { href: '#who-picks-what', label: 'Who should pick each' },
          { href: '#logistics', label: 'Logistics & ferries' },
          { href: '#faq', label: 'FAQ' },
        ]}
        statValue="2 islands"
        statDescription="Compared head-to-head on gym density, cost, vibe, recovery, and stay length."
        statIcon={<Scale className="h-5 w-5" />}
      />

      <section id="at-a-glance" className="mb-14 scroll-mt-24">
        <GuideAccentIntro icon={Waves} title="The short answer, up front" subtitle="For people who hate long intros" />
        <div className="prose prose-gray max-w-none space-y-4 text-base leading-relaxed text-gray-800 md:prose-lg">
          <p>
            If you want <strong>more gyms, more community, and a longer stay</strong>&mdash;Koh Phangan. If you want <strong>a small island with fewer distractions and you are combining Muay Thai with diving or a short reset</strong>&mdash;Koh Tao.
          </p>
          <p>
            Both are legitimate. Both have real Muay Thai camps run by Thai coaches. Neither is a replacement for Phuket, Chiang Mai, or Bangkok if you are training seriously for a fight. They are <em>lifestyle training destinations</em>, and they are very good at that job.
          </p>
        </div>
      </section>

      <GuideSection id="koh-tao" variant="slate" className="mb-14">
        <div className="grid gap-8 md:grid-cols-2 md:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#003580]">Small &amp; focused</p>
            <h2 className="mt-2 text-2xl font-bold text-gray-900 md:text-3xl">Koh Tao for Muay Thai</h2>
            <div className="mt-3 space-y-3 text-base leading-relaxed text-gray-700">
              <p>
                Koh Tao is small—roughly 21 square kilometers—and is built around diving. That shapes Muay Thai training here: fewer gyms, a closer-knit trainee community, and a rhythm that blends easily with water activities. It is also genuinely beautiful, which is both a help and a hazard.
              </p>
              <p>
                The island is good for <strong>1&ndash;2 week trips</strong> where you want to disappear, train once a day, and eat clean. It is less good for a serious 4&ndash;6 week block because gym variety is limited and accommodation near the gym can get tight in high season.
              </p>
              <p>
                If you are reading the <Link href="/blog/best-muay-thai-gyms-koh-tao" className="font-medium text-[#003580] underline">best Muay Thai gyms in Koh Tao</Link> guide, notice how the list is short. That is a feature here, not a bug.
              </p>
            </div>
          </div>
          <figure className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="relative aspect-[4/3] w-full">
              <Image
                src="https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?auto=format&fit=crop&w=1400&q=80"
                alt="Koh Tao beach and limestone coastline"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 520px"
              />
            </div>
            <figcaption className="px-4 py-3 text-xs text-gray-600">
              Koh Tao rewards focus&mdash;small island, small social surface area, and easy recovery between sessions.
            </figcaption>
          </figure>
        </div>
      </GuideSection>

      <GuideSection id="koh-phangan" variant="default" className="mb-14 border border-gray-200 bg-white">
        <div className="grid gap-8 md:grid-cols-2 md:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#003580]">Bigger &amp; more varied</p>
            <h2 className="mt-2 text-2xl font-bold text-gray-900 md:text-3xl">Koh Phangan for Muay Thai</h2>
            <div className="mt-3 space-y-3 text-base leading-relaxed text-gray-700">
              <p>
                Koh Phangan is larger, cheaper on average, and has the infrastructure to support long training stays: more gyms, more apartments, more food options, and a sizeable digital-nomad-meets-wellness community. It is also the Full Moon Party island, which some travelers love and some avoid entirely.
              </p>
              <p>
                For <strong>3&ndash;8 week training blocks</strong> with yoga days, smoothie-bowl breakfasts, and a floor full of training partners at different levels, Koh Phangan is the stronger island. For fight-focused camps it still trails Phuket and Chiang Mai, but for combat-sports-plus-lifestyle it is among the best options in Thailand.
              </p>
              <p>
                Check the <Link href="/blog/best-muay-thai-gyms-koh-phangan" className="font-medium text-[#003580] underline">best Muay Thai gyms in Koh Phangan</Link> guide for ranked listings across the island&mdash;Sri Thanu, Haad Yuan, and the east coast all have legitimate camps with different vibes.
              </p>
            </div>
          </div>
          <figure className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="relative aspect-[4/3] w-full">
              <Image
                src="https://images.unsplash.com/photo-1560847468-5eef330b4bde?auto=format&fit=crop&w=1400&q=80"
                alt="Koh Phangan coast and training island scenery"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 520px"
              />
            </div>
            <figcaption className="px-4 py-3 text-xs text-gray-600">
              Koh Phangan has real gym variety and accommodation options for long training stays.
            </figcaption>
          </figure>
        </div>
      </GuideSection>

      <section id="side-by-side" className="mb-16 scroll-mt-24">
        <h2 className="mb-2 text-2xl font-bold text-gray-900 md:text-3xl">Side-by-side comparison</h2>
        <p className="mb-8 max-w-3xl text-gray-600">
          Approximate, and changes by season. Use as a directional guide, not a quote.
        </p>
        <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-sm">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
              <tr>
                <th className="px-4 py-3">Factor</th>
                <th className="px-4 py-3">Koh Tao</th>
                <th className="px-4 py-3">Koh Phangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white text-gray-800">
              {[
                ['Island size', 'Small (~21 km²)', 'Medium (~125 km²)'],
                ['Gym count', 'Low', 'Medium'],
                ['Beginner-friendly classes', 'Yes, in main camps', 'Yes, across multiple gyms'],
                ['Fighter-track programs', 'Limited', 'Some, varies by camp'],
                ['Accommodation supply', 'Tight in high season', 'Strong across budgets'],
                ['Food cost', 'Higher on average', 'Generally lower'],
                ['Distraction level', 'Diving-focused', 'Yoga + nightlife + Full Moon'],
                ['Ideal stay length', '1–2 weeks', '3–8 weeks'],
                ['Best for', 'Reset, dive + train', 'Long lifestyle training'],
              ].map(([factor, tao, phangan]) => (
                <tr key={factor}>
                  <td className="px-4 py-3 font-semibold">{factor}</td>
                  <td className="px-4 py-3">{tao}</td>
                  <td className="px-4 py-3">{phangan}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <GuideSection id="who-picks-what" variant="slate" className="mb-14">
        <h2 className="mb-6 text-2xl font-bold text-gray-900 md:text-3xl">Who should pick which island?</h2>
        <GuideThreeCards
          items={[
            {
              title: 'Pick Koh Tao if…',
              body: 'You want a short, focused 7&ndash;14 day reset, you dive or want to learn, and you prefer fewer choices and a smaller social scene.',
            },
            {
              title: 'Pick Koh Phangan if…',
              body: 'You are staying 3+ weeks, want gym variety, cheaper long-stay accommodation, and a lifestyle community that includes yoga, cafes, and other trainees.',
            },
            {
              title: 'Pick neither if…',
              body: 'You are chasing fighter-track training, stadium fight nights, or a high-volume pro-oriented camp. Phuket or Bangkok serves that intent better.',
            },
          ]}
        />
      </GuideSection>

      <GuideSection id="logistics" variant="default" className="mb-14 border border-gray-200 bg-white">
        <div className="grid gap-8 md:grid-cols-2 md:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#003580]">Ferries &amp; timing</p>
            <h2 className="mt-2 text-2xl font-bold text-gray-900 md:text-3xl">Getting there, and between</h2>
            <div className="mt-3 space-y-3 text-base leading-relaxed text-gray-700">
              <p>
                Most trainees fly into <strong>Koh Samui (USM)</strong> or land at <strong>Surat Thani (URT)</strong> and ferry out. Samui&ndash;Phangan is short (30&ndash;45 min). Samui&ndash;Tao is longer (roughly 1.5&ndash;2 hrs). Ferries between Phangan and Tao run several times daily in high season.
              </p>
              <p>
                Practical rules: never book an afternoon training session on arrival day; always have a backup night booked somewhere in case of weather delays; keep your training gear in a carry-on so a missing checked bag does not cost you a week.
              </p>
              <p>
                For long stays you will also want to plan your exit. Read the{' '}
                <Link href="/blog/thailand-visa-extension-overstay-guide" className="font-medium text-[#003580] underline">Thailand visa extension &amp; overstay guide</Link>{' '}
                before you assume you can just push your stay an extra two weeks.
              </p>
            </div>
          </div>
          <figure className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="relative aspect-[4/3] w-full">
              <Image
                src="https://images.unsplash.com/photo-1504457047772-27faf1c00561?auto=format&fit=crop&w=1400&q=80"
                alt="Ferry and island coast in southern Thailand"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 520px"
              />
            </div>
            <figcaption className="px-4 py-3 text-xs text-gray-600">
              Build travel days into your training calendar&mdash;ferry delays are the norm, not the exception.
            </figcaption>
          </figure>
        </div>
      </GuideSection>

      <GuideCtaStrip
        title="Compare Koh Tao and Koh Phangan gyms side by side"
        subtitle="Filter by island, discipline, and rating to see exactly what is available."
        href="/search?country=Thailand&discipline=Muay%20Thai"
        buttonLabel="Open Thailand search"
      />

      <GuideSection id="faq" variant="default" padding="p-6 md:p-8" className="mb-14 shadow-sm">
        <h2 className="mb-2 text-2xl font-bold text-gray-900 md:text-3xl">FAQ</h2>
        <p className="mb-8 text-gray-600">The questions travelers actually ask before choosing.</p>
        <GuideFaqList items={FAQ_ITEMS} />
      </GuideSection>

      <RelatedGuides
        guides={[
          { title: 'Best Muay Thai gyms in Koh Tao', href: '/blog/best-muay-thai-gyms-koh-tao' },
          { title: 'Best Muay Thai gyms in Koh Phangan', href: '/blog/best-muay-thai-gyms-koh-phangan' },
          { title: 'Best Muay Thai gyms in Koh Samui', href: '/blog/best-muay-thai-gyms-koh-samui' },
          { title: '25 best Muay Thai camps in Thailand (2026)', href: '/blog/best-muay-thai-camps-thailand-2026' },
        ]}
      />
    </ArticleShell>
  )
}
