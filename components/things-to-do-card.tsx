import { Card, CardContent } from '@/components/ui/card'
import type { ThingToDo } from '@/lib/utils/overpass-things-to-do'

interface ThingsToDoCardProps {
  city: string
  items: ThingToDo[]
}

const CATEGORY_LABEL: Record<ThingToDo['category'], string> = {
  eat: 'Eat',
  nature: 'Nature',
  training: 'Training',
  explore: 'Explore',
}

function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`
  return `${km.toFixed(1)} km`
}

/**
 * "Around {City}" sidebar card — pre-populated from OpenStreetMap data.
 * Renders nothing if there are fewer than 2 items (avoids a near-empty card).
 */
export function ThingsToDoCard({ city, items }: ThingsToDoCardProps) {
  if (!items || items.length < 2) return null

  return (
    <Card className="border border-gray-200 shadow-sm">
      <CardContent className="p-4 md:p-5">
        <h3 className="font-bold text-sm md:text-base text-gray-900 mb-3.5">
          Around {city}
        </h3>

        <div className="space-y-0 divide-y divide-gray-100">
          {items.map((item, i) => (
            <div key={i} className="flex items-baseline justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
              <div className="min-w-0">
                <span className="block text-[13px] text-gray-800 leading-snug truncate">
                  {item.name}
                </span>
                <span className="text-[11px] text-gray-400 mt-0.5 block">
                  {CATEGORY_LABEL[item.category]}
                </span>
              </div>
              <span className="shrink-0 text-[12px] tabular-nums text-gray-500">
                {formatDistance(item.distanceKm)}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
