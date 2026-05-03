'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { Check, ChevronDown } from 'lucide-react'
import { ComparisonDayCalendarPanel, parseLocalDayKey } from '@/components/manage/comparison-day-calendar-popover'
import { formatDashboardMoney } from '@/lib/currency/format-dashboard-money'
import { useCurrency } from '@/lib/contexts/currency-context'

const BRAND = '#003580'

export type TodayMetricId =
  | 'gross_volume'
  | 'new_customers'
  | 'successful_payments'
  | 'net_volume'

export type TodayMetricInput = {
  todayTotal: number
  yesterdayTotal: number
  /** Cumulative for today by hour index 0..24 */
  cumulativeByHour: number[]
  /** Same shape for yesterday (full prior calendar day) */
  yesterdayCumulativeByHour: number[]
}

export type TodayMetricsInput = Record<TodayMetricId, TodayMetricInput>

const METRIC_ORDER: TodayMetricId[] = [
  'gross_volume',
  'new_customers',
  'successful_payments',
  'net_volume',
]

const METRIC_LABEL: Record<TodayMetricId, string> = {
  gross_volume: 'Gross volume',
  new_customers: 'New customers',
  successful_payments: 'Successful payments',
  net_volume: 'Net volume',
}

const METRIC_VALUE_TYPE: Record<TodayMetricId, 'money' | 'count'> = {
  gross_volume: 'money',
  new_customers: 'count',
  successful_payments: 'count',
  net_volume: 'money',
}

// "Stripe-style" chart geometry (matches OverviewMetricChart, but hourly).
const PREV_LINE = '#d1d5db'

// Viewbox coordinates. SVG is drawn with `preserveAspectRatio="none"` so values below
// map linearly onto the real container box. HTML overlays reuse the same percentages.
const W = 600
const H = 200
const padL = 8
const padR = 8
const padT = 10
const padB = 18
const innerW = W - padL - padR
const innerH = H - padT - padB
const baselineY = padT + innerH

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

function normalize25(arr: number[] | undefined): number[] {
  if (!arr || arr.length !== 25) {
    return [...(arr || []), ...Array(25).fill(0)].slice(0, 25)
  }
  return arr
}

function formatMoney(amount: number, currency: string) {
  return formatDashboardMoney(amount, currency, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function formatCount(n: number) {
  return Math.round(n).toLocaleString(undefined, { maximumFractionDigits: 0 })
}

function formatMetricValue(amount: number, type: 'money' | 'count', currency: string) {
  return type === 'money' ? formatMoney(amount, currency) : formatCount(amount)
}

function formatClock24() {
  const n = new Date()
  const h = n.getHours().toString().padStart(2, '0')
  const m = n.getMinutes().toString().padStart(2, '0')
  return `${h}:${m}`
}

function formatHoverClockHour(hour: number) {
  const h = Math.min(24, Math.max(0, hour))
  return `${String(h).padStart(2, '0')}:00`
}

/** % change of *cumulative* today vs cumulative yesterday at the same hour index (00:00–24:00). */
function pctVsYesterday(todayAtH: number, yestAtH: number): number {
  if (yestAtH === 0) return todayAtH === 0 ? 0 : 100
  return ((todayAtH - yestAtH) / yestAtH) * 100
}

type SecondaryStat = { label: string; value: string }
type SecondaryStatLink = SecondaryStat & { href?: string; actionLabel?: string }

function convertTodayMetrics(
  metrics: TodayMetricsInput,
  metricsCurrency: string,
  convertPrice: (amount: number, fromCurrency: string) => number
): TodayMetricsInput {
  const convertMoneySlice = (input: TodayMetricInput): TodayMetricInput => ({
    todayTotal: convertPrice(input.todayTotal, metricsCurrency),
    yesterdayTotal: convertPrice(input.yesterdayTotal, metricsCurrency),
    cumulativeByHour: input.cumulativeByHour.map((v) => convertPrice(v, metricsCurrency)),
    yesterdayCumulativeByHour: input.yesterdayCumulativeByHour.map((v) =>
      convertPrice(v, metricsCurrency)
    ),
  })

  const out = {} as TodayMetricsInput
  for (const id of METRIC_ORDER) {
    if (METRIC_VALUE_TYPE[id] === 'money') {
      out[id] = convertMoneySlice(metrics[id]!)
    } else {
      out[id] = metrics[id]!
    }
  }
  return out
}

export function DashboardTodaySection({
  metricsCurrency,
  metrics,
  comparisonDayKey,
  maxComparisonDayKey,
  onComparisonDayChange,
  secondaryStats,
}: {
  /** ISO 4217 denomination of `metrics` money fields (usually gym listing currency). */
  metricsCurrency: string
  metrics: TodayMetricsInput
  /** Local calendar day (yyyy-mm-dd) used for comparison column + gray chart series */
  comparisonDayKey: string
  /** Last selectable day (inclusive), usually yesterday */
  maxComparisonDayKey: string
  onComparisonDayChange: (dayKey: string) => void
  secondaryStats: SecondaryStatLink[]
}) {
  const [selectedMetric, setSelectedMetric] = useState<TodayMetricId>('gross_volume')
  const [pickerOpen, setPickerOpen] = useState(false)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const pickerRef = useRef<HTMLDivElement>(null)
  const calendarWrapRef = useRef<HTMLDivElement>(null)
  const chartHitRef = useRef<HTMLDivElement>(null)

  const [hoverHour, setHoverHour] = useState<number | null>(null)

  const { selectedCurrency, convertPrice } = useCurrency()
  const displayMetrics = useMemo(() => {
    if (!metricsCurrency || metricsCurrency.toUpperCase() === selectedCurrency.toUpperCase()) {
      return metrics
    }
    return convertTodayMetrics(metrics, metricsCurrency, convertPrice)
  }, [metrics, metricsCurrency, selectedCurrency, convertPrice])

  const [, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (!pickerOpen && !calendarOpen) return
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node
      if (pickerOpen && pickerRef.current && !pickerRef.current.contains(t)) {
        setPickerOpen(false)
      }
      if (calendarOpen && calendarWrapRef.current && !calendarWrapRef.current.contains(t)) {
        setCalendarOpen(false)
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPickerOpen(false)
        setCalendarOpen(false)
      }
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [pickerOpen, calendarOpen])

  const liveTime = formatClock24()
  const comparisonDate = useMemo(() => parseLocalDayKey(comparisonDayKey), [comparisonDayKey])
  const active = displayMetrics[selectedMetric]
  const valueType = METRIC_VALUE_TYPE[selectedMetric]
  const todayDisplay = formatMetricValue(active.todayTotal, valueType, selectedCurrency)
  const yesterdayDisplay = formatMetricValue(active.yesterdayTotal, valueType, selectedCurrency)

  const chartGeom = useMemo(() => {
    const cumToday = normalize25(active.cumulativeByHour)
    const cumYesterday = normalize25(active.yesterdayCumulativeByHour)
    const maxData =
      valueType === 'money'
        ? Math.max(0, ...cumToday, ...cumYesterday, active.yesterdayTotal * 1.01)
        : Math.max(0, ...cumToday, ...cumYesterday, active.yesterdayTotal + 0.5, active.yesterdayTotal * 1.05)
    const { niceMax } = niceTicks(maxData, valueType === 'count')

    const xAt = (h: number) => padL + (h / 24) * innerW
    const yAt = (v: number) => padT + innerH * (1 - v / niceMax)

    const now = new Date()
    const dayStart = new Date(now)
    dayStart.setHours(0, 0, 0, 0)
    const msInto = Math.min(86400000, Math.max(0, now.getTime() - dayStart.getTime()))
    const frac = msInto / 86400000
    const xSplit = padL + frac * innerW

    const yForHourFloat = (hf: number) => {
      const h0 = Math.min(24, Math.floor(hf))
      const h1 = Math.min(24, Math.ceil(hf))
      const v0 = cumToday[h0] ?? 0
      const v1 = cumToday[h1] ?? v0
      const t = hf - h0
      const v = h1 === h0 ? v0 : v0 + (v1 - v0) * t
      return yAt(v)
    }

    const points: Array<{ x: number; y: number }> = []
    for (let h = 0; h <= 24; h++) {
      points.push({ x: xAt(h), y: yAt(cumToday[h] ?? 0) })
    }

    let solid = ''
    for (let i = 0; i < points.length; i++) {
      const p = points[i]
      if (p.x <= xSplit) {
        if (solid === '') solid = `M ${p.x} ${p.y}`
        else solid += ` L ${p.x} ${p.y}`
      } else {
        const prev = points[i - 1]
        if (prev && prev.x < xSplit) {
          const yS = yForHourFloat(frac * 24)
          solid += ` L ${xSplit} ${yS}`
        }
        break
      }
    }
    if (solid === '') {
      const y0 = yAt(cumToday[0] ?? 0)
      const yS = yForHourFloat(frac * 24)
      solid = `M ${padL} ${y0} L ${xSplit} ${yS}`
    }

    const ySplit = yForHourFloat(frac * 24)
    let dashed = `M ${xSplit} ${ySplit}`
    const hfStart = frac * 24
    const iStart = Math.ceil(hfStart)
    for (let h = Math.max(0, iStart); h <= 24; h++) {
      dashed += ` L ${xAt(h)} ${yAt(cumToday[h] ?? 0)}`
    }

    // Soft area under the closed (solid) segment — drops to baseline at xSplit.
    let area = `M ${xAt(0)} ${baselineY}`
    area += ` L ${xAt(0)} ${yAt(cumToday[0] ?? 0)}`
    for (let h = 1; h <= 24; h++) {
      const x = xAt(h)
      if (x <= xSplit) {
        area += ` L ${x} ${yAt(cumToday[h] ?? 0)}`
      } else {
        const yS = yForHourFloat(frac * 24)
        area += ` L ${xSplit} ${yS}`
        break
      }
    }
    area += ` L ${xSplit} ${baselineY} Z`

    let yesterdayPath = ''
    for (let h = 0; h <= 24; h++) {
      const x = xAt(h)
      const y = yAt(cumYesterday[h] ?? 0)
      yesterdayPath += h === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`
    }

    return {
      cumToday,
      cumYesterday,
      niceMax,
      xAt,
      yAt,
      areaPath: area,
      solidPath: solid,
      dashedPath: dashed,
      yesterdayPath,
      frac,
      xSplit,
    }
  }, [active.cumulativeByHour, active.yesterdayCumulativeByHour, active.yesterdayTotal, valueType, liveTime])

  const onChartMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = chartHitRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    if (r.width <= 0) return
    const relX = e.clientX - r.left
    const t = Math.min(1, Math.max(0, relX / r.width))
    const hour = Math.round(t * 24)
    setHoverHour(hour)
  }

  const onChartMouseLeave = () => setHoverHour(null)

  const tooltipMeta = useMemo(() => {
    if (hoverHour === null) return null
    const h = hoverHour
    const todayAt = chartGeom.cumToday[h] ?? 0
    const yestAt = chartGeom.cumYesterday[h] ?? 0
    const pct = pctVsYesterday(todayAt, yestAt)
    const now = new Date()
    const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const dateFmt = (d: Date) =>
      d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }).replace(',', '')

    const xSvg = chartGeom.xAt(h)
    const ySvg = chartGeom.yAt(todayAt)
    const leftPct = (xSvg / W) * 100
    const topPct = (ySvg / H) * 100

    return {
      todayAt,
      yestAt,
      pct,
      todayLine: `${dateFmt(todayDate)}, ${formatHoverClockHour(h)}`,
      yesterdayLine: `${dateFmt(comparisonDate)}, ${formatHoverClockHour(h)}`,
      leftPct,
      topPct,
    }
  }, [hoverHour, chartGeom, comparisonDate])

  const chartAria = `${METRIC_LABEL[selectedMetric]} today, cumulative through the day; hover for hourly values`

  return (
    <section aria-labelledby="dash-today-heading" className="space-y-0">
      <h2 id="dash-today-heading" className="text-xl font-semibold tracking-tight text-gray-900 sm:text-2xl">
        Today
      </h2>
      <div
        className="mt-7 h-px w-full bg-gray-200/90 sm:mt-9"
        aria-hidden
      />

      <div className="pt-6 sm:pt-8">
        <div className="flex flex-wrap items-start gap-x-14 sm:gap-x-20 lg:gap-x-24">
          <div ref={pickerRef} className="relative min-w-0">
            <button
              type="button"
              className="flex items-center gap-1 text-left text-sm font-normal text-gray-600 hover:text-gray-900"
              aria-expanded={pickerOpen}
              aria-haspopup="listbox"
              aria-controls="today-metric-listbox"
              onClick={() => {
                setCalendarOpen(false)
                setPickerOpen((o) => !o)
              }}
            >
              <span>{METRIC_LABEL[selectedMetric]}</span>
              <ChevronDown
                className={`h-3.5 w-3.5 shrink-0 opacity-50 transition-transform ${pickerOpen ? 'rotate-180' : ''}`}
                aria-hidden
              />
            </button>
            {pickerOpen ? (
              <div
                id="today-metric-listbox"
                role="listbox"
                aria-label="Choose metric"
                className="absolute left-0 top-full z-20 mt-1 min-w-[220px] rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
              >
                {METRIC_ORDER.map((id) => {
                  const selected = id === selectedMetric
                  return (
                    <button
                      key={id}
                      type="button"
                      role="option"
                      aria-selected={selected}
                      className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm transition-colors hover:bg-gray-50"
                      onClick={() => {
                        setSelectedMetric(id)
                        setPickerOpen(false)
                      }}
                    >
                      <span className="flex w-4 shrink-0 justify-center" aria-hidden>
                        {selected ? (
                          <Check className="h-4 w-4" strokeWidth={2.5} style={{ color: BRAND }} />
                        ) : null}
                      </span>
                      <span
                        className={selected ? 'font-medium' : 'text-gray-800'}
                        style={selected ? { color: BRAND } : undefined}
                      >
                        {METRIC_LABEL[id]}
                      </span>
                    </button>
                  )
                })}
              </div>
            ) : null}
            <p className="mt-0.5 text-lg font-light tabular-nums tracking-tight text-gray-700 sm:text-xl">
              {todayDisplay}
            </p>
            <p className="mt-0.5 text-xs font-normal tabular-nums text-gray-400">{liveTime}</p>
          </div>
          <div ref={calendarWrapRef} className="relative shrink-0">
            <button
              type="button"
              className="flex items-center gap-1 text-left text-sm font-normal text-gray-500 hover:text-gray-900"
              aria-expanded={calendarOpen}
              aria-haspopup="dialog"
              aria-controls="comparison-day-calendar"
              onClick={() => {
                setPickerOpen(false)
                setCalendarOpen((o) => !o)
              }}
            >
              <span>Yesterday</span>
              <ChevronDown
                className={`h-3.5 w-3.5 shrink-0 opacity-50 transition-transform ${calendarOpen ? 'rotate-180' : ''}`}
                aria-hidden
              />
            </button>
            {calendarOpen ? (
              <div
                id="comparison-day-calendar"
                className="absolute left-0 top-full z-30 mt-1"
                role="dialog"
                aria-label="Choose comparison day"
              >
                <ComparisonDayCalendarPanel
                  valueKey={comparisonDayKey}
                  maxDayKey={maxComparisonDayKey}
                  onSelect={(k) => {
                    onComparisonDayChange(k)
                    setCalendarOpen(false)
                  }}
                />
              </div>
            ) : null}
            <p className="mt-0.5 text-lg font-light tabular-nums tracking-tight text-gray-600 sm:text-xl">
              {yesterdayDisplay}
            </p>
          </div>
        </div>

        <div className="mt-8">
          <div
            ref={chartHitRef}
            className="relative min-h-[160px] w-full cursor-default"
            onMouseMove={onChartMouseMove}
            onMouseLeave={onChartMouseLeave}
          >
            <svg
              className="absolute inset-0 block h-full w-full overflow-visible"
              viewBox={`0 0 ${W} ${H}`}
              preserveAspectRatio="none"
              role="img"
              aria-label={chartAria}
            >
              <defs>
                <linearGradient id="today-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={BRAND} stopOpacity="0.16" />
                  <stop offset="60%" stopColor={BRAND} stopOpacity="0.05" />
                  <stop offset="100%" stopColor={BRAND} stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d={chartGeom.yesterdayPath}
                fill="none"
                stroke={PREV_LINE}
                strokeWidth="1.25"
                vectorEffect="non-scaling-stroke"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={0.95}
              />
              <path d={chartGeom.areaPath} fill="url(#today-grad)" stroke="none" />
              <path
                d={chartGeom.dashedPath}
                fill="none"
                stroke={BRAND}
                strokeWidth="1.75"
                strokeDasharray="4 4"
                strokeOpacity={0.55}
                vectorEffect="non-scaling-stroke"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d={chartGeom.solidPath}
                fill="none"
                stroke={BRAND}
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {hoverHour !== null ? (
                <g>
                  <line
                    x1={chartGeom.xAt(hoverHour)}
                    x2={chartGeom.xAt(hoverHour)}
                    y1={padT}
                    y2={baselineY}
                    stroke="#9ca3af"
                    strokeWidth="1"
                    strokeDasharray="3 4"
                    vectorEffect="non-scaling-stroke"
                  />
                  <circle
                    cx={chartGeom.xAt(hoverHour)}
                    cy={chartGeom.yAt(chartGeom.cumToday[hoverHour] ?? 0)}
                    r={3.5}
                    fill={BRAND}
                    stroke="#ffffff"
                    strokeWidth="1.75"
                    vectorEffect="non-scaling-stroke"
                  />
                </g>
              ) : null}
            </svg>

            {tooltipMeta ? (
              <div
                className="pointer-events-none absolute z-20 w-[min(240px,calc(100vw-2rem))] rounded-lg border border-gray-200 bg-white p-3 text-left shadow-lg"
                style={{
                  left: `${tooltipMeta.leftPct}%`,
                  top: `${tooltipMeta.topPct}%`,
                  transform: 'translate(-50%, 10px)',
                }}
                role="tooltip"
              >
                <div className="flex items-start justify-between gap-2 border-b border-gray-100 pb-2">
                  <span className="text-xs font-medium text-gray-900">{METRIC_LABEL[selectedMetric]}</span>
                  <span
                    className={`shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-semibold tabular-nums ${
                      tooltipMeta.pct > 0
                        ? 'bg-emerald-50 text-emerald-800'
                        : tooltipMeta.pct < 0
                          ? 'bg-red-50 text-red-800'
                          : 'bg-gray-100 text-gray-700'
                    }`}
                    title="Change from yesterday’s cumulative total at this time of day"
                  >
                    {tooltipMeta.pct >= 0 ? '+' : ''}
                    {tooltipMeta.pct.toFixed(1)}%
                  </span>
                </div>
                <div className="mt-2 space-y-2">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: BRAND }} />
                    <span className="flex-1 text-gray-600">{tooltipMeta.todayLine}</span>
                    <span className="text-[11px] font-light tabular-nums text-gray-700 sm:text-xs">
                      {formatMetricValue(tooltipMeta.todayAt, valueType, selectedCurrency)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-sm bg-gray-300" />
                    <span className="flex-1 text-gray-600">{tooltipMeta.yesterdayLine}</span>
                    <span className="text-[11px] font-light tabular-nums text-gray-600 sm:text-xs">
                      {formatMetricValue(tooltipMeta.yestAt, valueType, selectedCurrency)}
                    </span>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
          <div className="flex justify-between px-0.5 pt-1 text-[11px] font-light tabular-nums text-gray-400">
            <span>00:00</span>
            <span>12:00</span>
            <span>24:00</span>
          </div>
        </div>

        {secondaryStats.length > 0 ? (
          <div className="mt-10 grid grid-cols-2 gap-x-12 gap-y-4 pt-2 sm:gap-x-20">
            {secondaryStats.map((s) => (
              <div key={s.label}>
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-sm font-normal text-gray-600">{s.label}</p>
                  {s.href ? (
                    <Link
                      href={s.href}
                      className="shrink-0 text-sm font-normal text-[#003580] underline-offset-2 hover:underline"
                    >
                      {s.actionLabel ?? 'View'}
                    </Link>
                  ) : null}
                </div>
                <p className="mt-1 text-xs font-light tabular-nums text-gray-700 sm:text-sm">
                  {s.value}
                </p>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  )
}
