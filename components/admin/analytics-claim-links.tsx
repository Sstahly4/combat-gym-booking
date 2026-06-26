'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, ExternalLink, Info } from 'lucide-react'
import {
  CLAIM_LINK_ADMIN_PREVIEW_SECONDS,
  type ClaimLinkAnalyticsPayload,
  type ClaimLinkActivityStatus,
  type ClaimLinkFunnelRow,
} from '@/lib/admin/fetch-claim-link-analytics'
import { AnalyticsKpiCard } from '@/components/admin/analytics-charts'
import { cn } from '@/lib/utils'

const BRAND = '#003580'
const OPEN_COLOR = '#0d9488'
const CLAIM_COLOR = '#7c3aed'
const GRID = '#eef2f7'

const VB_W = 600
const VB_H = 180
const PAD_L = 8
const PAD_R = 8
const PAD_T = 12
const PAD_B = 24
const innerW = VB_W - PAD_L - PAD_R
const innerH = VB_H - PAD_T - PAD_B
const BASELINE_Y = PAD_T + innerH

type SeriesKey = 'issued' | 'opened' | 'claimed'

const SERIES: Record<SeriesKey, { label: string; color: string }> = {
  issued: { label: 'Issued', color: BRAND },
  opened: { label: 'Opened', color: OPEN_COLOR },
  claimed: { label: 'Completed', color: CLAIM_COLOR },
}

function pctDelta(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : 100
  return ((current - previous) / previous) * 100
}

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

function formatDateTime(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function statusLabel(status: ClaimLinkActivityStatus): string {
  switch (status) {
    case 'awaiting_click':
      return 'Awaiting open'
    case 'opened':
      return 'Opened'
    case 'claimed':
      return 'Completed'
    case 'expired':
      return 'Expired'
    case 'revoked':
      return 'Revoked'
  }
}

function statusClass(status: ClaimLinkActivityStatus): string {
  switch (status) {
    case 'awaiting_click':
      return 'bg-emerald-50 text-emerald-800 ring-emerald-200'
    case 'opened':
      return 'bg-sky-50 text-sky-800 ring-sky-200'
    case 'claimed':
      return 'bg-violet-50 text-violet-800 ring-violet-200'
    case 'expired':
      return 'bg-amber-50 text-amber-900 ring-amber-200'
    case 'revoked':
      return 'bg-stone-100 text-stone-700 ring-stone-200'
  }
}

function ClaimFunnelBar({
  issued,
  opened,
  openedExclPreview,
  claimed,
  loading,
}: {
  issued: number
  opened: number
  openedExclPreview: number
  claimed: number
  loading?: boolean
}) {
  const stages = [
    { key: 'issued', label: 'Links issued', value: issued, color: BRAND },
    { key: 'opened', label: 'Opened (all)', value: opened, color: OPEN_COLOR },
    { key: 'claimed', label: 'Completed', value: claimed, color: CLAIM_COLOR },
  ]
  const max = Math.max(issued, 1)

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-stone-900">Claim funnel</h3>
          <p className="mt-0.5 text-xs text-stone-500">
            Per link issued this period — one row per token, not per gym
          </p>
        </div>
        <Link
          href="/admin/orphan-gyms"
          className="inline-flex items-center gap-1 text-xs font-medium text-[#003580] hover:underline"
        >
          Manage links
          <ExternalLink className="h-3 w-3" />
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr_auto_1fr] sm:items-center">
        {stages.map((stage, i) => (
          <div key={stage.key} className="contents">
            <div className="rounded-xl border border-stone-100 bg-stone-50/50 p-4">
              <p className="text-[11px] font-medium uppercase tracking-wider text-stone-500">
                {stage.label}
              </p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-stone-900">
                {loading ? '—' : stage.value.toLocaleString()}
              </p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-stone-200/80">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.max(loading ? 0 : 8, (stage.value / max) * 100)}%`,
                    backgroundColor: stage.color,
                  }}
                />
              </div>
            </div>
            {i < stages.length - 1 ? (
              <div className="hidden justify-center sm:flex">
                <ArrowRight className="h-4 w-4 text-stone-300" aria-hidden />
              </div>
            ) : null}
          </div>
        ))}
      </div>

      {!loading && issued > 0 ? (
        <p className="mt-4 text-xs text-stone-500">
          {openedExclPreview.toLocaleString()} owner-scale opens (excl. opens within{' '}
          {CLAIM_LINK_ADMIN_PREVIEW_SECONDS / 60} min of issue). {claimed.toLocaleString()}{' '}
          completed ({((claimed / issued) * 100).toFixed(1)}% claim rate).
        </p>
      ) : null}
    </div>
  )
}

function ClaimMultiSeriesChart({
  labels,
  series,
  loading,
}: {
  labels: string[]
  series: Record<SeriesKey, number[]>
  loading?: boolean
}) {
  const [active, setActive] = useState<Set<SeriesKey>>(
    () => new Set(['issued', 'opened', 'claimed']),
  )
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)

  const geom = useMemo(() => {
    const keys = (['issued', 'opened', 'claimed'] as SeriesKey[]).filter((k) => active.has(k))
    const allValues = keys.flatMap((k) => series[k])
    const max = Math.max(0, ...allValues)
    const yMax = niceMax(max)
    const n = Math.max(labels.length, 1)
    const step = innerW / n
    const xAt = (i: number) => PAD_L + step * i + step / 2
    const yAt = (v: number) => PAD_T + innerH * (1 - v / yMax)

    const lines = keys.map((key) => {
      const values = series[key]
      let path = values.length > 0 ? `M ${xAt(0)} ${yAt(values[0])}` : ''
      for (let i = 1; i < values.length; i++) {
        path += ` L ${xAt(i)} ${yAt(values[i])}`
      }
      return { key, path, color: SERIES[key].color, values }
    })

    const tickIndices =
      n <= 7 ? labels.map((_, i) => i) : [0, Math.floor((n - 1) / 2), n - 1]

    return { xAt, yAt, lines, tickIndices, n, step }
  }, [labels, series, active])

  function toggleSeries(key: SeriesKey) {
    setActive((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        if (next.size > 1) next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4 sm:p-5">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-stone-900">Daily trend</h3>
          <p className="mt-0.5 text-xs text-stone-500">Unique links per stage, by day</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(['issued', 'opened', 'claimed'] as SeriesKey[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => toggleSeries(key)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors',
                active.has(key)
                  ? 'border-stone-300 bg-white text-stone-800 shadow-sm'
                  : 'border-transparent bg-stone-100 text-stone-400',
              )}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: active.has(key) ? SERIES[key].color : '#d6d3d1' }}
              />
              {SERIES[key].label}
            </button>
          ))}
        </div>
      </div>

      <div className="relative h-[160px] w-full">
        {loading ? (
          <div className="flex h-full items-center justify-center text-sm text-stone-400">
            Loading chart…
          </div>
        ) : (
          <>
            <svg
              viewBox={`0 0 ${VB_W} ${VB_H}`}
              className="h-full w-full"
              preserveAspectRatio="none"
              role="img"
              aria-label="Claim link daily trend"
              onMouseLeave={() => setHoverIndex(null)}
            >
              <line x1={PAD_L} y1={BASELINE_Y} x2={PAD_L + innerW} y2={BASELINE_Y} stroke={GRID} />
              {geom.lines.map((line) => (
                <path
                  key={line.key}
                  d={line.path}
                  fill="none"
                  stroke={line.color}
                  strokeWidth={2}
                  vectorEffect="non-scaling-stroke"
                  opacity={hoverIndex === null ? 1 : 0.45}
                />
              ))}
              {hoverIndex !== null &&
                geom.lines.map((line) => {
                  const v = line.values[hoverIndex] ?? 0
                  return (
                    <circle
                      key={`${line.key}-dot`}
                      cx={geom.xAt(hoverIndex)}
                      cy={geom.yAt(v)}
                      r={4}
                      fill={line.color}
                      stroke="white"
                      strokeWidth={2}
                    />
                  )
                })}
              {labels.map((_, i) => (
                <rect
                  key={`hover-${i}`}
                  x={PAD_L + geom.step * i}
                  y={PAD_T}
                  width={geom.step}
                  height={innerH}
                  fill="transparent"
                  onMouseEnter={() => setHoverIndex(i)}
                />
              ))}
            </svg>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-between px-0.5 text-[10px] text-stone-400">
              {geom.tickIndices.map((i) => (
                <span key={labels[i] ?? i}>{formatShortDate(labels[i] ?? '')}</span>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function RateComparison({
  ownerOpenRate,
  openRate,
  claimRate,
  completionFromOpen,
  likelyAdminPreviews,
  loading,
}: {
  ownerOpenRate: { current: number; previous: number }
  openRate: { current: number; previous: number }
  claimRate: { current: number; previous: number }
  completionFromOpen: { current: number; previous: number }
  likelyAdminPreviews: number
  loading?: boolean
}) {
  return (
    <div className="rounded-xl border border-stone-200 bg-gradient-to-br from-white to-stone-50 p-4 sm:p-5">
      <h3 className="text-sm font-semibold text-stone-900">Open rate vs claim rate</h3>
      <p className="mt-0.5 text-xs text-stone-500">
        Industry-style funnel: issued → first open → password completed. Opens are recorded per
        token when <code className="text-[10px]">/claim/&lt;token&gt;</code> succeeds.
      </p>

      <div className="mt-5 grid gap-6 sm:grid-cols-2">
        <div>
          <div className="flex items-end justify-between gap-2">
            <p className="text-[11px] font-medium uppercase tracking-wider text-teal-700">
              Owner open rate
            </p>
            <p className="text-xs text-stone-500">excl. quick tests</p>
          </div>
          <p className="mt-2 text-4xl font-semibold tabular-nums text-stone-900">
            {loading ? '—' : `${ownerOpenRate.current.toFixed(1)}%`}
          </p>
          {!loading ? (
            <p className="mt-1 text-xs text-stone-500">
              Raw open rate {openRate.current.toFixed(1)}% (includes all opens)
            </p>
          ) : null}
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-stone-200">
            <div
              className="h-full rounded-full bg-teal-600 transition-all duration-700"
              style={{ width: `${Math.min(100, ownerOpenRate.current)}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex items-end justify-between gap-2">
            <p className="text-[11px] font-medium uppercase tracking-wider text-violet-700">
              Claim rate
            </p>
            <p className="text-xs text-stone-500">completed ÷ issued</p>
          </div>
          <p className="mt-2 text-4xl font-semibold tabular-nums text-stone-900">
            {loading ? '—' : `${claimRate.current.toFixed(1)}%`}
          </p>
          {!loading && ownerOpenRate.current > 0 ? (
            <p className="mt-1 text-xs text-stone-500">
              {completionFromOpen.current.toFixed(1)}% of owner-scale opens completed
            </p>
          ) : null}
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-stone-200">
            <div
              className="h-full rounded-full bg-violet-600 transition-all duration-700"
              style={{ width: `${Math.min(100, claimRate.current)}%` }}
            />
          </div>
        </div>
      </div>

      {!loading && likelyAdminPreviews > 0 ? (
        <p className="mt-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50/80 px-3 py-2 text-xs text-amber-950">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            {likelyAdminPreviews} open{likelyAdminPreviews === 1 ? '' : 's'} happened within{' '}
            {CLAIM_LINK_ADMIN_PREVIEW_SECONDS / 60} minutes of issuing — often an admin smoke-test
            right after generating the link. Those are excluded from owner open rate.
          </span>
        </p>
      ) : null}
    </div>
  )
}

function FunnelRosterTable({
  rows,
  loading,
}: {
  rows: ClaimLinkFunnelRow[]
  loading?: boolean
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-stone-200 bg-white">
      <div className="border-b border-stone-100 px-4 py-3 sm:px-5">
        <h3 className="text-sm font-semibold text-stone-900">Link-by-link roster</h3>
        <p className="mt-0.5 text-xs text-stone-500">
          Every link issued in this period — who it was for, when it was opened, and completion
          status
        </p>
      </div>
      <div className="overflow-x-auto">
        {loading ? (
          <p className="px-5 py-10 text-center text-sm text-stone-500">Loading roster…</p>
        ) : rows.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-stone-500">
            No claim links issued in this period.
          </p>
        ) : (
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-stone-100 text-[11px] font-semibold uppercase tracking-wider text-stone-500">
                <th className="px-4 py-3 font-semibold sm:px-5">Gym</th>
                <th className="px-4 py-3 font-semibold">Sent to</th>
                <th className="px-4 py-3 font-semibold">Issued</th>
                <th className="px-4 py-3 font-semibold">Opened</th>
                <th className="px-4 py-3 font-semibold">Completed</th>
                <th className="px-4 py-3 font-semibold sm:px-5">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.token_id} className="border-b border-stone-50 last:border-0">
                  <td className="px-4 py-3 sm:px-5">
                    <Link
                      href={`/admin/orphan-gyms?gym_id=${encodeURIComponent(row.gym_id)}`}
                      className="font-medium text-stone-900 hover:text-[#003580] hover:underline"
                    >
                      {row.gym_name}
                    </Link>
                    <p className="text-[11px] text-stone-400">
                      {[row.city, row.country].filter(Boolean).join(', ') || '—'}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-xs text-stone-600">
                    {row.sent_to ? (
                      <code className="rounded bg-stone-100 px-1 py-0.5">{row.sent_to}</code>
                    ) : (
                      <span className="text-stone-400">Not recorded</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-stone-600">
                    {formatDateTime(row.issued_at)}
                    {row.issued_by_name ? (
                      <p className="mt-0.5 text-[10px] text-stone-400">by {row.issued_by_name}</p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-xs text-stone-600">
                    {row.opened_at ? (
                      <>
                        {formatDateTime(row.opened_at)}
                        {row.likely_admin_preview ? (
                          <p className="mt-0.5 text-[10px] font-medium text-amber-700">
                            Likely admin test
                          </p>
                        ) : null}
                      </>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-stone-600">
                    {formatDateTime(row.claimed_at)}
                  </td>
                  <td className="px-4 py-3 sm:px-5">
                    <span
                      className={cn(
                        'inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset',
                        statusClass(row.status),
                      )}
                    >
                      {statusLabel(row.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

export function AnalyticsClaimLinks({
  data,
  loading,
}: {
  data: ClaimLinkAnalyticsPayload | null | undefined
  loading?: boolean
}) {
  const pipeline = data?.pipeline
  const funnel = data?.funnel

  return (
    <div className="space-y-6">
      {!loading && data && !data.health.tokens ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm text-amber-950">
          Claim token table is missing. Apply migrations{' '}
          <code className="rounded bg-amber-100/80 px-1 text-xs">044_gym_claim_tokens</code> and{' '}
          <code className="rounded bg-amber-100/80 px-1 text-xs">20260626200000</code>.
        </div>
      ) : null}

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <AnalyticsKpiCard
          label="Links issued"
          value={(funnel?.issued.current ?? 0).toLocaleString()}
          deltaPct={data ? pctDelta(funnel!.issued.current, funnel!.issued.previous) : null}
          sparkline={data?.daily.issued}
          loading={loading}
        />
        <AnalyticsKpiCard
          label="Owner open rate"
          value={(funnel?.ownerOpenRate.current ?? 0).toFixed(1)}
          valueSuffix="%"
          deltaPct={
            data ? pctDelta(funnel!.ownerOpenRate.current, funnel!.ownerOpenRate.previous) : null
          }
          loading={loading}
        />
        <AnalyticsKpiCard
          label="Claim rate"
          value={(funnel?.claimRate.current ?? 0).toFixed(1)}
          valueSuffix="%"
          deltaPct={data ? pctDelta(funnel!.claimRate.current, funnel!.claimRate.previous) : null}
          loading={loading}
        />
        <AnalyticsKpiCard
          label="Opened, pending"
          value={(pipeline?.openedAwaitingClaim ?? 0).toLocaleString()}
          deltaPct={null}
          loading={loading}
        />
      </section>

      <RateComparison
        ownerOpenRate={funnel?.ownerOpenRate ?? { current: 0, previous: 0 }}
        openRate={funnel?.openRate ?? { current: 0, previous: 0 }}
        claimRate={funnel?.claimRate ?? { current: 0, previous: 0 }}
        completionFromOpen={funnel?.completionFromOpen ?? { current: 0, previous: 0 }}
        likelyAdminPreviews={funnel?.likelyAdminPreviews.current ?? 0}
        loading={loading}
      />

      <FunnelRosterTable rows={data?.roster ?? []} loading={loading} />

      <ClaimFunnelBar
        issued={funnel?.issued.current ?? 0}
        opened={funnel?.opened.current ?? 0}
        openedExclPreview={funnel?.openedExclPreview.current ?? 0}
        claimed={funnel?.claimed.current ?? 0}
        loading={loading}
      />

      <ClaimMultiSeriesChart
        labels={data?.daily.labels ?? []}
        series={{
          issued: data?.daily.issued ?? [],
          opened: data?.daily.opened ?? [],
          claimed: data?.daily.claimed ?? [],
        }}
        loading={loading}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-stone-200 bg-white p-4 sm:p-5">
          <h3 className="text-sm font-semibold text-stone-900">Live pipeline</h3>
          <p className="mt-0.5 text-xs text-stone-500">All outstanding claim links right now</p>
          <ul className="mt-4 grid grid-cols-2 gap-3">
            {[
              { label: 'Active, not opened', value: pipeline?.active ?? 0, tone: 'text-emerald-700' },
              {
                label: 'Opened, not completed',
                value: pipeline?.openedAwaitingClaim ?? 0,
                tone: 'text-sky-700',
              },
              { label: 'Expired', value: pipeline?.expired ?? 0, tone: 'text-amber-800' },
              { label: 'Revoked', value: pipeline?.revoked ?? 0, tone: 'text-stone-600' },
            ].map((item) => (
              <li
                key={item.label}
                className="rounded-lg border border-stone-100 bg-stone-50/80 px-3 py-3"
              >
                <p className="text-[11px] font-medium text-stone-500">{item.label}</p>
                <p className={cn('mt-1 text-xl font-semibold tabular-nums', item.tone)}>
                  {loading ? '—' : item.value.toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        </div>

        <div className="overflow-hidden rounded-xl border border-stone-200 bg-white">
          <div className="border-b border-stone-100 px-4 py-3 sm:px-5">
            <h3 className="text-sm font-semibold text-stone-900">In-progress gyms</h3>
            <p className="mt-0.5 text-xs text-stone-500">Outstanding claims with open timestamps</p>
          </div>
          <div className="max-h-[280px] overflow-y-auto">
            {loading ? (
              <p className="px-5 py-8 text-center text-sm text-stone-500">Loading…</p>
            ) : !data?.recent.length ? (
              <p className="px-5 py-8 text-center text-sm text-stone-500">
                No outstanding claim links — all caught up.
              </p>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-white text-[11px] font-semibold uppercase tracking-wider text-stone-500">
                  <tr className="border-b border-stone-100">
                    <th className="px-4 py-2 font-semibold sm:px-5">Gym</th>
                    <th className="hidden px-4 py-2 font-semibold sm:table-cell">Issued</th>
                    <th className="hidden px-4 py-2 font-semibold md:table-cell">Opened</th>
                    <th className="px-4 py-2 font-semibold sm:px-5">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recent.map((row) => (
                    <tr key={row.gym_id} className="border-b border-stone-50 last:border-0">
                      <td className="px-4 py-3 sm:px-5">
                        <Link
                          href={`/admin/orphan-gyms?gym_id=${encodeURIComponent(row.gym_id)}`}
                          className="font-medium text-stone-900 hover:text-[#003580] hover:underline"
                        >
                          {row.gym_name}
                        </Link>
                      </td>
                      <td className="hidden px-4 py-3 text-xs text-stone-600 sm:table-cell">
                        {formatDateTime(row.token_created_at)}
                      </td>
                      <td className="hidden px-4 py-3 text-xs text-stone-600 md:table-cell">
                        {row.first_clicked_at ? (
                          <>
                            {formatDateTime(row.first_clicked_at)}
                            {row.likely_admin_preview ? (
                              <span className="ml-1 text-[10px] text-amber-700">(test?)</span>
                            ) : null}
                          </>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-4 py-3 sm:px-5">
                        <span
                          className={cn(
                            'inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset',
                            statusClass(row.status),
                          )}
                        >
                          {statusLabel(row.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
