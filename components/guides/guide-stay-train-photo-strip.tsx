import Link from 'next/link'
import Image from 'next/image'
import type { StayTrainGym } from '@/lib/guides/stay-train-shortlist'
import { stayTrainGymImages } from '@/lib/guides/stay-train-shortlist'
import { gymCanonicalPath } from '@/lib/seo/gym-canonical-path'

const FALLBACK = '/Khun_3_c4e13bdce8_c0b7f8b5b5.avif'

export function GuideStayTrainPhotoStrip({
  gyms,
  city,
  max = 4,
}: {
  gyms: StayTrainGym[]
  city: string
  max?: number
}) {
  const picks = gyms.slice(0, max).filter((g) => stayTrainGymImages(g).gym || g.name)

  if (picks.length === 0) return null

  return (
    <section className="mb-10" aria-label={`${city} train-and-stay camp photos`}>
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#003580]">
        Live {city} listings with on-site accommodation
      </p>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {picks.map((g, i) => {
          const src = stayTrainGymImages(g).gym || FALLBACK
          return (
            <Link
              key={g.id}
              href={gymCanonicalPath(g)}
              className="group overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="relative aspect-[4/3] bg-gray-100">
                <Image
                  src={src}
                  alt={`${g.name} Muay Thai camp in ${city}`}
                  fill
                  priority={i < 2}
                  className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <p className="line-clamp-2 text-sm font-semibold leading-snug text-white">{g.name}</p>
                  {g.averageRating > 0 && (
                    <p className="mt-0.5 text-xs text-white/85">
                      {g.averageRating.toFixed(1)}
                      {g.reviewCount > 0 ? ` · ${g.reviewCount} reviews` : ''}
                    </p>
                  )}
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
