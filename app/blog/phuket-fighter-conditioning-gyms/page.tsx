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
import { Dumbbell, HeartPulse, Waves } from 'lucide-react'

const TITLE = 'Top 5 Fitness and Conditioning Gyms for Fighters in Phuket (2026)'
const SEO_TITLE = 'Fighter Conditioning Gyms Phuket 2026 [Strength & Conditioning Guide]'
const PATH = '/blog/phuket-fighter-conditioning-gyms'
const DATE_PUBLISHED = '2026-04-21'
const DATE_MODIFIED = '2026-04-21'
const HERO_IMAGE = '/481020258.avif'
const DESCRIPTION =
  'A fighter-first guide to strength and conditioning in Phuket: where to lift, how to structure S&C around Muay Thai/MMA, recovery tools, and how to pick the right gym in 2026.'

export const metadata: Metadata = {
  title: `${SEO_TITLE} | Combatbooking`,
  description: DESCRIPTION,
  alternates: { canonical: PATH },
  openGraph: { title: `${SEO_TITLE} | Combatbooking`, description: DESCRIPTION, type: 'article' },
  twitter: { card: 'summary_large_image', title: `${SEO_TITLE} | Combatbooking`, description: DESCRIPTION },
}

const FAQ_ITEMS = [
  {
    q: 'Do I need a separate strength and conditioning gym in Phuket if I train Muay Thai?',
    a: 'Not always. Many Muay Thai camps include conditioning, bag circuits, and basic weights. A separate S&C gym becomes useful when you want structured lifting, better equipment, or rehab/recovery services.',
  },
  {
    q: 'How many strength sessions per week should a fighter do during a camp?',
    a: 'Most travelers do 2 sessions/week alongside 6–10 striking/grappling sessions, plus one protected rest day. If you are new to lifting, start with 1–2 lighter sessions and build slowly.',
  },
  {
    q: 'What matters most in a Phuket conditioning gym?',
    a: 'Equipment that matches your goal (barbells, machines, sleds), coaches who understand combat sports fatigue, and a location close enough that you will actually show up after training.',
  },
  {
    q: 'Is Phuket good for long training blocks?',
    a: 'Yes—Phuket has high gym density, strong training community, and good recovery options. It is also one of Thailand’s more expensive destinations, so plan your all-in budget (accommodation + food + transport).',
  },
  {
    q: 'Should I do S&C on the same day as Muay Thai?',
    a: 'Often yes, but separate by 4+ hours when possible. Keep hard sparring and heavy lifting away from each other—pair technique-focused Muay Thai days with lifting, and keep fight-simulation days lighter.',
  },
  {
    q: 'Are ice baths/sauna worth it in Phuket?',
    a: 'They can be—especially for long stays where recovery is the limiting factor. But sleep and nutrition beat every recovery gadget. Treat ice/sauna as tools, not miracles.',
  },
  {
    q: 'Is it safe to rent a scooter to get to an S&C gym in Phuket?',
    a: 'Scooters are common but carry real risk. If you are training hard, even a minor crash can end the trip. Budget for taxis/Grab if you are not a confident rider, and always wear a proper helmet.',
  },
  {
    q: 'Can I find Phuket gyms with weights and recovery amenities on CombatBooking?',
    a: 'Yes. Open Phuket listings and read each gym profile for weights areas, cardio equipment, physio, massage, and recovery tools.',
  },
]

export default function PhuketFighterConditioningGymsPage() {
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
      subtitle="Most Phuket camp injuries happen when people out-train their recovery. Smart S&C makes you harder to break—this guide shows how to choose it."
      breadcrumbs={[
        { label: 'Training Guides', href: '/blog' },
        { label: 'Thailand', href: '/search?country=Thailand' },
        { label: 'Phuket', href: '/search?country=Thailand&location=Phuket' },
      ]}
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      <GuideHero
        imageSrc={HERO_IMAGE}
        imageAlt="Phuket training and conditioning for fighters"
        priority
        overlayText="Phuket is famous for striking camps—but the best long-stay fighters treat strength, conditioning, and recovery as part of the camp, not an afterthought."
      />

      <GuideLeadRow
        tocItems={[
          { href: '#why', label: 'Why conditioning matters' },
          { href: '#top-5', label: 'Top 5 conditioning gym types' },
          { href: '#how-to-pick', label: 'How to pick' },
          { href: '#sample-week', label: 'Sample week' },
          { href: '#recovery', label: 'Recovery in Phuket' },
          { href: '#faq', label: 'FAQ' },
        ]}
        statValue="2x/week"
        statDescription="The most sustainable S&C dose for most travelers during a hard Phuket training block."
        statIcon={<Dumbbell className="h-5 w-5" />}
      />

      <section id="why" className="mb-14 scroll-mt-24">
        <GuideAccentIntro
          icon={HeartPulse}
          title="Why fighters add S&C in Phuket"
          subtitle="Performance + injury resistance"
        />
        <div className="prose prose-gray max-w-none space-y-4 text-base leading-relaxed text-gray-800 md:prose-lg">
          <p>
            Phuket camp life is simple: train, eat, recover, repeat. The problem is that most travelers only plan the
            training part. Strength and conditioning makes you more resilient to the predictable failure points: shin pain,
            hip tightness, lower-back fatigue, shoulder overload, and the specific exhaustion that shows up around week 3.
          </p>
          <p>
            Smart S&amp;C in Phuket does <strong>not</strong> mean bodybuilding. It means enough strength to keep your
            technique clean under fatigue, enough conditioning to survive high-volume pad rounds, and enough recovery work
            that your camp lasts long enough to matter.
          </p>
        </div>
      </section>

      <section id="top-5" className="mb-14 scroll-mt-24">
        <h2 className="mb-2 text-2xl font-bold text-gray-900 md:text-3xl">Top 5 conditioning gym types in Phuket</h2>
        <p className="mb-8 max-w-3xl text-gray-600">
          Phuket has many options. Instead of naming one “best” gym, pick the category that matches your training phase.
        </p>

        <div className="grid gap-6 md:grid-cols-2">
          {[
            {
              title: '1) Fighter-friendly barbell S&C (strength base)',
              body: 'Best when your goal is getting stronger without wrecking your Muay Thai volume. Look for squat/hinge/pull/push programming, sensible load progressions, and coaches who can modify sessions on heavy sparring weeks.',
            },
            {
              title: '2) Functional conditioning / engine-building gyms (aerobic base)',
              body: 'Best for building repeatability: circuits, intervals, sleds, assault bikes, and simple metrics. Great for week 1–2 of a camp, then taper as sparring intensity rises.',
            },
            {
              title: '3) Combat-sports performance clinics (coach-led, small group)',
              body: 'Best when you want coaching feedback on movement quality. These gyms focus on keeping knees, hips, and shoulders healthy under striking volume—often the highest ROI for long-stay travelers.',
            },
            {
              title: '4) Rehab/physio-forward gyms (injury management)',
              body: 'Best when you have a chronic issue: knee pain, shoulder impingement, or back tightness. The goal is to stay training, not win the weight room. Look for assessment, progression, and clear return-to-training plans.',
            },
            {
              title: '5) Recovery + mobility studios (keep the camp alive)',
              body: 'Best when you are already training twice daily and you need to protect joints. Mobility, yoga, stretching, and soft tissue work are the difference between finishing week 4 and limping home in week 2.',
            },
          ].map((item) => (
            <div key={item.title} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-gray-900">{item.title}</p>
              <p className="mt-2 text-sm leading-relaxed text-gray-700">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <GuideSection id="how-to-pick" variant="slate" className="mb-14">
        <h2 className="mb-6 text-2xl font-bold text-gray-900 md:text-3xl">How to pick the right one (the fighter filter)</h2>
        <GuideThreeCards
          items={[
            {
              title: 'Commute is the hidden variable',
              body: 'If your S&C gym is 30–45 minutes away, you will stop going. Choose something close to your camp or your accommodation. Phuket traffic is training load.',
            },
            {
              title: 'Match S&C to your camp phase',
              body: 'Early camp: build engine and strength. Mid camp: maintain strength and protect joints. Late camp: recover and sharpen. A great S&C plan changes over the month.',
            },
            {
              title: 'Avoid doubling hard days',
              body: 'Do not combine heavy lifting with hard sparring or fight-simulation sessions. Pair lifting with technique days. Pair recovery/mobility with sparring days.',
            },
          ]}
        />
        <p className="mt-8 text-sm text-gray-700">
          Need a base camp first? Start with the{' '}
          <Link href="/blog/best-muay-thai-gyms-phuket" className="font-medium text-[#003580] underline">
            best Muay Thai gyms in Phuket
          </Link>{' '}
          guide, then layer S&amp;C around the camp schedule you choose.
        </p>
      </GuideSection>

      <GuideSection id="sample-week" variant="default" className="mb-14 border border-gray-200 bg-white">
        <h2 className="mb-4 text-2xl font-bold text-gray-900 md:text-3xl">A sample week (Muay Thai + S&C, sustainable)</h2>
        <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-sm">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
              <tr>
                <th className="px-4 py-3">Day</th>
                <th className="px-4 py-3">AM</th>
                <th className="px-4 py-3">PM</th>
                <th className="px-4 py-3">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white text-gray-800">
              {[
                ['Mon', 'Roadwork (easy)', 'Muay Thai (technique)', 'Add S&C Tue/Thu so you do not stack fatigue immediately.'],
                ['Tue', 'S&C (strength)', 'Muay Thai (pads)', 'Keep lifting heavy but low volume.'],
                ['Wed', 'Mobility / yoga', 'Muay Thai (clinch / light spar)', 'Protect neck and hips.'],
                ['Thu', 'S&C (engine)', 'Muay Thai (pads)', 'Intervals or sleds, not max effort.'],
                ['Fri', 'Roadwork (optional)', 'Muay Thai (sparring day)', 'Skip S&C. Sleep and hydrate.'],
                ['Sat', 'Technique / light', 'Optional second session', 'Finish the week, do not empty the tank.'],
                ['Sun', 'Rest', 'Rest', 'Massage, walk, prep food, recover.'],
              ].map(([day, am, pm, notes]) => (
                <tr key={day}>
                  <td className="px-4 py-3 font-semibold">{day}</td>
                  <td className="px-4 py-3">{am}</td>
                  <td className="px-4 py-3">{pm}</td>
                  <td className="px-4 py-3 text-gray-700">{notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-gray-500">
          This is a template, not a prescription. Adjust based on experience, injury history, and your camp’s sparring
          structure.
        </p>
      </GuideSection>

      <GuideSection id="recovery" variant="slate" className="mb-14">
        <div className="grid gap-8 md:grid-cols-2 md:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#003580]">Recovery</p>
            <h2 className="mt-2 text-2xl font-bold text-gray-900 md:text-3xl">Phuket recovery: what actually works</h2>
            <div className="mt-3 space-y-3 text-base leading-relaxed text-gray-700">
              <p>
                The best recovery stack in Phuket is still boring: <strong>sleep</strong>, consistent{' '}
                <strong>carbs + protein</strong>, hydration, and one protected rest day. Add massage, sauna, and cold plunge
                only after the basics are locked.
              </p>
              <p>
                If you are budgeting a longer stay, plan the full trip cost—not only training fees. Use the{' '}
                <Link href="/blog/muay-thai-camp-thailand-cost" className="font-medium text-[#003580] underline">
                  Thailand Muay Thai cost guide (2026)
                </Link>{' '}
                and the{' '}
                <Link href="/blog/packing-list-combat-sports-camp-thailand" className="font-medium text-[#003580] underline">
                  packing list
                </Link>{' '}
                to avoid mid-trip money and logistics stress.
              </p>
            </div>
          </div>
          <figure className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="relative aspect-[4/3] w-full">
              <Image
                src="/Khun_3_c4e13bdce8_c0b7f8b5b5.avif"
                alt="Muay Thai camp recovery and training planning"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 520px"
              />
            </div>
            <figcaption className="px-4 py-3 text-xs text-gray-600">
              Recovery is training. It is the only way your camp lasts long enough to matter.
            </figcaption>
          </figure>
        </div>
      </GuideSection>

      <GuideCtaStrip
        title="Browse Phuket gyms and build your training stack"
        subtitle="Pick your base camp first, then add S&C and recovery around it."
        href="/search?country=Thailand&location=Phuket"
        buttonLabel="Open Phuket search"
      />

      <GuideSection id="faq" variant="default" padding="p-6 md:p-8" className="mb-14 shadow-sm">
        <h2 className="mb-2 text-2xl font-bold text-gray-900 md:text-3xl">FAQ</h2>
        <p className="mb-8 text-gray-600">Practical answers for fighters building a Phuket conditioning routine.</p>
        <GuideFaqList items={FAQ_ITEMS} />
      </GuideSection>

      <RelatedGuides
        guides={[
          { title: 'Best Muay Thai gyms in Phuket', href: '/blog/best-muay-thai-gyms-phuket' },
          { title: 'Best MMA camps in Thailand', href: '/blog/best-mma-camps-thailand' },
          { title: 'How much does a Muay Thai camp in Thailand cost?', href: '/blog/muay-thai-camp-thailand-cost' },
          { title: '25 best Muay Thai camps in Thailand (2026)', href: '/blog/best-muay-thai-camps-thailand-2026' },
          { title: 'Koh Tao vs Koh Phangan for Muay Thai', href: '/blog/koh-tao-vs-koh-phangan-muay-thai' },
        ]}
      />
    </ArticleShell>
  )
}

