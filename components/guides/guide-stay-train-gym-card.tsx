import Link from 'next/link'
import Image from 'next/image'
import type { StayTrainGym } from '@/lib/guides/stay-train-shortlist'
import { stayTrainGymImages } from '@/lib/guides/stay-train-shortlist'
import { gymCanonicalPath } from '@/lib/seo/gym-canonical-path'

const FALLBACK_GYM = '/Khun_3_c4e13bdce8_c0b7f8b5b5.avif'
const FALLBACK_ROOM = '/training-center-1.avif'

function money(n: number | null | undefined, currency?: string | null) {
  if (typeof n !== 'number' || !Number.isFinite(n) || n <= 0) return null
  return `${currency || ''} ${Math.round(n)}`.trim()
}

function AmenityBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-800">
      {label}
    </span>
  )
}

function amenityBadges(g: StayTrainGym) {
  const out: string[] = []
  if (g._amenities.air_conditioning) out.push('AC')
  if (g._amenities.pool) out.push('Pool')
  if (g._amenities.meals) out.push('On-site food')
  if (g._amenities.accommodation || g.offers_accommodation) out.push('On-site stay')
  return out
}

export function GuideStayTrainGymCard({ gym, priorityImage }: { gym: StayTrainGym; priorityImage?: boolean }) {
  const imgs = stayTrainGymImages(gym)
  const badges = amenityBadges(gym)
  const fromDay = money(gym.price_per_day, gym.currency)

  return (
    <article className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="grid grid-cols-2 gap-0.5 bg-gray-200">
        <div className="relative aspect-[4/3] bg-gray-100">
          <Image
            src={imgs.gym || FALLBACK_GYM}
            alt={`${gym.name} training`}
            fill
            priority={priorityImage}
            className="object-cover"
            sizes="(max-width: 768px) 50vw, 280px"
          />
          <span className="absolute bottom-1.5 left-1.5 rounded bg-black/65 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-white">
            Gym
          </span>
        </div>
        <div className="relative aspect-[4/3] bg-gray-100">
          <Image
            src={imgs.room || FALLBACK_ROOM}
            alt={`${gym.name} accommodation`}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 50vw, 280px"
          />
          <span className="absolute bottom-1.5 left-1.5 rounded bg-black/65 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-white">
            Stay
          </span>
        </div>
      </div>
      <div className="p-4 md:p-5">
        <Link href={gymCanonicalPath(gym)} className="text-base font-semibold text-[#003580] underline md:text-lg">
          {gym.name}
        </Link>
        <p className="mt-1 text-xs text-gray-500">{gym.city ? `${gym.city}, Thailand` : 'Thailand'}</p>
        {badges.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {badges.map((b) => (
              <AmenityBadge key={b} label={b} />
            ))}
          </div>
        )}
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-700">
          {gym.averageRating > 0 && (
            <span>
              <span className="font-semibold text-gray-900">{gym.averageRating.toFixed(1)}</span>
              {gym.reviewCount > 0 ? ` (${gym.reviewCount})` : ''}
            </span>
          )}
          {fromDay && (
            <span>
              From <span className="font-semibold text-gray-900">{fromDay}</span>/day
            </span>
          )}
        </div>
        <Link
          href={gymCanonicalPath(gym)}
          className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-[#003580] px-4 text-sm font-semibold text-white hover:bg-[#003580]/90"
        >
          View packages
        </Link>
      </div>
    </article>
  )
}
