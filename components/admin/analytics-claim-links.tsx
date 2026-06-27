'use client'

import Link from 'next/link'
import { ExternalLink } from 'lucide-react'
import type { ClaimLinkAnalyticsPayload } from '@/lib/admin/fetch-claim-link-analytics'
import {
  claimLinkStageShortLabel,
  claimLinkStageTableClass,
  type ClaimLinkStage,
} from '@/lib/admin/claim-link-stage'
import { cn } from '@/lib/utils'

function formatDateTime(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function yesNo(value: boolean): string {
  return value ? 'Yes' : 'No'
}

function openedByLabel(openedBy: 'admin' | 'owner' | null): string {
  if (openedBy === 'admin') return 'Admin account'
  if (openedBy === 'owner') return 'Owner / logged out'
  return 'Unknown'
}

function HeroStat({
  label,
  value,
  hint,
}: {
  label: string
  value: string
  hint?: string
}) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white px-5 py-4">
      <p className="text-[11px] font-medium uppercase tracking-wider text-stone-500">{label}</p>
      <p className="mt-1 text-3xl font-semibold tabular-nums text-stone-900">{value}</p>
      {hint ? <p className="mt-1.5 text-xs leading-snug text-stone-500">{hint}</p> : null}
    </div>
  )
}

function FunnelStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-stone-100 bg-stone-50/80 px-3 py-2">
      <p className="text-[10px] font-medium uppercase tracking-wider text-stone-400">{label}</p>
      <p className="mt-0.5 text-lg font-semibold tabular-nums text-stone-800">{value}</p>
    </div>
  )
}

function StatusBadge({ stage }: { stage: ClaimLinkStage }) {
  return (
    <span
      className={cn(
        'inline-block whitespace-nowrap rounded-md border px-2 py-1 text-[11px] font-medium leading-none',
        claimLinkStageTableClass(stage),
      )}
    >
      {claimLinkStageShortLabel(stage)}
    </span>
  )
}

export function AnalyticsClaimLinks({
  data,
  loading,
}: {
  data: ClaimLinkAnalyticsPayload | null | undefined
  loading?: boolean
}) {
  const summary = data?.summary
  const roster = data?.roster ?? []

  const clickRate = summary?.clickRate ?? 0
  const claimRate = summary?.claimRate ?? 0
  const ownerClicks = summary?.ownerClicks ?? 0
  const onboarded = summary?.onboarded ?? 0
  const total = summary?.total ?? 0
  const adminClicks = summary?.adminClicks ?? 0

  return (
    <div className="space-y-5">
      {!loading && data && !data.health.tokens ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm text-amber-950">
          Claim token table is missing. Apply migration{' '}
          <code className="rounded bg-amber-100/80 px-1 text-xs">044_gym_claim_tokens</code>.
        </div>
      ) : null}

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-stone-900">Claim link roster</h2>
          <p className="mt-0.5 max-w-2xl text-xs text-stone-500">
            <strong className="font-medium text-stone-600">Links issued</strong> is every claim link
            ever created. <strong className="font-medium text-stone-600">Click rate</strong> is owner
            opens (admin test clicks excluded).{' '}
            <strong className="font-medium text-stone-600">Claim rate</strong> is fully onboarded
            (password + Stripe).
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

      <div className="grid gap-3 sm:grid-cols-3">
        <HeroStat
          label="Links issued"
          value={loading ? '—' : String(total)}
          hint="Total claim links generated"
        />
        <HeroStat
          label="Click rate"
          value={loading ? '—' : `${clickRate.toFixed(1)}%`}
          hint={
            loading
              ? undefined
              : `${ownerClicks} of ${total} opened by owner${adminClicks ? ` · ${adminClicks} admin` : ''}`
          }
        />
        <HeroStat
          label="Claim rate"
          value={loading ? '—' : `${claimRate.toFixed(1)}%`}
          hint={loading ? undefined : `${onboarded} of ${total} fully onboarded`}
        />
      </div>

      <div>
        <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-stone-400">
          Funnel breakdown
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          <FunnelStat label="Not clicked" value={loading ? '—' : String(summary?.notClicked ?? 0)} />
          <FunnelStat
            label="Incomplete"
            value={loading ? '—' : String(summary?.clickedNotComplete ?? 0)}
          />
          <FunnelStat
            label="Password set"
            value={loading ? '—' : String(summary?.passwordAdded ?? 0)}
          />
          <FunnelStat label="Onboarded" value={loading ? '—' : String(onboarded)} />
          <FunnelStat label="Expired" value={loading ? '—' : String(summary?.expired ?? 0)} />
          <FunnelStat label="Revoked" value={loading ? '—' : String(summary?.revoked ?? 0)} />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-stone-200 bg-white">
        <div className="max-h-[min(70vh,720px)] overflow-auto">
          {loading ? (
            <p className="px-5 py-12 text-center text-sm text-stone-500">Loading roster…</p>
          ) : roster.length === 0 ? (
            <p className="px-5 py-12 text-center text-sm text-stone-500">
              No claim links issued yet.
            </p>
          ) : (
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="sticky top-0 z-10 bg-white text-[11px] font-semibold uppercase tracking-wider text-stone-500 shadow-[0_1px_0_0_rgb(245_245_244)]">
                <tr>
                  <th className="px-4 py-3 font-semibold sm:px-5">Gym</th>
                  <th className="px-4 py-3 font-semibold">Sent to</th>
                  <th className="px-4 py-3 font-semibold">Issued</th>
                  <th className="px-4 py-3 font-semibold">Opened</th>
                  <th className="px-4 py-3 font-semibold">Opened by</th>
                  <th className="px-4 py-3 font-semibold">Password</th>
                  <th className="px-4 py-3 font-semibold">Stripe</th>
                  <th className="w-[7.5rem] px-4 py-3 font-semibold sm:px-5">Status</th>
                </tr>
              </thead>
              <tbody>
                {roster.map((row) => (
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
                        <>
                          <code className="rounded bg-stone-100 px-1 py-0.5">{row.sent_to}</code>
                          {row.sent_to_is_placeholder ? (
                            <p className="mt-0.5 text-[10px] text-stone-400">Placeholder account</p>
                          ) : null}
                        </>
                      ) : (
                        <span className="text-stone-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-stone-600">
                      {formatDateTime(row.issued_at)}
                      {row.issued_by_name ? (
                        <p className="mt-0.5 text-[10px] text-stone-400">by {row.issued_by_name}</p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-xs text-stone-600">
                      {formatDateTime(row.opened_at)}
                    </td>
                    <td className="px-4 py-3 text-xs text-stone-700">
                      {openedByLabel(row.opened_by)}
                    </td>
                    <td className="px-4 py-3 text-xs text-stone-700">{yesNo(row.password_set)}</td>
                    <td className="px-4 py-3 text-xs text-stone-700">
                      {yesNo(row.stripe_connected)}
                    </td>
                    <td className="px-4 py-3 sm:px-5">
                      <StatusBadge stage={row.stage} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
