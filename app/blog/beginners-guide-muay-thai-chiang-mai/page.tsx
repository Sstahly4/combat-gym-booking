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
import { Compass, GraduationCap, HeartPulse, Mountain } from 'lucide-react'

const TITLE = "A Beginner's Guide to Training Muay Thai in Chiang Mai (2026)"
const SEO_TITLE = "Beginner's Guide to Muay Thai in Chiang Mai 2026 [Gyms, Cost, Routine]"
const PATH = '/blog/beginners-guide-muay-thai-chiang-mai'
const DATE_PUBLISHED = '2026-04-21'
const DATE_MODIFIED = '2026-04-21'
const HERO_IMAGE = '/e079bedfbf7e870f827b4fda7ce2132f.avif'
const DESCRIPTION =
  'Start Muay Thai in Chiang Mai without getting injured, ripped off, or overwhelmed. Gyms, weekly routine, cost, recovery, and what real beginners actually experience.'

export const metadata: Metadata = {
  title: `${SEO_TITLE} | CombatStay`,
  description: DESCRIPTION,
  alternates: { canonical: PATH },
  openGraph: { title: `${SEO_TITLE} | CombatStay`, description: DESCRIPTION, type: 'article' },
  twitter: { card: 'summary_large_image', title: `${SEO_TITLE} | CombatStay`, description: DESCRIPTION },
}

const FAQ_ITEMS = [
  {
    q: 'Do I need any Muay Thai experience to train in Chiang Mai?',
    a: 'No. Most Chiang Mai camps run daily beginner-friendly classes that start with stance, basic strikes, and pad combinations. You do not need to know anything before you arrive—you just need to show up on time and follow the coaches.',
  },
  {
    q: 'How long should a beginner stay in Chiang Mai?',
    a: 'Two to four weeks is the realistic sweet spot. Week one is adaptation (soreness, heat, jet lag). Weeks two and three are where technique starts to stick. A fourth week lets you train harder without rushing your body.',
  },
  {
    q: 'Is Chiang Mai better than Phuket or Bangkok for a first Muay Thai trip?',
    a: 'Chiang Mai is usually calmer, cheaper, and more focused on lifestyle + long stays. Phuket has more fighter-track camps; Bangkok has more fight nights and stadium access. For a first trip, Chiang Mai is a forgiving choice.',
  },
  {
    q: 'How much does a beginner Muay Thai trip to Chiang Mai cost?',
    a: 'Training fees, accommodation near a gym, food, and basic gear for 2–4 weeks are usually affordable relative to Phuket. Exact rates depend on the gym and season—check each listing for current prices and package inclusions.',
  },
  {
    q: 'How many sessions per day should a beginner do?',
    a: 'Start with one session per day for the first 3–5 days. Only add a second daily session once you can sleep well, eat enough, and hit pads without your technique collapsing.',
  },
  {
    q: 'Will I get injured as a beginner?',
    a: 'Shin bruising, blisters, and tight hips are normal. Serious injury usually comes from too much sparring too early, bad pad work under fatigue, or skipping warm-ups. Communicate with your coach and scale intensity.',
  },
  {
    q: 'What should I pack before flying to Chiang Mai?',
    a: 'Wraps, mouthguard, loose training shorts, a good water bottle, and blister/tape basics. Many travelers buy gloves and shin guards locally—it reduces luggage and lets coaches fit you properly.',
  },
  {
    q: 'Do I need a visa to train Muay Thai in Chiang Mai?',
    a: 'Short stays often use a visa-exempt entry or tourist-style visa depending on your nationality. Longer stays may need an education visa or DTV. Always confirm with official Thai immigration resources.',
  },
  {
    q: 'Can women train safely as beginners in Chiang Mai?',
    a: 'Yes. Chiang Mai has a strong female training community, women-friendly camps, and coaches used to beginners. Read gym listings for mixed-class policy, accommodation options, and solo traveler reviews.',
  },
]

export default function BeginnersGuideChiangMaiPage() {
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
      subtitle="You do not need to be fit, flexible, or fearless to start Muay Thai in Chiang Mai. You need a plan—here it is."
      breadcrumbs={[
        { label: 'Training Guides', href: '/blog' },
        { label: 'Thailand', href: '/search?country=Thailand' },
        { label: 'Chiang Mai', href: '/search?country=Thailand&location=Chiang%20Mai&discipline=Muay%20Thai' },
      ]}
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      <GuideHero
        imageSrc={HERO_IMAGE}
        imageAlt="Beginner Muay Thai training in Chiang Mai, Thailand"
        priority
        overlayText="Chiang Mai is the most forgiving place in Thailand to take your first Muay Thai class—slower pace, cooler mornings, camps used to absolute beginners."
      />

      <GuideLeadRow
        tocItems={[
          { href: '#why-cm', label: 'Why Chiang Mai for beginners' },
          { href: '#week-by-week', label: 'Your first 4 weeks' },
          { href: '#routine', label: 'Sample daily routine' },
          { href: '#gear', label: 'Gear & essentials' },
          { href: '#gyms', label: 'Finding the right gym' },
          { href: '#mistakes', label: 'Beginner mistakes' },
          { href: '#faq', label: 'FAQ' },
        ]}
        statValue="2–4 wk"
        statDescription="The realistic stay length where a total beginner sees real technique change without overtraining."
        statIcon={<GraduationCap className="h-5 w-5" />}
      />

      <section id="why-cm" className="mb-14 scroll-mt-24">
        <GuideAccentIntro icon={Mountain} title="Why Chiang Mai is the easiest place to start Muay Thai" subtitle="The gentle on-ramp" />
        <div className="prose prose-gray max-w-none space-y-4 text-base leading-relaxed text-gray-800 md:prose-lg">
          <p>
            If you have never thrown a punch in your life, Chiang Mai is one of the best training destinations in the world to learn Muay Thai. It is not the most famous fight city in Thailand—that honor goes to Bangkok and Phuket—but for a <strong>first-time beginner</strong>, Chiang Mai is usually the smarter choice.
          </p>
          <p>
            Three reasons: the pace is calmer, the cost of living is lower, and the gyms are used to travelers arriving completely untrained. Coaches in Chiang Mai are comfortable teaching someone who has never held up their hands, and most camps run dedicated beginner sessions where you will not get thrown into sparring on day one.
          </p>
          <p>
            The mornings are also cool enough (especially November through February) that you can do real roadwork without collapsing. That matters when your engine is brand new and Thailand&rsquo;s heat has not figured out how to break you yet.
          </p>
        </div>
      </section>

      <GuideSection variant="slate" className="mb-14">
        <div className="grid gap-8 md:grid-cols-2 md:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#003580]">Reality check</p>
            <h2 className="mt-2 text-2xl font-bold text-gray-900 md:text-3xl">What &ldquo;beginner&rdquo; actually means here</h2>
            <div className="mt-3 space-y-3 text-base leading-relaxed text-gray-700">
              <p>
                A beginner in Chiang Mai is someone who walks into the gym on day one, holds their hands up wrong, kicks with their toes, and can barely make it through the warm-up jog. That is <em>normal</em>. Every camp has seen a thousand of you.
              </p>
              <p>
                What you should not expect: a special introductory month where nobody corrects your technique. Thai coaches will move you quickly if you show up consistently. By day four you will be on the pads. By the end of week two you will understand why your lead hand keeps dropping.
              </p>
              <p>
                What you should expect: shin bruises, tight hips, a new appreciation for sleep, and the specific kind of tiredness that only comes from hitting pads in 32&deg;C humidity.
              </p>
            </div>
          </div>
          <figure className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="relative aspect-[4/3] w-full">
              <Image
                src="https://images.unsplash.com/photo-1528181304800-259b08848526?auto=format&fit=crop&w=1400&q=80"
                alt="Chiang Mai morning scene near training areas"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 520px"
              />
            </div>
            <figcaption className="px-4 py-3 text-xs text-gray-600">
              Cool mornings make roadwork realistic for complete beginners—especially in high season.
            </figcaption>
          </figure>
        </div>
      </GuideSection>

      <section id="week-by-week" className="mb-14 scroll-mt-24">
        <h2 className="mb-2 text-2xl font-bold text-gray-900 md:text-3xl">Your first four weeks, week by week</h2>
        <p className="mb-8 max-w-3xl text-gray-600">
          This is the progression most beginners actually need—not the twice-a-day fighter schedule you saw on Instagram.
        </p>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#003580]">Week 1</p>
            <h3 className="mt-1 text-lg font-semibold text-gray-900">Adaptation &mdash; do not be a hero</h3>
            <ul className="mt-3 space-y-2 text-sm leading-relaxed text-gray-700">
              <li>One session per day (afternoon is usually easier while you adjust to heat).</li>
              <li>Focus on stance, basic 1-2-3 combinations, teep, and front kick.</li>
              <li>Skip sparring entirely. Tell your coach you are brand new if they ask.</li>
              <li>Sleep 8&ndash;9 hours. Eat proper meals. Hydrate like it is your job.</li>
            </ul>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#003580]">Week 2</p>
            <h3 className="mt-1 text-lg font-semibold text-gray-900">Technique starts to click</h3>
            <ul className="mt-3 space-y-2 text-sm leading-relaxed text-gray-700">
              <li>Add a morning run 2&ndash;3x per week (30&ndash;40 minutes, easy pace).</li>
              <li>Optional: one two-a-day on a day you feel fresh—never two days in a row.</li>
              <li>Start clinch drilling if offered. Avoid live sparring.</li>
              <li>Get gloves/shins fitted locally if you have not already.</li>
            </ul>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#003580]">Week 3</p>
            <h3 className="mt-1 text-lg font-semibold text-gray-900">Volume and calibration</h3>
            <ul className="mt-3 space-y-2 text-sm leading-relaxed text-gray-700">
              <li>Two-a-days possible 3&ndash;4x per week if recovery is holding.</li>
              <li>Start light technical sparring only when a coach says you are ready.</li>
              <li>Request pad corrections specifically (balance, elbow position, hip rotation).</li>
              <li>Book a rest day mid-week. Walk, swim, or stretch.</li>
            </ul>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#003580]">Week 4</p>
            <h3 className="mt-1 text-lg font-semibold text-gray-900">Locking it in</h3>
            <ul className="mt-3 space-y-2 text-sm leading-relaxed text-gray-700">
              <li>Reduce novelty&mdash;drill the same 3&ndash;4 combinations hundreds of reps.</li>
              <li>Film yourself once on pads or the heavy bag; you will see what the coach sees.</li>
              <li>Ease off 2&ndash;3 days before you fly so you do not travel injured.</li>
              <li>Ask your coach for homework drills you can do back home.</li>
            </ul>
          </div>
        </div>
      </section>

      <GuideSection id="routine" variant="slate" className="mb-14">
        <h2 className="mb-6 text-2xl font-bold text-gray-900 md:text-3xl">A realistic beginner day in Chiang Mai</h2>
        <p className="mb-6 max-w-3xl text-gray-700">
          This is roughly what your day looks like once you are settled—used by most of the long-stay beginners who actually finish their trips.
        </p>
        <GuideThreeCards
          items={[
            {
              title: 'Morning (optional)',
              body: '6:30&mdash;7:30am: light 3&ndash;5km run or shadowboxing. Skip if you trained hard the day before. Breakfast: eggs, fruit, rice or oats. Lots of water.',
            },
            {
              title: 'Afternoon (main session)',
              body: '3:30&mdash;5:30pm: warm-up, shadow, pad rounds, bag work, technique, light clinch. The bulk of your learning happens here because coaches are fresh.',
            },
            {
              title: 'Evening',
              body: 'Walk or stretch, proper meal with protein + rice, hydrate, in bed by 10pm. Scroll less. Your shins need sleep more than dopamine.',
            },
          ]}
        />
      </GuideSection>

      <GuideSection id="gear" variant="default" className="mb-14 border border-gray-200 bg-white">
        <div className="grid gap-8 md:grid-cols-2 md:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#003580]">Gear</p>
            <h2 className="mt-2 text-2xl font-bold text-gray-900 md:text-3xl">What to bring and what to buy locally</h2>
            <div className="mt-5 space-y-4 text-sm leading-relaxed text-gray-700">
              <div>
                <p className="font-semibold text-gray-900">Bring from home</p>
                <ul className="mt-2 list-disc pl-5 space-y-1">
                  <li>Hand wraps (2 pairs)</li>
                  <li>Mouthguard (boil-and-bite)</li>
                  <li>Running shoes and a pair you do not mind destroying in the rain</li>
                  <li>Quick-dry training shirts (you will sweat through everything)</li>
                  <li>Sunscreen, electrolytes, blister tape, basic first aid</li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-gray-900">Buy in Chiang Mai</p>
                <ul className="mt-2 list-disc pl-5 space-y-1">
                  <li>Muay Thai shorts (cheap, authentic, and you will want multiple pairs)</li>
                  <li>Gloves (10oz or 12oz for training; your coach can fit you)</li>
                  <li>Shin guards</li>
                  <li>Ankle supports if you want them</li>
                </ul>
              </div>
              <p>
                Buying gear locally supports Thai gym shops, gives you the correct fit, and saves suitcase space. Do not overpay for equipment before you arrive.
              </p>
            </div>
          </div>
          <figure className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="relative aspect-[4/3] w-full">
              <Image
                src="/training-center-1.avif"
                alt="Muay Thai training floor and pad work"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 520px"
              />
            </div>
            <figcaption className="px-4 py-3 text-xs text-gray-600">
              Gloves and shin guards are best fitted in person at a Thai shop or through the gym.
            </figcaption>
          </figure>
        </div>
      </GuideSection>

      <section id="gyms" className="mb-14 scroll-mt-24">
        <GuideAccentIntro icon={Compass} title="How to pick a beginner-friendly Chiang Mai gym" subtitle="What actually matters on day one" />
        <div className="prose prose-gray max-w-none space-y-4 text-base leading-relaxed text-gray-800 md:prose-lg">
          <p>
            Do not over-optimize. The difference between the &ldquo;best&rdquo; Chiang Mai gym and the third best is negligible if you are a beginner. What matters: <strong>coach-to-student ratio</strong>, <strong>a clearly scheduled beginner block</strong>, <strong>a location you can commute to every day without resenting it</strong>, and <strong>accommodation that lets you actually sleep</strong>.
          </p>
          <p>
            The single biggest predictor of beginner success in Chiang Mai is not the camp&rsquo;s fighter roster—it is whether the commute is short enough that you still show up on day 14 when you are tired and sore.
          </p>
          <p>
            For a ranked shortlist of verified camps with reviews, prices, and commute notes, open the <Link href="/blog/best-muay-thai-gyms-chiang-mai" className="font-medium text-[#003580] underline">best Muay Thai gyms in Chiang Mai</Link> guide. Read three listings back-to-back, pick the one that feels most sustainable, not the most impressive.
          </p>
        </div>
      </section>

      <GuideCtaStrip
        title="Compare verified Chiang Mai camps for beginners"
        subtitle="Live prices, reviews, and beginner-friendly schedules."
        href="/search?country=Thailand&location=Chiang%20Mai&discipline=Muay%20Thai"
        buttonLabel="Open Chiang Mai search"
      />

      <section id="mistakes" className="mb-14 scroll-mt-24">
        <h2 className="mb-6 text-2xl font-bold text-gray-900 md:text-3xl">The 7 mistakes nearly every Chiang Mai beginner makes</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {[
            {
              title: 'Going two-a-days in week one',
              body: 'You will blow out your shins, get sick, and waste the rest of the trip recovering. One session per day until your body earns the second.',
            },
            {
              title: 'Sparring too early',
              body: 'Spar only when your coach tells you to. Beginner sparring injuries in Thailand are almost always self-inflicted eagerness, not Thai aggression.',
            },
            {
              title: 'Skipping the morning run',
              body: 'Chiang Mai mornings are the coolest, quietest, and most productive training window. Even 20 minutes makes the afternoon session better.',
            },
            {
              title: 'Drinking every night',
              body: 'Thailand is a beautiful place to train and a seductive place to not train. Pick one. You cannot out-pad-round a hangover.',
            },
            {
              title: 'Chasing new combos',
              body: 'You do not need 40 combinations. You need 4 combinations drilled 1,000 times each. Ask your coach to stop you if you are chasing novelty.',
            },
            {
              title: 'Ignoring hydration and electrolytes',
              body: 'Cramps, dizziness, and heat exhaustion hit beginners hardest. Salt, water, and potassium are not optional in 32&deg;C humidity.',
            },
            {
              title: 'Booking 3+ destinations in one trip',
              body: 'If Chiang Mai is stop two of a seven-city tour, you are a tourist, not a trainee. For a first Muay Thai trip, pick one city and stay.',
            },
            {
              title: 'Not telling the coach you are new',
              body: 'Coaches adjust pad work to your level&mdash;but only if they know your level. Say it on day one. No shame in being fresh.',
            },
          ].map((item) => (
            <div key={item.title} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-gray-900">{item.title}</p>
              <p className="mt-2 text-sm leading-relaxed text-gray-700" dangerouslySetInnerHTML={{ __html: item.body }} />
            </div>
          ))}
        </div>
      </section>

      <GuideSection variant="amber" className="mb-14">
        <div className="flex items-start gap-4">
          <HeartPulse className="mt-1 h-8 w-8 shrink-0 text-[#003580]" aria-hidden />
          <div>
            <h2 className="text-2xl font-bold text-gray-900 md:text-3xl">Recovery is training, not a rest day</h2>
            <p className="mt-3 text-sm leading-relaxed text-gray-800">
              Beginners in Chiang Mai do not fail because they train too little. They fail because they train too much, sleep too little, eat inconsistently, and spend their recovery days on mountain treks or motorbike rides. Treat one day a week as fully protected: no sessions, light walking, massage, stretching, proper food. Your fourth week is only possible if your second week was respected.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-gray-800">
              If you are thinking long-term, read the <Link href="/blog/thailand-training-visa-dtv" className="font-medium text-[#003580] underline">Thailand training visa / DTV guide</Link> before you book—knowing how long you can legally stay changes how aggressively you should train in week one.
            </p>
          </div>
        </div>
      </GuideSection>

      <GuideSection id="faq" variant="default" padding="p-6 md:p-8" className="mb-14 shadow-sm">
        <h2 className="mb-2 text-2xl font-bold text-gray-900 md:text-3xl">FAQ</h2>
        <p className="mb-8 text-gray-600">Straight answers for beginners heading to Chiang Mai.</p>
        <GuideFaqList items={FAQ_ITEMS} />
      </GuideSection>

      <GuideCtaStrip
        variant="light"
        title="Ready to book your first Chiang Mai camp?"
        subtitle="Browse verified listings with live pricing, reviews, and beginner-class info."
        href="/search?country=Thailand&location=Chiang%20Mai&discipline=Muay%20Thai"
        buttonLabel="Find your Chiang Mai camp"
      />

      <RelatedGuides
        guides={[
          { title: 'Best Muay Thai gyms in Chiang Mai', href: '/blog/best-muay-thai-gyms-chiang-mai' },
          { title: '25 best Muay Thai camps in Thailand (2026)', href: '/blog/best-muay-thai-camps-thailand-2026' },
          { title: 'How much does a Muay Thai camp in Thailand cost?', href: '/blog/muay-thai-camp-thailand-cost' },
          { title: 'Thailand training visa / DTV guide', href: '/blog/thailand-training-visa-dtv' },
        ]}
      />
    </ArticleShell>
  )
}
