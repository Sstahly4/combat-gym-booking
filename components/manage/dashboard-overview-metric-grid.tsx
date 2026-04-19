'use client'

import { OverviewMetricCard } from '@/components/manage/overview-metric-card'
import type { OverviewCardModel } from '@/lib/manage/overview-period-metrics'

export function DashboardOverviewMetricGrid({
  cards,
  currency,
  updatedAt,
}: {
  cards: OverviewCardModel[]
  currency: string
  updatedAt: Date | null
}) {
  return (
    <div className="grid grid-cols-1 gap-2 md:grid-cols-2 md:gap-3 xl:grid-cols-3 xl:gap-3">
      {cards.map((card) => (
        <OverviewMetricCard key={card.id} card={card} currency={currency} updatedAt={updatedAt} />
      ))}
    </div>
  )
}
