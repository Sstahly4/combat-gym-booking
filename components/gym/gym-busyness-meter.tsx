import type { GymBusynessRecord } from '@/lib/gym/busyness-types'
import { hasDisplayableBusyness } from '@/lib/gym/busyness-types'
import { PopularTimesChart } from '@/components/gym/popular-times-chart'

interface GymBusynessMeterProps {
  busyness: GymBusynessRecord | null
  timezone?: string | null
  /** Phase 2: hour → live occupancy % for the current day overlay. */
  liveByHour?: Record<number, number> | null
}

export function GymBusynessMeter({ busyness, timezone, liveByHour }: GymBusynessMeterProps) {
  if (!hasDisplayableBusyness(busyness)) {
    return null
  }

  return (
    <PopularTimesChart
      data={busyness!.popular_times}
      timezone={timezone}
      liveByHour={liveByHour}
    />
  )
}
