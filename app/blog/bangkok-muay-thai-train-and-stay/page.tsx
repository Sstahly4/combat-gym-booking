import type { Metadata } from 'next'
import { ArticleShell } from '@/components/guides/article-shell'
import { RelatedGuides } from '@/components/guides/related-guides'
import { GuideStayTrainListingBlock } from '@/components/guides/guide-stay-train-listing-block'
import { GuideCtaStrip, GuideFaqList } from '@/components/guides/guide-page-blocks'
import { buildArticleLd, buildBreadcrumbLd, buildFaqLd } from '@/lib/seo/guide-schema'

const TITLE = 'Bangkok Muay Thai Train and Stay: Top Packages [2026]'
const PATH = '/blog/bangkok-muay-thai-train-and-stay'
const DATE_PUBLISHED = '2026-06-11'
const DATE_MODIFIED = '2026-06-11'
const DESCRIPTION =
  'Discover premier Muay Thai train and stay packages in Bangkok. Filter by on-site accommodation, AC rooms, gym reviews, and live rates.'

export const metadata: Metadata = {
  title: `${TITLE} | CombatStay`,
  description: DESCRIPTION,
  alternates: { canonical: PATH },
  openGraph: { title: `${TITLE} | CombatStay`, description: DESCRIPTION, type: 'article' },
  twitter: { card: 'summary_large_image', title: `${TITLE} | CombatStay`, description: DESCRIPTION },
}

const FAQ_ITEMS = [
  {
    q: 'Do Bangkok Muay Thai gyms offer on-site accommodation?',
    a: 'Some do, often hostel floors or partner hotels nearby. Fewer true camp villages than Phuket. Confirm the room address on the gym profile before you pay.',
  },
  {
    q: 'Is AC important for Bangkok train-and-stay packages?',
    a: 'For most foreign travelers, yes. Bangkok heat and humidity make fan rooms a recovery tax after afternoon pads. Filter listings for the air conditioning amenity and confirm the room, not just the gym floor.',
  },
  {
    q: 'How much does Bangkok Muay Thai train and stay cost?',
    a: 'Capital-city rent pushes package prices above Chiang Mai and often matches mid-tier Phuket. Compare weekly bundles on live listings rather than daily drop-ins after day three.',
  },
  {
    q: 'Can I reach stadiums from a Bangkok train-and-stay camp?',
    a: 'Yes if you pick a gym with good BTS or MRT access, or budget for evening taxis to Rajadamnern or Lumpinee. Commute time still matters for morning sessions.',
  },
  {
    q: 'Train-and-stay or gym plus condo in Bangkok?',
    a: 'On-site packages keep one invoice and one cancellation policy. A separate condo works for long stays when you found a lease and train once per day.',
  },
]

export default function BangkokMuayThaiTrainAndStayPage() {
  const articleLd = buildArticleLd({
    title: TITLE,
    description: DESCRIPTION,
    path: PATH,
    datePublished: DATE_PUBLISHED,
    dateModified: DATE_MODIFIED,
    imagePath: '/1296749132.jpg',
  })

  return (
    <ArticleShell
      title={TITLE}
      subtitle="Bangkok train-and-stay packages with live rates, reviews, and instant booking."
      breadcrumbs={[
        { label: 'Training Guides', href: '/blog' },
        { label: 'Bangkok', href: '/blog/best-muay-thai-gyms-bangkok' },
      ]}
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(buildFaqLd(FAQ_ITEMS)) }} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            buildBreadcrumbLd([
              { name: 'Home', path: '/' },
              { name: 'Training Guides', path: '/blog' },
              { name: 'Bangkok', path: '/blog/best-muay-thai-gyms-bangkok' },
              { name: TITLE, path: PATH },
            ])
          ),
        }}
      />

      <div className="mb-10 max-w-3xl space-y-4 text-base leading-relaxed text-gray-800">
        <p>
          Bangkok train-and-stay packages suit fighters who want stadium access and maximum gym choice. On-site rooms
          are less common than Phuket, but several gyms bundle hostel beds or partner hotels within a short ride of the
          mat.
        </p>
        <p>
          Pick housing before you pick a famous gym name. Traffic between Sukhumvit condos and a gym in another district
          will cost you afternoon sessions by week two. The listings below show verified Bangkok camps that list
          on-site accommodation with live package prices.
        </p>
      </div>

      <GuideStayTrainListingBlock
        city="Bangkok"
        accommodation
        limit={12}
        title="Bangkok Muay Thai train-and-stay packages"
        subtitle="Verified listings with on-site accommodation. Confirm AC on the room you book."
        ctaUrl="/search?country=Thailand&location=Bangkok&discipline=Muay%20Thai&accommodation=true"
        ctaLabel="Browse Bangkok stay-and-train"
      />

      <GuideCtaStrip
        variant="light"
        title="Full Bangkok gym rankings"
        subtitle="Schedules, reviews, and commute tips beyond accommodation filters."
        href="/blog/best-muay-thai-gyms-bangkok"
        buttonLabel="Bangkok city guide"
      />

      <section id="faq" className="mb-14 scroll-mt-24 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">
        <h2 className="mb-6 text-2xl font-bold text-gray-900">FAQ</h2>
        <GuideFaqList items={FAQ_ITEMS} />
      </section>

      <RelatedGuides
        guides={[
          { title: 'Best Muay Thai gyms in Bangkok', href: '/blog/best-muay-thai-gyms-bangkok' },
          { title: 'Western boxing in Bangkok', href: '/blog/western-boxing-bangkok' },
          { title: 'Thailand training camp with accommodation', href: '/blog/thailand-training-camp-with-accommodation' },
        ]}
      />
    </ArticleShell>
  )
}
