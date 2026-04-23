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
import { Building2, Sparkles } from 'lucide-react'

const TITLE = 'Western Boxing in Bangkok: Where Traditional Meets Modern (2026)'
const SEO_TITLE = 'Western Boxing Gyms Bangkok 2026 [Where to Train]'
const PATH = '/blog/western-boxing-bangkok'
const DATE_PUBLISHED = '2026-04-21'
const DATE_MODIFIED = '2026-04-21'
const HERO_IMAGE = '/Superbon-Singha-Mawynn-Chingiz-Allazov-ONE-Fight-Night-6-1920X1280-62.jpg'
const DESCRIPTION =
  'Bangkok has a quietly serious Western boxing scene alongside its Muay Thai heritage. A guide to where boxing tradition meets modern training facilities.'

export const metadata: Metadata = {
  title: `${SEO_TITLE} | CombatStay`,
  description: DESCRIPTION,
  alternates: { canonical: PATH },
  openGraph: { title: `${SEO_TITLE} | CombatStay`, description: DESCRIPTION, type: 'article' },
  twitter: { card: 'summary_large_image', title: `${SEO_TITLE} | CombatStay`, description: DESCRIPTION },
}

const FAQ_ITEMS = [
  {
    q: 'Can I train Western boxing in Bangkok without doing Muay Thai?',
    a: 'Yes. Several Bangkok gyms have dedicated boxing programs with their own coaches, sessions, and sparring days. You do not need to cross into Muay Thai if you are focused on hands.',
  },
  {
    q: 'Is Western boxing in Thailand as good as boxing in the West?',
    a: 'At the top level, Thai-based boxing gyms can hold their own&mdash;many have coaches from the Philippines, Cuba, Mexico, and Eastern Europe, plus strong local talent. You are paying for coaching, not geography.',
  },
  {
    q: 'What are boxing class prices like in Bangkok?',
    a: 'Drop-ins typically run a moderate price point, with weekly and monthly packages significantly cheaper per session. Private coaching is common and reasonably priced compared to most Western cities.',
  },
  {
    q: 'Do Bangkok boxing gyms spar regularly?',
    a: 'Most do. Expect technical sparring most weeks and harder sparring on designated days. Always communicate your experience level to the head coach before jumping in.',
  },
  {
    q: 'Can I combine boxing and Muay Thai in the same Bangkok trip?',
    a: 'Yes&mdash;and many travelers do. Some gyms run both on the same schedule; others specialize. For mixed stacks, plan recovery carefully because both disciplines hammer the neck and shoulders.',
  },
  {
    q: 'Is there a fight scene for amateur Western boxing in Bangkok?',
    a: 'Yes, though smaller and more fragmented than Muay Thai. Ask your gym about matchmaking and local amateur cards. Do not expect the same frequency as stadium Muay Thai.',
  },
  {
    q: 'Do I need a gi-equivalent kit for boxing?',
    a: 'No. Bring wraps, a mouthguard, and clothing you can sweat through. Most travelers buy or borrow gloves locally&mdash;proper 12oz or 14oz training gloves matter.',
  },
  {
    q: 'What part of Bangkok is best to stay in for boxing?',
    a: 'Depends on which gym you choose. Sukhumvit and Silom tend to have more international options; Chatuchak and other districts have more traditional Thai boxing camps. Prioritize commute length&mdash;Bangkok traffic is the real enemy.',
  },
]

export default function WesternBoxingBangkokPage() {
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
      subtitle="Bangkok is famous for Muay Thai, but quietly it has become one of the more interesting Western boxing cities in Southeast Asia. Here is where the sport lives."
      breadcrumbs={[
        { label: 'Training Guides', href: '/blog' },
        { label: 'Thailand', href: '/search?country=Thailand' },
        { label: 'Bangkok', href: '/search?country=Thailand&location=Bangkok&discipline=Boxing' },
      ]}
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      <GuideHero
        imageSrc={HERO_IMAGE}
        imageAlt="Boxing training culture in Bangkok, Thailand"
        priority
        overlayText="Traditional hand-wrap culture, modern strength rooms, and international coaches—Bangkok boxing is not a side dish to Muay Thai anymore."
      />

      <GuideLeadRow
        tocItems={[
          { href: '#why-bangkok', label: 'Why Bangkok for boxing' },
          { href: '#traditional', label: 'Traditional side' },
          { href: '#modern', label: 'Modern side' },
          { href: '#choosing', label: 'Choosing a gym' },
          { href: '#muay-thai-crossover', label: 'Muay Thai crossover' },
          { href: '#fight-scene', label: 'Amateur fight scene' },
          { href: '#faq', label: 'FAQ' },
        ]}
        statValue="2 worlds"
        statDescription="Bangkok boxing lives at the intersection of old-school Thai fight culture and modern international coaching."
        statIcon={<Building2 className="h-5 w-5" />}
      />

      <section id="why-bangkok" className="mb-14 scroll-mt-24">
        <GuideAccentIntro icon={Sparkles} title="Why Bangkok for Western boxing?" subtitle="Beyond the Muay Thai brand" />
        <div className="prose prose-gray max-w-none space-y-4 text-base leading-relaxed text-gray-800 md:prose-lg">
          <p>
            When travelers think of combat sports in Bangkok, Muay Thai fills the frame. But the city has a quietly serious <strong>Western boxing</strong> scene, built on three pillars: Thai boxers who have always cross-trained hands alongside Muay Thai, imported coaches from traditional boxing nations, and a new wave of boutique-style gyms that introduced structured classes to a broader audience.
          </p>
          <p>
            The result is a city where you can do a hard sparring round in a classic concrete gym in the morning, and walk into a polished downtown studio for a technical mitt session that evening. Few cities in the region offer that range.
          </p>
          <p>
            For ranked listings that match pure boxing intent&mdash;rather than Muay Thai camps that happen to have a bag&mdash;see the <Link href="/blog/best-boxing-gyms-thailand" className="font-medium text-[#003580] underline">best boxing gyms in Thailand</Link> guide and filter{' '}
            <Link href="/search?country=Thailand&location=Bangkok&discipline=Boxing" className="font-medium text-[#003580] underline">Bangkok boxing listings</Link>.
          </p>
        </div>
      </section>

      <GuideSection id="traditional" variant="slate" className="mb-14">
        <div className="grid gap-8 md:grid-cols-2 md:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#003580]">The old school</p>
            <h2 className="mt-2 text-2xl font-bold text-gray-900 md:text-3xl">Traditional boxing in Bangkok</h2>
            <div className="mt-3 space-y-3 text-base leading-relaxed text-gray-700">
              <p>
                The classic side of Bangkok boxing looks like you would expect: concrete floors, open-air fans, heavy bags that remember every boxer who hit them, and coaches whose English is functional but whose mitt work is a masterclass. Many of these gyms share space with Muay Thai operations and serve Thai pros, amateurs, and the occasional serious traveler.
              </p>
              <p>
                Intensity is usually calibrated by coach, not by class. If you show up consistently and take corrections, the ceiling is high. If you treat it like a drop-in fitness session, you will not get the most out of it&mdash;and a good coach will nudge you accordingly.
              </p>
            </div>
          </div>
          <figure className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="relative aspect-[4/3] w-full">
              <Image
                src="https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?auto=format&fit=crop&w=1400&q=80"
                alt="Traditional boxing gym interior with heavy bags"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 520px"
              />
            </div>
            <figcaption className="px-4 py-3 text-xs text-gray-600">
              Traditional Bangkok boxing gyms are still where the hardest rounds happen.
            </figcaption>
          </figure>
        </div>
      </GuideSection>

      <GuideSection id="modern" variant="default" className="mb-14 border border-gray-200 bg-white">
        <div className="grid gap-8 md:grid-cols-2 md:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#003580]">The new school</p>
            <h2 className="mt-2 text-2xl font-bold text-gray-900 md:text-3xl">Modern studios and international programs</h2>
            <div className="mt-3 space-y-3 text-base leading-relaxed text-gray-700">
              <p>
                Over the past several years, Bangkok has seen a wave of modern boxing gyms: air-conditioned, structured classes, written curriculums, and coaches who have trained in London, Havana, Manila, or Kyiv. These gyms cater to a mix of expats, serious hobbyists, and Thai students who grew up with more international exposure.
              </p>
              <p>
                For travelers who want a clean, scheduled experience&mdash;fundamentals on Monday, footwork on Wednesday, sparring on Saturday&mdash;the modern side of Bangkok boxing is as good as equivalent gyms in London or Los Angeles, often at a fraction of the cost.
              </p>
            </div>
          </div>
          <figure className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="relative aspect-[4/3] w-full">
              <Image
                src="https://images.unsplash.com/photo-1517438476312-10d79c077509?auto=format&fit=crop&w=1400&q=80"
                alt="Modern boxing studio class in Bangkok"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 520px"
              />
            </div>
            <figcaption className="px-4 py-3 text-xs text-gray-600">
              Modern Bangkok boxing studios bring structure, air-conditioning, and international coaching.
            </figcaption>
          </figure>
        </div>
      </GuideSection>

      <section id="choosing" className="mb-14 scroll-mt-24">
        <h2 className="mb-6 text-2xl font-bold text-gray-900 md:text-3xl">How to pick your Bangkok boxing gym</h2>
        <GuideThreeCards
          items={[
            {
              title: 'If you are serious about hands',
              body: 'Look for a gym with a head coach who competed and currently corners fighters. Read recent reviews for sparring quality, not just class vibe.',
            },
            {
              title: 'If you want structure',
              body: 'A modern studio with a published schedule, clear levels, and class caps is usually the easier experience. Expect higher prices but smoother booking.',
            },
            {
              title: 'If you are mixing with Muay Thai',
              body: 'Pick a camp that does both under one roof, or choose two gyms within a 15-minute commute. Bangkok traffic is a training tax.',
            },
          ]}
        />
      </section>

      <GuideSection id="muay-thai-crossover" variant="slate" className="mb-14">
        <div className="grid gap-8 md:grid-cols-2 md:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#003580]">Hybrid training</p>
            <h2 className="mt-2 text-2xl font-bold text-gray-900 md:text-3xl">Crossover with Muay Thai</h2>
            <div className="mt-3 space-y-3 text-base leading-relaxed text-gray-700">
              <p>
                Bangkok is one of the few cities where you can credibly train both Western boxing and Muay Thai at a high level in the same week. The risk is overlapping fatigue&mdash;shoulders, neck, and hands get hammered by both&mdash;so your schedule has to respect recovery.
              </p>
              <p>
                A sane template: 3&ndash;4 boxing sessions and 3&ndash;4 Muay Thai sessions, never two hard sparring days in the same week, and one protected rest day. Compare options in the{' '}
                <Link href="/blog/best-muay-thai-gyms-bangkok" className="font-medium text-[#003580] underline">best Muay Thai gyms in Bangkok</Link> guide alongside Western boxing listings.
              </p>
            </div>
          </div>
          <figure className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="relative aspect-[4/3] w-full">
              <Image
                src="/e079bedfbf7e870f827b4fda7ce2132f.avif"
                alt="Bangkok combat sports training and crossover"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 520px"
              />
            </div>
            <figcaption className="px-4 py-3 text-xs text-gray-600">
              Few cities rival Bangkok for doing serious boxing and serious Muay Thai in the same trip.
            </figcaption>
          </figure>
        </div>
      </GuideSection>

      <section id="fight-scene" className="mb-14 scroll-mt-24">
        <h2 className="mb-4 text-2xl font-bold text-gray-900 md:text-3xl">The amateur fight scene</h2>
        <div className="max-w-4xl space-y-4 text-base leading-relaxed text-gray-800">
          <p>
            Amateur Western boxing in Thailand is real but quieter than stadium Muay Thai. Cards run at a slower frequency and are less centralized, so finding a fight often comes through your gym&rsquo;s network rather than a public calendar. If competition is part of your trip, tell your head coach on day one and align your training schedule around matchmaking.
          </p>
          <p>
            For travelers just wanting to watch, Bangkok has amateur nights, boxing-focused events, and ONE Championship cards that include boxing-adjacent bouts. Your gym will know what is on.
          </p>
        </div>
      </section>

      <GuideCtaStrip
        title="Find your Bangkok boxing gym"
        subtitle="Browse verified boxing-tagged listings&mdash;no Muay-Thai-only camps in disguise."
        href="/search?country=Thailand&location=Bangkok&discipline=Boxing"
        buttonLabel="Open Bangkok boxing search"
      />

      <GuideSection id="faq" variant="default" padding="p-6 md:p-8" className="mb-14 shadow-sm">
        <h2 className="mb-2 text-2xl font-bold text-gray-900 md:text-3xl">FAQ</h2>
        <p className="mb-8 text-gray-600">Straight answers for travelers training boxing in Bangkok.</p>
        <GuideFaqList items={FAQ_ITEMS} />
      </GuideSection>

      <RelatedGuides
        guides={[
          { title: 'Best boxing gyms in Thailand', href: '/blog/best-boxing-gyms-thailand' },
          { title: 'Best Muay Thai gyms in Bangkok', href: '/blog/best-muay-thai-gyms-bangkok' },
          { title: 'Best MMA camps in Thailand', href: '/blog/best-mma-camps-thailand' },
          { title: 'Packing list for a combat sports camp in Thailand', href: '/blog/packing-list-combat-sports-camp-thailand' },
        ]}
      />
    </ArticleShell>
  )
}
