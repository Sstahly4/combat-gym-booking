import type { GymBusynessRecord } from '@/lib/gym/busyness-types'
import { hasDisplayableBusyness } from '@/lib/gym/busyness-types'
import { PopularTimesChart } from '@/components/gym/popular-times-chart'
import { BusynessFallbackBanner } from '@/components/gym/busyness-fallback-banner'

interface GymBusynessMeterProps {
  busyness: GymBusynessRecord | null
  timezone?: string | null
}

export function GymBusynessMeter({ busyness, timezone }: GymBusynessMeterProps) {
  if (!hasDisplayableBusyness(busyness)) {
    return <BusynessFallbackBanner />
  }

  return (
    <PopularTimesChart
      data={busyness!.popular_times}
      source={busyness!.source}
      timezone={timezone}
    />
  )
}
