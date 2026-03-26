import Link from 'next/link'
import Image from 'next/image'
import { Clock, MapPin, Star } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import type { GuideGym } from '@/lib/guides/thailand-gyms'
import { trainingScheduleSnippet } from '@/lib/guides/schedule-snippet'

function formatMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount)
  } catch {
    return `${currency} ${Math.round(amount)}`
  }
}

function truncate(text: string, max: number) {
  const t = text.trim()
  if (t.length <= max) return t
  return `${t.slice(0, max - 1)}…`
}

type GuideGymCardProps = {
  gym: GuideGym
  rank?: number
  priorityImage?: boolean
  fallbackImageSrc?: string
}

export function GuideGymCard({ gym, rank, priorityImage, fallbackImageSrc }: GuideGymCardProps) {
  const imageSrc = gym.images?.[0]?.url || fallbackImageSrc || '/Khun_3_c4e13bdce8_c0b7f8b5b5.avif'

  const priceLine = gym.price_per_week
    ? `${formatMoney(gym.price_per_day, gym.currency)}/day · ${formatMoney(gym.price_per_week, gym.currency)}/week`
    : `${formatMoney(gym.price_per_day, gym.currency)}/day`

  const ratingLine =
    gym.reviewCount > 0 ? `${gym.averageRating.toFixed(1)} (${gym.reviewCount})` : 'No reviews yet'

  const scheduleLine = trainingScheduleSnippet(gym.training_schedule, 2)
  const blurb = gym.description ? truncate(gym.description, 140) : null

  return (
    <Link href={`/gyms/${gym.id}`} className="block h-full">
      <Card className="border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow h-full overflow-hidden">
        <div className="relative w-full aspect-[16/9] bg-gray-100">
          <Image
            src={imageSrc}
            alt={gym.name}
            fill
            priority={Boolean(priorityImage)}
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover"
          />
          {typeof rank === 'number' && (
            <div className="absolute top-3 left-3 bg-[#003580] text-white text-xs font-semibold px-2 py-1 rounded">
              #{rank}
            </div>
          )}
        </div>

        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-base md:text-lg font-semibold text-gray-900 truncate">{gym.name}</h3>
              <div className="mt-1 flex items-center gap-1 text-sm text-gray-600">
                <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                <span className="truncate">{gym.city}, {gym.country}</span>
              </div>
            </div>
            <div className="shrink-0 text-right">
              <div className="flex items-center justify-end gap-1 text-sm font-semibold text-gray-900">
                <Star className="w-4 h-4 text-[#003580]" />
                <span>{ratingLine}</span>
              </div>
            </div>
          </div>

          {blurb && (
            <p className="mt-3 text-sm text-gray-600 leading-relaxed line-clamp-3">{blurb}</p>
          )}

          <div className="mt-3 text-sm text-gray-700">
            <div className="font-medium">{priceLine}</div>
            {gym.disciplines?.length ? (
              <div className="mt-1 text-gray-600">
                {gym.disciplines.slice(0, 4).join(' · ')}
                {gym.disciplines.length > 4 ? ` · +${gym.disciplines.length - 4} more` : ''}
              </div>
            ) : null}
          </div>

          {scheduleLine && (
            <div className="mt-2 flex items-start gap-2 text-xs text-gray-600">
              <Clock className="w-3.5 h-3.5 text-[#003580] shrink-0 mt-0.5" />
              <span className="leading-snug">{scheduleLine}</span>
            </div>
          )}

          <div className="mt-4 text-sm text-[#003580] font-medium">
            View full profile, schedule & booking →
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
