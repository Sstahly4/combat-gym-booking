'use client'

import { useMemo } from 'react'

const BRAND = '#003580'
const GRID = '#eef2f7'

const VB_W = 600
const VB_H = 160
const PAD_L = 4
const PAD_R = 8
const PAD_T = 8
const PAD_B = 22
const innerW = VB_W - PAD_L - PAD_R
const innerH = VB_H - PAD_T - PAD_B
const BASELINE_Y = PAD_T + innerH

function niceMax(maxValue: number): number {
  if (maxValue <= 0) return 4
  const exp = Math.floor(Math.log10(maxValue))
  const f = maxValue / Math.pow(10, exp)
  let nf = 10
  if (f <= 1) nf = 1
  else if (f <= 2) nf = 2
  else if (f <= 5) nf = 5
  return Math.ceil(maxValue / (nf * Math.pow(10, exp - 1))) * (nf * Math.pow(10, exp - 1)) || 4
}

function formatShortDate(iso: string): string {
  const d = new Date(`${iso}T12:00:00`)
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export function AnalyticsPeriodChart({
  title,
  labels,
  values,
  subtitle,
}: {
  title: string
  labels: string[]
  values: number[]
  subtitle?: string
}) {
  const geom = useMemo(() => {
    const max = Math.max(0, ...values)
    const yMax = niceMax(max)
    const n = Math.max(values.length, 1)
    const step = innerW / n
    const xAt = (i: number) => PAD_L + step * i + step / 2
    const yAt = (v: number) => PAD_T + innerH * (1 - v / yMax)

    let area = `M ${PAD_L} ${BASELINE_Y}`
    values.forEach((v, i) => {
      area += ` L ${xAt(i)} ${yAt(v)}`
    })
    area += ` L ${PAD_L + innerW} ${BASELINE_Y} Z`

    let line = values.length > 0 ? `M ${xAt(0)} ${yAt(values[0])}` : ''
    for (let i = 1; i < values.length; i++) {
      line += ` L ${xAt(i)} ${yAt(values[i])}`
    }

    const tickIndices =
      n <= 7
        ? values.map((_, i) => i)
        : [0, Math.floor((n - 1) / 2), n - 1]

    return { yMax, xAt, yAt, area, line, tickIndices, n }
  }, [values])

  const total = values.reduce((s, v) => s + v, 0)

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4 sm:p-5">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-stone-900">{title}</h3>
          {subtitle ? <p className="mt-0.5 text-xs text-stone-500">{subtitle}</p> : null}
        </div>
        <p className="text-lg font-semibold tabular-nums text-stone-900">
          {total.toLocaleString()}
          <span className="ml-1 text-xs font-normal text-stone-500">total</span>
        </p>
      </div>

      <div className="relative h-[140px] w-full">
        <svg
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          className="h-full w-full"
          preserveAspectRatio="none"
          role="img"
          aria-label={title}
        >
          <line x1={PAD_L} y1={BASELINE_Y} x2={PAD_L + innerW} y2={BASELINE_Y} stroke={GRID} />
          <path d={geom.area} fill={BRAND} fillOpacity={0.12} />
          <path d={geom.line} fill="none" stroke={BRAND} strokeWidth={2} vectorEffect="non-scaling-stroke" />
        </svg>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-between px-0.5 text-[10px] text-stone-400">
          {geom.tickIndices.map((i) => (
            <span key={labels[i] ?? i}>{formatShortDate(labels[i] ?? '')}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

export function AnalyticsSparkline({ values }: { values: number[] }) {
  const path = useMemo(() => {
    const max = Math.max(1, ...values)
    const n = Math.max(values.length, 2)
    const w = 64
    const h = 28
    const pts = values.map((v, i) => {
      const x = (i / (n - 1)) * w
      const y = h - (v / max) * (h - 4) - 2
      return `${x},${y}`
    })
    return `M ${pts.join(' L ')}`
  }, [values])

  return (
    <svg viewBox="0 0 64 28" className="h-7 w-16 shrink-0" aria-hidden>
      <path d={path} fill="none" stroke={BRAND} strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

export function AnalyticsKpiCard({
  label,
  value,
  valueSuffix,
  deltaPct,
  sparkline,
  loading,
}: {
  label: string
  value: string
  valueSuffix?: string
  deltaPct: number | null
  sparkline?: number[]
  loading?: boolean
}) {
  const deltaLabel =
    deltaPct === null
      ? null
      : deltaPct === 0
        ? 'Flat vs prior period'
        : `${deltaPct > 0 ? '+' : ''}${deltaPct.toFixed(0)}% vs prior period`

  return (
    <div className="flex h-full flex-col rounded-xl border border-stone-200 bg-white p-4">
      <p className="text-[11px] font-medium uppercase tracking-wider text-stone-500">{label}</p>
      <div className="mt-2 flex items-end justify-between gap-2">
        <p className="text-2xl font-semibold tabular-nums text-stone-900">
          {loading ? (
            <span className="inline-block h-7 w-14 animate-pulse rounded bg-stone-100" />
          ) : (
            <>
              {value}
              {valueSuffix ? (
                <span className="ml-0.5 text-base font-medium text-stone-600">{valueSuffix}</span>
              ) : null}
            </>
          )}
        </p>
        {!loading && sparkline && sparkline.length > 0 ? (
          <AnalyticsSparkline values={sparkline} />
        ) : null}
      </div>
      {!loading && deltaLabel ? (
        <p
          className={`mt-1.5 text-xs ${
            deltaPct === null || deltaPct === 0
              ? 'text-stone-500'
              : deltaPct > 0
                ? 'text-emerald-700'
                : 'text-amber-800'
          }`}
        >
          {deltaLabel}
        </p>
      ) : null}
    </div>
  )
}

export function AnalyticsRankedTable({
  title,
  description,
  rows,
  emptyMessage,
}: {
  title: string
  description?: string
  rows: Array<{ label: string; count: number; meta?: string }>
  emptyMessage: string
}) {
  const max = Math.max(1, ...rows.map((r) => r.count))

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4 sm:p-5">
      <h3 className="text-sm font-semibold text-stone-900">{title}</h3>
      {description ? <p className="mt-0.5 text-xs text-stone-500">{description}</p> : null}
      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-stone-500">{emptyMessage}</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {rows.map((row) => (
            <li key={row.label}>
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="min-w-0 truncate font-medium text-stone-800">{row.label}</span>
                <span className="shrink-0 tabular-nums text-stone-600">{row.count.toLocaleString()}</span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-stone-100">
                <div
                  className="h-full rounded-full bg-[#003580]"
                  style={{ width: `${Math.max(4, (row.count / max) * 100)}%` }}
                />
              </div>
              {row.meta ? <p className="mt-0.5 text-[11px] text-stone-400">{row.meta}</p> : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
