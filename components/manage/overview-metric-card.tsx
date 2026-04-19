'use client'

import Link from 'next/link'
import { useId } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { Info } from 'lucide-react'
import { formatDashboardMoneyCompact } from '@/lib/currency/format-dashboard-money'
import { OVERVIEW_CARD_INFO, type OverviewCardModel } from '@/lib/manage/overview-period-metrics'
import { OverviewMetricChart } from '@/components/manage/overview-metric-chart'

function formatCount(n: number) {
  return Math.round(n).toLocaleString(undefined, { maximumFractionDigits: 0 })
}

function formatValue(amount: number, valueType: 'money' | 'count', currency: string) {
  return valueType === 'money' ? formatDashboardMoneyCompact(amount, currency) : formatCount(amount)
}

export function OverviewMetricCard({
  card,
  currency,
  updatedAt,
}: {
  card: OverviewCardModel
  currency: string
  updatedAt: Date | null
}) {
  const main = formatValue(card.currentTotal, card.valueType, currency)
  const prevStr = formatValue(card.previousTotal, card.valueType, currency)
  const infoTipId = useId()
  const infoText = OVERVIEW_CARD_INFO[card.id]

  return (
    <div className="flex h-full min-h-[360px] flex-col rounded-xl border border-gray-200/90 bg-white p-7 shadow-sm shadow-gray-900/[0.03] sm:min-h-[420px] sm:p-8">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <h3 className="text-[15px] font-medium leading-snug text-gray-800">{card.label}</h3>
          <span className="group relative inline-flex shrink-0">
            <button
              type="button"
              className="inline-flex rounded p-0.5 text-gray-400 outline-none ring-offset-2 transition-colors hover:text-gray-600 focus-visible:ring-2 focus-visible:ring-[#003580]/35"
              aria-label={`About ${card.label}`}
              aria-describedby={infoTipId}
            >
              <Info className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
            </button>
            <span
              id={infoTipId}
              role="tooltip"
              className="pointer-events-none invisible absolute bottom-[calc(100%+8px)] left-1/2 z-50 w-[min(17rem,calc(100vw-2.5rem))] -translate-x-1/2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-left text-[11px] font-normal leading-snug text-gray-700 shadow-md opacity-0 transition-opacity duration-150 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100"
            >
              {infoText}
            </span>
          </span>
        </div>
      </div>

      <p className="mt-4 text-2xl font-light tabular-nums tracking-tight text-gray-800 sm:text-[1.75rem]">
        {main}
      </p>
      <p className="mt-1 text-xs font-extralight leading-none text-gray-400">{prevStr} previous period</p>

      <div className="relative mt-4 flex min-h-0 w-full flex-1 flex-col">
        <OverviewMetricChart
            label={card.label}
            valueType={card.valueType}
            currency={currency}
            dailyCurrent={card.dailyCurrent}
            dailyPrevious={card.dailyPrevious}
            tooltipDayLabelsCurrent={card.tooltipDayLabelsCurrent}
            tooltipDayLabelsPrevious={card.tooltipDayLabelsPrevious}
            sevenDayTotalLabel={main}
            previousPeriodTotalLabel={prevStr}
          />
      </div>

      <div className="mt-auto flex shrink-0 flex-col pt-1">
        <div className="flex items-end justify-between gap-2 text-[11px]">
          <span className="font-extralight text-gray-400">
            {updatedAt ? (
              <>
                Updated {formatDistanceToNow(updatedAt, { addSuffix: true })}
              </>
            ) : (
              '—'
            )}
          </span>
          <Link
            href="/manage/bookings"
            className="shrink-0 font-extralight text-gray-500 underline-offset-2 hover:text-[#003580] hover:underline"
          >
            More details
          </Link>
        </div>
      </div>
    </div>
  )
}
