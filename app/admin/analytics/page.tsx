'use client'

import { useCallback, useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  AnalyticsKpiCard,
  AnalyticsPeriodChart,
  AnalyticsRankedTable,
} from '@/components/admin/analytics-charts'
import type { AdminAnalyticsPayload, AnalyticsRange } from '@/lib/admin/fetch-admin-analytics'
import { cn } from '@/lib/utils'

type TabId = 'discovery' | 'catalog'

const RANGE_OPTIONS: { id: AnalyticsRange; label: string }[] = [
  { id: '7d', label: '7 days' },
  { id: '28d', label: '28 days' },
  { id: '90d', label: '90 days' },
]

function pctDelta(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : 100
  return ((current - previous) / previous) * 100
}

function formatSubstitutionKind(kind: string): string {
  switch (kind) {
    case 'city_switch':
      return 'City switch'
    case 'nearby_gym_click':
      return 'Nearby gym click'
    case 'search_gym_click':
      return 'In-city gym click'
    default:
      return kind
  }
}

function CatalogStatusBadge({ status }: { status: 'ok' | 'missing' | 'empty' }) {
  const styles = {
    ok: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
    empty: 'bg-amber-50 text-amber-900 ring-amber-200',
    missing: 'bg-stone-100 text-stone-600 ring-stone-200',
  }
  const labels = { ok: 'Live', empty: 'No events', missing: 'Not deployed' }
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset',
        styles[status],
      )}
    >
      {labels[status]}
    </span>
  )
}

export default function AdminAnalyticsPage() {
  const [range, setRange] = useState<AnalyticsRange>('28d')
  const [tab, setTab] = useState<TabId>('discovery')
  const [data, setData] = useState<AdminAnalyticsPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(
    async (silent = false) => {
      if (silent) setRefreshing(true)
      else setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/admin/analytics?range=${range}`, { cache: 'no-store' })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || 'Failed to load analytics')
        setData(json as AdminAnalyticsPayload)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load analytics')
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [range],
  )

  useEffect(() => {
    void load()
  }, [load])

  const migrationsNeeded =
    data &&
    (!data.health.searchEvents ||
      !data.health.searchDateEvents ||
      !data.health.destinationSubstitutions ||
      !data.health.bookingPriceSnapshots)

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Admin</p>
          <h1 className="mt-1 text-2xl font-semibold text-stone-900">Insights</h1>
          <p className="mt-1 max-w-xl text-sm text-stone-600">
            Search intent, supply gaps, and a live catalog of what we log in Postgres.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-full border border-stone-200 bg-stone-50 p-0.5">
            {RANGE_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setRange(opt.id)}
                className={cn(
                  'rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                  range === opt.id
                    ? 'bg-white text-stone-900 shadow-sm'
                    : 'text-stone-600 hover:text-stone-900',
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void load(true)}
            disabled={refreshing}
            className="rounded-full"
          >
            <RefreshCw className={cn('mr-2 h-4 w-4', refreshing && 'animate-spin')} />
            Refresh
          </Button>
        </div>
      </header>

      {migrationsNeeded ? (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm text-amber-950">
          Some marketplace tables are missing. Apply migrations{' '}
          <code className="rounded bg-amber-100/80 px-1 text-xs">20260622220000</code>,{' '}
          <code className="rounded bg-amber-100/80 px-1 text-xs">20260622230000</code>, and{' '}
          <code className="rounded bg-amber-100/80 px-1 text-xs">20260622230100</code> to start
          collecting discovery data.
        </div>
      ) : null}

      {error ? (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      <section className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <AnalyticsKpiCard
          label="Searches"
          value={(data?.kpis.searches.current ?? 0).toLocaleString()}
          deltaPct={
            data ? pctDelta(data.kpis.searches.current, data.kpis.searches.previous) : null
          }
          sparkline={data?.kpis.searches.daily.values}
          loading={loading}
        />
        <AnalyticsKpiCard
          label="Click-through"
          value={(data?.kpis.ctr.current ?? 0).toFixed(1)}
          valueSuffix="%"
          deltaPct={data ? pctDelta(data.kpis.ctr.current, data.kpis.ctr.previous) : null}
          loading={loading}
        />
        <AnalyticsKpiCard
          label="Bookings"
          value={(data?.kpis.bookings.current ?? 0).toLocaleString()}
          deltaPct={
            data ? pctDelta(data.kpis.bookings.current, data.kpis.bookings.previous) : null
          }
          sparkline={data?.kpis.bookings.daily.values}
          loading={loading}
        />
        <AnalyticsKpiCard
          label="Zero-result rate"
          value={(data?.kpis.zeroResultRate.current ?? 0).toFixed(1)}
          valueSuffix="%"
          deltaPct={
            data
              ? pctDelta(data.kpis.zeroResultRate.current, data.kpis.zeroResultRate.previous)
              : null
          }
          loading={loading}
        />
      </section>

      <div className="mb-6 border-b border-stone-200">
        <nav className="-mb-px flex gap-6" aria-label="Insights sections">
          {(
            [
              { id: 'discovery' as const, label: 'Discovery' },
              { id: 'catalog' as const, label: 'Data catalog' },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={cn(
                'border-b-2 pb-2.5 text-sm font-medium transition-colors',
                tab === item.id
                  ? 'border-[#003580] text-[#003580]'
                  : 'border-transparent text-stone-500 hover:text-stone-800',
              )}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      {tab === 'discovery' ? (
        <div className="space-y-6">
          <AnalyticsPeriodChart
            title="Search volume"
            subtitle="One row per search or filter execution on /search"
            labels={data?.discovery.searchVolume.labels ?? []}
            values={data?.discovery.searchVolume.values ?? []}
          />

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-stone-200 bg-white p-4">
              <p className="text-[11px] font-medium uppercase tracking-wider text-stone-500">
                Result mix
              </p>
              <p className="mt-2 text-2xl font-semibold tabular-nums text-stone-900">
                {loading ? '—' : (data?.discovery.primaryVsNearby.primary ?? 0).toLocaleString()}
              </p>
              <p className="text-xs text-stone-500">In-location results shown</p>
              <p className="mt-3 text-2xl font-semibold tabular-nums text-stone-900">
                {loading ? '—' : (data?.discovery.primaryVsNearby.nearby ?? 0).toLocaleString()}
              </p>
              <p className="text-xs text-stone-500">Nearby results shown</p>
            </div>
            <div className="rounded-xl border border-stone-200 bg-white p-4 sm:col-span-2">
              <p className="text-[11px] font-medium uppercase tracking-wider text-stone-500">
                Gym clicks
              </p>
              <p className="mt-2 text-3xl font-semibold tabular-nums text-stone-900">
                {loading ? '—' : (data?.discovery.clicks ?? 0).toLocaleString()}
              </p>
              <p className="mt-1 text-sm text-stone-600">
                Search sessions where a traveler clicked through to a gym listing.
              </p>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <AnalyticsRankedTable
              title="Top destinations"
              description="Where travelers are searching"
              rows={data?.discovery.topDestinations ?? []}
              emptyMessage="No destination searches in this period yet."
            />
            <AnalyticsRankedTable
              title="Supply gaps"
              description="Searches with zero matching gyms"
              rows={data?.discovery.supplyGaps ?? []}
              emptyMessage="No zero-result searches — good sign for supply coverage."
            />
          </div>

          {data && data.discovery.substitutions.length > 0 ? (
            <AnalyticsRankedTable
              title="Destination substitutions"
              description="City switches and nearby exploration"
              rows={data.discovery.substitutions.map((r) => ({
                ...r,
                label: formatSubstitutionKind(r.label),
              }))}
              emptyMessage=""
            />
          ) : null}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-stone-200 bg-white">
          <div className="border-b border-stone-100 px-4 py-3 sm:px-5">
            <h2 className="text-sm font-semibold text-stone-900">Instrumentation catalog</h2>
            <p className="mt-0.5 text-xs text-stone-500">
              What we capture in Postgres and volume in the last 7 days.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-stone-100 text-[11px] font-semibold uppercase tracking-wider text-stone-500">
                  <th className="px-4 py-3 font-semibold sm:px-5">Event</th>
                  <th className="px-4 py-3 font-semibold">Table</th>
                  <th className="hidden px-4 py-3 font-semibold md:table-cell">When fired</th>
                  <th className="hidden px-4 py-3 font-semibold lg:table-cell">Key fields</th>
                  <th className="px-4 py-3 font-semibold text-right">7d vol</th>
                  <th className="px-4 py-3 font-semibold sm:px-5">Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-stone-500">
                      Loading catalog…
                    </td>
                  </tr>
                ) : (
                  (data?.catalog ?? []).map((row) => (
                    <tr key={row.id} className="border-b border-stone-50 last:border-0">
                      <td className="px-4 py-3 font-medium text-stone-900 sm:px-5">{row.event}</td>
                      <td className="px-4 py-3 font-mono text-xs text-stone-600">{row.table}</td>
                      <td className="hidden px-4 py-3 text-stone-600 md:table-cell">{row.whenFired}</td>
                      <td className="hidden px-4 py-3 text-xs text-stone-500 lg:table-cell">
                        {row.keyFields}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-stone-700">
                        {row.count7d === null ? '—' : row.count7d.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 sm:px-5">
                        <CatalogStatusBadge status={row.status} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </main>
  )
}
