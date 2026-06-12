import Link from 'next/link'
import { ArticleShell } from '@/components/guides/article-shell'
import { RelatedGuides } from '@/components/guides/related-guides'
import { GuideStayTrainListingBlock } from '@/components/guides/guide-stay-train-listing-block'
import { GuideStayTrainPhotoStrip } from '@/components/guides/guide-stay-train-photo-strip'
import { GuideFaqList, GuideHero, GuideLeadRow } from '@/components/guides/guide-page-blocks'
import type { BrandProfileConfig } from '@/lib/guides/brand-profiles'
import { resolveBrandGym } from '@/lib/guides/resolve-brand-gym'
import { getStayTrainShortlist, pickCityHeroImage } from '@/lib/guides/stay-train-shortlist'
import { gymImageSrc } from '@/lib/images/gym-image-variants'
import { gymCanonicalPath } from '@/lib/seo/gym-canonical-path'
import { buildBrandReviewLd, buildBreadcrumbLd, buildFaqLd, buildGymItemListLd } from '@/lib/seo/guide-schema'
import { MapPin, Star } from 'lucide-react'

function QuickFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{label}</p>
      <p className="mt-2 text-sm font-medium leading-snug text-gray-900">{value}</p>
    </div>
  )
}

export async function GuideBrandProfileLayout({ config }: { config: BrandProfileConfig }) {
  const gym = await resolveBrandGym(config.namePatterns, config.slugHint)
  const bookable = gym?.isBookable === true
  const gymHref = gym ? gymCanonicalPath(gym) : null

  const alternatives = bookable
    ? []
    : await getStayTrainShortlist({
        location: config.alternativeLocation,
        accommodation: true,
        limit: config.alternativeLimit ?? 3,
      })

  const heroFromGym = gym?.images?.[0] ? gymImageSrc(gym.images[0]) : null
  const heroImage = heroFromGym || pickCityHeroImage(alternatives, config.heroFallback)

  const breadcrumbItems = [
    { name: 'Home', path: '/' },
    { name: 'Training Guides', path: '/blog' },
    ...config.breadcrumbs.map((b) => ({ name: b.label, path: b.href })),
    { name: config.title, path: config.path },
  ]

  const brandReviewLd = buildBrandReviewLd({
    title: config.title,
    description: config.description,
    path: config.path,
    datePublished: config.datePublished,
    dateModified: config.dateModified,
    imagePath: heroImage,
    brandName: config.brandName,
    gym: bookable && gym ? gym : null,
  })

  const itemListLd =
    alternatives.length > 0
      ? buildGymItemListLd({
          name: `${config.brandName} alternatives in ${config.alternativeLocation}`,
          gyms: alternatives,
        })
      : null

  return (
    <ArticleShell
      title={config.title}
      subtitle={`${config.brandName} · ${config.locationLabel}`}
      breadcrumbs={config.breadcrumbs}
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(brandReviewLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(buildFaqLd(config.faq)) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(buildBreadcrumbLd(breadcrumbItems)) }} />
      {itemListLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }} />
      )}

      <GuideHero
        imageSrc={heroImage}
        imageAlt={`${config.brandName} training camp in ${config.locationLabel}`}
        priority
        overlayText={
          bookable && gym
            ? `${config.brandName} is live on CombatStay. View real-time rates and book packages below.`
            : `${config.brandName} profile plus bookable alternatives in ${config.alternativeLocation}.`
        }
      />

      <GuideLeadRow
        tocItems={[
          { href: '#facts', label: 'Quick facts' },
          { href: '#overview', label: 'Overview' },
          { href: bookable ? '#book' : '#alternatives', label: bookable ? 'Book' : 'Alternatives' },
          { href: '#faq', label: 'FAQ' },
        ]}
        statValue={config.locationLabel.split(',')[0]}
        statDescription={`${config.brandName} · ${config.trainingStyle.slice(0, 72)}${config.trainingStyle.length > 72 ? '…' : ''}`}
        statIcon={<MapPin className="h-5 w-5" />}
      />

      <section id="facts" className="mb-10 scroll-mt-24">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <QuickFact label="Location" value={config.locationLabel} />
          <QuickFact label="Best for" value={config.bestFor} />
          <QuickFact label="On-site housing" value={config.onSiteHousing} />
          <QuickFact label="Pricing band" value={config.pricingBand} />
        </div>
        {bookable && gym && gym.averageRating > 0 && (
          <p className="mt-4 flex items-center gap-2 text-sm text-gray-700">
            <Star className="h-4 w-4 text-[#003580]" aria-hidden />
            <span>
              CombatStay rating:{' '}
              <strong>{gym.averageRating.toFixed(1)}</strong>
              {gym.reviewCount > 0 ? ` (${gym.reviewCount} reviews)` : ''}
            </span>
          </p>
        )}
      </section>

      <section id="overview" className="mb-10 max-w-3xl scroll-mt-24 space-y-4 text-base leading-relaxed text-gray-800">
        {config.editorial.map((p) => (
          <p key={p.slice(0, 40)}>{p}</p>
        ))}
        <p className="text-sm text-gray-600">
          Training style: {config.trainingStyle}.{' '}
          {config.suburbGuideHref ? (
            <>
              See the{' '}
              <Link href={config.suburbGuideHref} className="font-medium text-[#003580] underline">
                {config.alternativeLocation} gym guide
              </Link>{' '}
              or{' '}
            </>
          ) : null}
          <Link href={config.cityGuideHref} className="font-medium text-[#003580] underline">
            {config.city} city guide
          </Link>
          .
        </p>
      </section>

      {bookable && gym && gymHref ? (
        <section id="book" className="mb-14 scroll-mt-24">
          <div className="rounded-2xl border border-gray-900 bg-gray-950 p-6 text-center shadow-sm md:p-8">
            <p className="text-sm font-medium text-white/90">Instant booking on CombatStay</p>
            <Link
              href={gymHref}
              className="mt-4 inline-flex min-h-12 w-full max-w-lg items-center justify-center rounded-lg bg-white px-6 text-base font-semibold text-gray-950 hover:bg-gray-100 sm:w-auto"
            >
              View real-time rates and book packages directly
            </Link>
            <p className="mt-3 text-xs text-white/70">Live packages, photos, and cancellation terms on the gym profile.</p>
          </div>
        </section>
      ) : (
        <>
          <section id="alternatives" className="mb-6 scroll-mt-24">
            <h2 className="text-lg font-bold text-gray-900 md:text-xl">{config.alternativeHeading}</h2>
          </section>
          {alternatives.length > 0 && <GuideStayTrainPhotoStrip gyms={alternatives} city={config.alternativeLocation} max={3} />}
          <GuideStayTrainListingBlock
            gyms={alternatives}
            location={config.alternativeLocation}
            accommodation
            limit={config.alternativeLimit ?? 3}
            title={`Bookable alternatives in ${config.alternativeLocation}`}
            subtitle="Verified listings with on-site accommodation and instant checkout."
            ctaUrl={config.alternativeCtaUrl}
            ctaLabel={config.alternativeCtaLabel}
            sourceBrandSlug={config.path.replace(/^\/blog\//, '')}
          />
        </>
      )}

      <section id="faq" className="mb-14 scroll-mt-24 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">
        <h2 className="mb-6 text-2xl font-bold text-gray-900">FAQ</h2>
        <GuideFaqList items={config.faq} />
      </section>

      <RelatedGuides guides={config.relatedGuides} />
    </ArticleShell>
  )
}
