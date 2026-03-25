import Link from 'next/link'
import type { Offer } from '@/lib/types/database'

interface OffersSectionProps {
  offers: Offer[]
}

function isExternalUrl(url: string) {
  return /^https?:\/\//i.test(url)
}

export function OffersSection({ offers }: OffersSectionProps) {
  if (!offers || offers.length === 0) return null

  return (
    <section className="relative z-0 pt-4 pb-4 md:pt-6 md:pb-6 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-3 md:mb-4">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">Offers</h2>
          <p className="text-sm text-gray-500 mt-1">
            Promotions, deals and special offers for you
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {offers.map((offer) => {
            const image = offer.image_url?.trim()
            const ctaClassName = "inline-flex items-center justify-center rounded-md bg-[#003580] px-3 py-2 text-sm font-medium text-white hover:bg-[#003580]/90 transition-colors"
            const cta = isExternalUrl(offer.cta_url) ? (
              <a
                href={offer.cta_url}
                target="_blank"
                rel="noreferrer"
                className={ctaClassName}
              >
                {offer.cta_text}
              </a>
            ) : (
              <Link href={offer.cta_url} className={ctaClassName}>
                {offer.cta_text}
              </Link>
            )

            return (
              <article
                key={offer.id}
                className="group flex items-stretch justify-between gap-4 rounded-xl border border-gray-200 bg-white p-4 md:p-5 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-medium text-gray-500 mb-1">{offer.label}</div>
                  <h3 className="text-lg md:text-xl font-semibold text-gray-900 leading-tight">
                    {offer.title}
                  </h3>
                  <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                    {offer.description}
                  </p>
                  <div className="mt-4">
                    {cta}
                  </div>
                </div>

                <div className="w-24 h-24 md:w-28 md:h-28 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 self-center">
                  {image ? (
                    // Using a plain image keeps the card lightweight and matches the existing app style.
                    <img
                      src={image}
                      alt={offer.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200" />
                  )}
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
