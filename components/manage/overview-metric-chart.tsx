'use client'

import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { formatDashboardMoney, formatDashboardMoneyCompact } from '@/lib/currency/format-dashboard-money'

/**
 * "Stripe-style" compact area chart for dashboard overview cards.
 *
 * - Single soft area + line for the current 7-day cumulative window.
 * - Adaptive y-axis ticks (computed with a nice-number algorithm from the real data,
 *   shared max across current/previous so comparisons line up).
 * - Thin ghost line for the previous 7-day window.
 * - Dashed tail represents the unclosed portion of today.
 * - Hover tooltip shows current vs previous cumulative with % change.
 */

const BRAND = '#003580'
const GRID = '#eef2f7'
const TICK_LABEL = '#9ca3af'
const PREV_LINE = '#d1d5db'

// Viewbox coordinates. SVG is drawn with `preserveAspectRatio="none"` so values below
// map linearly onto the real container box. HTML overlays reuse the same percentages.
const VB_W = 600
const VB_H = 200
const PAD_L = 0
const PAD_R = 52
const PAD_T = 10
const PAD_B = 18

const innerW = VB_W - PAD_L - PAD_R
const innerH = VB_H - PAD_T - PAD_B
const BASELINE_Y = PAD_T + innerH

function cum7(daily: number[]): number[] {
  const out: number[] = []
  let s = 0
  for (let i = 0; i < 7; i++) {
    s += daily[i] ?? 0
    out.push(s)
  }
  return out
}

function niceNum(x: number, round: boolean): number {
  if (x <= 0) return 1
  const exp = Math.floor(Math.log10(x))
  const f = x / Math.pow(10, exp)
  let nf: number
  if (round) {
    if (f < 1.5) nf = 1
    else if (f < 3) nf = 2
    else if (f < 7) nf = 5
    else nf = 10
  } else {
    if (f <= 1) nf = 1
    else if (f <= 2) nf = 2
    else if (f <= 5) nf = 5
    else nf = 10
  }
  return nf * Math.pow(10, exp)
}

function niceTicks(
  maxValue: number,
  integer: boolean,
  targetCount = 4
): { ticks: number[]; niceMax: number } {
  const fallback = integer ? 3 : 1
  const safeMax = maxValue > 0 ? maxValue : fallback
  const rough = niceNum(safeMax, false)
  let step = niceNum(rough / Math.max(2, targetCount - 1), true)
  if (integer) step = Math.max(1, Math.round(step))
  const niceMax = Math.ceil((safeMax - 1e-9) / step) * step || step
  const ticks: number[] = []
  for (let v = 0; v <= niceMax + 1e-9; v += step) {
    ticks.push(Number(v.toFixed(10)))
    if (ticks.length > 8) break
  }
  return { ticks, niceMax }
}

function formatTick(value: number, valueType: 'money' | 'count', currency: string): string {
  if (valueType === 'money') return formatDashboardMoneyCompact(value, currency)
  return Math.round(value).toLocaleString(undefined, { maximumFractionDigits: 0 })
}

function formatTooltipValue(value: number, valueType: 'money' | 'count', currency: string): string {
  if (valueType === 'money')
    return formatDashboardMoney(value, currency, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  return Math.round(value).toLocaleString(undefined, { maximumFractionDigits: 0 })
}

function pctVsPrevious(currentCum: number, prevCum: number): number {
  if (prevCum === 0) return currentCum === 0 ? 0 : 100
  return ((currentCum - prevCum) / prevCum) * 100
}

export function OverviewMetricChart({
  label,
  valueType,
  currency,
  dailyCurrent,
  dailyPrevious,
  tooltipDayLabelsCurrent,
  tooltipDayLabelsPrevious,
  sevenDayTotalLabel,
  previousPeriodTotalLabel,
}: {
  label: string
  valueType: 'money' | 'count'
  currency: string
  dailyCurrent: number[]
  dailyPrevious: number[]
  tooltipDayLabelsCurrent: string[]
  tooltipDayLabelsPrevious: string[]
  sevenDayTotalLabel: string
  previousPeriodTotalLabel: string
}) {
  const chartHitRef = useRef<HTMLDivElement>(null)
  const [hoverDay, setHoverDay] = useState<number | null>(null)
  const [pointerPct, setPointerPct] = useState<{ lx: number; ly: number } | null>(null)
  const gradId = useId().replace(/:/g, '')

  /** Re-render once a minute so the partial-today segment advances with wall time. */
  const [liveTick, setLiveTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setLiveTick((t) => t + 1), 60_000)
    return () => clearInterval(id)
  }, [])

  const geom = useMemo(() => {
    const cumC = cum7(dailyCurrent)
    const cumP = cum7(dailyPrevious)
    const maxData = Math.max(0, ...cumC, ...cumP)
    const { ticks, niceMax } = niceTicks(maxData, valueType === 'count')

    const xAt = (d: number) => PAD_L + (d / 6) * innerW
    const yAt = (v: number) => PAD_T + innerH * (1 - v / niceMax)

    const now = new Date()
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const fracDay = Math.min(
      1,
      Math.max(0, (now.getTime() - dayStart.getTime()) / 86_400_000)
    )
    const x5 = xAt(5)
    const x6 = xAt(6)
    const xSplit = x5 + fracDay * (x6 - x5)
    const inc6 = dailyCurrent[6] ?? 0
    const cumSplit = (cumC[5] ?? 0) + inc6 * fracDay

    // Area under the solid (already-closed) current line — drops to baseline at xSplit.
    let area = `M ${xAt(0)} ${BASELINE_Y}`
    area += ` L ${xAt(0)} ${yAt(cumC[0] ?? 0)}`
    for (let i = 1; i <= 5; i++) area += ` L ${xAt(i)} ${yAt(cumC[i] ?? 0)}`
    area += ` L ${xSplit} ${yAt(cumSplit)}`
    area += ` L ${xSplit} ${BASELINE_Y} Z`

    // Solid current line up to "now".
    let solid = `M ${xAt(0)} ${yAt(cumC[0] ?? 0)}`
    for (let i = 1; i <= 5; i++) solid += ` L ${xAt(i)} ${yAt(cumC[i] ?? 0)}`
    solid += ` L ${xSplit} ${yAt(cumSplit)}`

    // Dashed segment: unclosed portion of today.
    const dashed = `M ${xSplit} ${yAt(cumSplit)} L ${xAt(6)} ${yAt(cumC[6] ?? 0)}`

    // Ghost line for previous period (for context, not the primary series).
    let prev = `M ${xAt(0)} ${yAt(cumP[0] ?? 0)}`
    for (let i = 1; i < 7; i++) prev += ` L ${xAt(i)} ${yAt(cumP[i] ?? 0)}`

    return { cumC, cumP, niceMax, ticks, xAt, yAt, area, solid, dashed, prev, xSplit }
  }, [dailyCurrent, dailyPrevious, valueType, liveTick])

  const onChartMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const el = chartHitRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    if (r.width <= 0 || r.height <= 0) return
    const relX = event.clientX - r.left
    const relY = event.clientY - r.top
    /** Only consider horizontal area inside the plotted region (exclude right gutter). */
    const plotWidth = r.width * (innerW / VB_W)
    if (relX > plotWidth) {
      setHoverDay(null)
      setPointerPct(null)
      return
    }
    const u = Math.min(1, Math.max(0, relX / plotWidth))
    const day = Math.min(6, Math.max(0, Math.round(u * 6)))
    setHoverDay(day)
    setPointerPct({ lx: (relX / r.width) * 100, ly: (relY / r.height) * 100 })
  }

  const onChartMouseLeave = () => {
    setHoverDay(null)
    setPointerPct(null)
  }

  const tooltipMeta = useMemo(() => {
    if (hoverDay === null) return null
    const curAt = geom.cumC[hoverDay] ?? 0
    const prevAt = geom.cumP[hoverDay] ?? 0
    return {
      curAt,
      prevAt,
      pct: pctVsPrevious(curAt, prevAt),
      currentLine: tooltipDayLabelsCurrent[hoverDay] ?? '',
      previousLine: tooltipDayLabelsPrevious[hoverDay] ?? '',
    }
  }, [hoverDay, geom, tooltipDayLabelsCurrent, tooltipDayLabelsPrevious])

  const axisStart = tooltipDayLabelsCurrent[0] ?? ''
  const axisEnd = tooltipDayLabelsCurrent[6] ?? ''

  return (
    <div
      className="flex min-h-0 w-full flex-1 flex-col"
      aria-label={`${label} last 7 days, total ${sevenDayTotalLabel}, previous period ${previousPeriodTotalLabel}`}
    >
      <div className="flex min-h-0 min-w-0 flex-1 flex-col basis-0">
        <div
          ref={chartHitRef}
          className="relative min-h-[160px] w-full flex-1 cursor-default"
          onMouseMove={onChartMouseMove}
          onMouseLeave={onChartMouseLeave}
        >
          <svg
            className="absolute inset-0 block h-full w-full overflow-visible"
            viewBox={`0 0 ${VB_W} ${VB_H}`}
            preserveAspectRatio="none"
            role="img"
            aria-label={`${label}, last 7 days cumulative`}
          >
            <defs>
              <linearGradient id={`grad-${gradId}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={BRAND} stopOpacity="0.16" />
                <stop offset="60%" stopColor={BRAND} stopOpacity="0.05" />
                <stop offset="100%" stopColor={BRAND} stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Horizontal gridlines — one per nice tick. */}
            {geom.ticks.map((tick) => {
              const y = PAD_T + innerH * (1 - tick / geom.niceMax)
              return (
                <line
                  key={`grid-${tick}`}
                  x1={PAD_L}
                  x2={VB_W - PAD_R}
                  y1={y}
                  y2={y}
                  stroke={GRID}
                  strokeWidth="1"
                  vectorEffect="non-scaling-stroke"
                />
              )
            })}

            {/* Previous period ghost line. */}
            <path
              d={geom.prev}
              fill="none"
              stroke={PREV_LINE}
              strokeWidth="1.25"
              strokeDasharray="0"
              vectorEffect="non-scaling-stroke"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0.9}
            />

            {/* Current area fill. */}
            <path d={geom.area} fill={`url(#grad-${gradId})`} stroke="none" />

            {/* Dashed tail for partial today. */}
            <path
              d={geom.dashed}
              fill="none"
              stroke={BRAND}
              strokeWidth="1.75"
              strokeDasharray="4 4"
              strokeOpacity={0.55}
              vectorEffect="non-scaling-stroke"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Current solid line. */}
            <path
              d={geom.solid}
              fill="none"
              stroke={BRAND}
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Hover crosshair + point. */}
            {hoverDay !== null ? (
              <g>
                <line
                  x1={geom.xAt(hoverDay)}
                  x2={geom.xAt(hoverDay)}
                  y1={PAD_T}
                  y2={BASELINE_Y}
                  stroke="#9ca3af"
                  strokeWidth="1"
                  strokeDasharray="3 4"
                  vectorEffect="non-scaling-stroke"
                />
                <circle
                  cx={geom.xAt(hoverDay)}
                  cy={geom.yAt(geom.cumC[hoverDay] ?? 0)}
                  r={3.5}
                  fill={BRAND}
                  stroke="#ffffff"
                  strokeWidth="1.75"
                  vectorEffect="non-scaling-stroke"
                />
              </g>
            ) : null}
          </svg>

          {/* Y-axis labels (HTML overlay keeps typography crisp regardless of stretched SVG). */}
          <div
            className="pointer-events-none absolute inset-0"
            aria-hidden
          >
            {geom.ticks.map((tick) => {
              const topPct = ((PAD_T + innerH * (1 - tick / geom.niceMax)) / VB_H) * 100
              return (
                <span
                  key={`label-${tick}`}
                  className="absolute right-0 -translate-y-1/2 pl-2 text-[11px] font-light tabular-nums leading-none"
                  style={{ top: `${topPct}%`, color: TICK_LABEL }}
                >
                  {formatTick(tick, valueType, currency)}
                </span>
              )
            })}
          </div>

          {tooltipMeta && pointerPct ? (
            <div
              className="pointer-events-none absolute z-20 w-[min(240px,calc(100vw-2rem))] rounded-lg border border-gray-200 bg-white p-3 text-left shadow-lg"
              style={{
                left: `${pointerPct.lx}%`,
                top: `${pointerPct.ly}%`,
                transform: 'translate(-50%, 10px)',
              }}
              role="tooltip"
            >
              <div className="flex items-start justify-between gap-2 border-b border-gray-100 pb-2">
                <span className="text-xs font-medium text-gray-900">{label}</span>
                <span
                  className={`shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-semibold tabular-nums ${
                    tooltipMeta.pct > 0
                      ? 'bg-emerald-50 text-emerald-800'
                      : tooltipMeta.pct < 0
                        ? 'bg-red-50 text-red-800'
                        : 'bg-gray-100 text-gray-700'
                  }`}
                  title="Change from previous period’s cumulative total on this day"
                >
                  {tooltipMeta.pct >= 0 ? '+' : ''}
                  {tooltipMeta.pct.toFixed(1)}%
                </span>
              </div>
              <div className="mt-2 space-y-2">
                <div className="flex items-center gap-2 text-xs">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-sm"
                    style={{ backgroundColor: BRAND }}
                    aria-hidden
                  />
                  <span className="flex-1 text-gray-600">{tooltipMeta.currentLine}</span>
                  <span className="text-[11px] font-light tabular-nums text-gray-700 sm:text-xs">
                    {formatTooltipValue(tooltipMeta.curAt, valueType, currency)}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-sm bg-gray-300" aria-hidden />
                  <span className="flex-1 text-gray-600">{tooltipMeta.previousLine}</span>
                  <span className="text-[11px] font-light tabular-nums text-gray-600 sm:text-xs">
                    {formatTooltipValue(tooltipMeta.prevAt, valueType, currency)}
                  </span>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <div
          className="grid grid-cols-2 items-baseline gap-1 pr-[52px] pt-1 text-[11px] font-light tabular-nums"
          style={{ color: TICK_LABEL }}
        >
          <span className="min-w-0 truncate text-left">{axisStart}</span>
          <span className="min-w-0 truncate text-right">{axisEnd}</span>
        </div>
      </div>
    </div>
  )
}
