'use client'

import { useCallback, useState } from 'react'
import Link from 'next/link'
import { ExternalLink } from 'lucide-react'
import type { ClaimLinkAnalyticsPayload, ClaimLinkRosterRow } from '@/lib/admin/fetch-claim-link-analytics'
import {
  getCachedClaimLinkUrl,
  saveClaimLinkToBrowserCache,
} from '@/lib/admin/claim-link-browser-cache'
import {
  platformStageFunnelLabel,
  platformStageTableClass,
  type PlatformStage,
} from '@/lib/admin/platform-stage'
import { CopyClipboardButton } from '@/components/admin/copy-clipboard-button'
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

function StatusBadge({ stage, label }: { stage: PlatformStage; label: string }) {
  return (
    <span
      className={cn(
        'inline-block max-w-[9.5rem] rounded-md border px-2 py-1 text-[11px] font-medium leading-snug',
        platformStageTableClass(stage),
      )}
    >
      {label}
    </span>
  )
}

function RosterActions({
  row,
  onLinkCached,
  onRefresh,
}: {
  row: ClaimLinkRosterRow
  onLinkCached: () => void
  onRefresh?: () => void
}) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const cachedUrl = getCachedClaimLinkUrl(row.gym_id, row.token_id)

  const issueAndCopy = useCallback(async () => {
    setError(null)
    if (
      row.claim_url_active &&
      !cachedUrl &&
      !confirm(
        'Issue a new claim link? This revokes the current URL — only do this if the owner never received the old one.',
      )
    ) {
      return
    }

    setBusy(true)
    try {
      const res = await fetch(`/api/admin/gyms/${row.gym_id}/claim-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expires_in_days: 14 }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data?.url) {
        throw new Error(data?.error || 'Failed to get claim link')
      }
      if (data.token_id) {
        saveClaimLinkToBrowserCache({
          gymId: row.gym_id,
          tokenId: data.token_id,
          url: data.url,
          savedAt: new Date().toISOString(),
        })
      }
      await navigator.clipboard.writeText(data.url)
      onLinkCached()
      onRefresh?.()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to get link')
    } finally {
      setBusy(false)
    }
  }, [cachedUrl, onLinkCached, onRefresh, row.claim_url_active, row.gym_id])

  return (
    <div className="flex flex-col items-start gap-1.5">
      <div className="flex flex-wrap gap-1">
        <CopyClipboardButton value={row.gym_id} label="Gym ID" size="xs" />
        {cachedUrl ? (
          <CopyClipboardButton value={cachedUrl} label="Claim link" size="xs" />
        ) : row.claim_url_active ? (
          <button
            type="button"
            disabled={busy}
            onClick={issueAndCopy}
            className="inline-flex items-center gap-1 rounded-md border border-[#003580]/30 bg-[#003580]/5 px-2 py-1 text-[10px] font-medium text-[#003580] hover:bg-[#003580]/10 disabled:opacity-50"
          >
            {busy ? 'Working…' : 'Get link'}
          </button>
        ) : null}
      </div>
      {!cachedUrl && row.claim_url_active ? (
        <p className="max-w-[11rem] text-[10px] leading-snug text-stone-400">
          Link not in this browser — get link once, then copy anytime.
        </p>
      ) : null}
      {error ? <p className="max-w-[11rem] text-[10px] text-rose-600">{error}</p> : null}
    </div>
  )
}

export function AnalyticsClaimLinks({
  data,
  loading,
  onRefresh,
}: {
  data: ClaimLinkAnalyticsPayload | null | undefined
  loading?: boolean
  onRefresh?: () => void
}) {
  const [cacheVersion, setCacheVersion] = useState(0)
  const summary = data?.summary
  const roster = data?.roster ?? []

  const clickRate = summary?.clickRate ?? 0
  const claimRate = summary?.claimRate ?? 0
  const onboardedRate = summary?.onboardedRate ?? 0
  const ownerClicks = summary?.ownerClicks ?? 0
  const claimed = (summary?.claimed ?? 0) + (summary?.onboarded ?? 0)
  const onboarded = summary?.onboarded ?? 0
  const total = summary?.total ?? 0
  const adminClicks = summary?.adminClicks ?? 0

  const bumpCache = useCallback(() => setCacheVersion((v) => v + 1), [])
  void cacheVersion

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
            Status labels match the outreach sheet. Copy <strong className="font-medium text-stone-600">Gym ID</strong> into
            column K; copy <strong className="font-medium text-stone-600">Claim link</strong> into column L after
            generating (links are cached in this browser only).
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

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <HeroStat
          label="Links issued"
          value={loading ? '—' : String(total)}
          hint="Total claim tokens created"
        />
        <HeroStat
          label="Click rate"
          value={loading ? '—' : `${clickRate.toFixed(1)}%`}
          hint={
            loading
              ? undefined
              : `${ownerClicks} owner opens${adminClicks ? ` · ${adminClicks} admin tests` : ''}`
          }
        />
        <HeroStat
          label="Claim rate"
          value={loading ? '—' : `${claimRate.toFixed(1)}%`}
          hint={loading ? undefined : `${claimed} passwords set`}
        />
        <HeroStat
          label="Onboarded rate"
          value={loading ? '—' : `${onboardedRate.toFixed(1)}%`}
          hint={loading ? undefined : `${onboarded} with Stripe connected`}
        />
      </div>

      <div>
        <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-stone-400">
          Funnel breakdown
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
          <FunnelStat
            label={platformStageFunnelLabel('link_ready')}
            value={loading ? '—' : String(summary?.linkReady ?? 0)}
          />
          <FunnelStat
            label={platformStageFunnelLabel('link_sent')}
            value={loading ? '—' : String(summary?.linkSent ?? 0)}
          />
          <FunnelStat
            label={platformStageFunnelLabel('clicked')}
            value={loading ? '—' : String(summary?.clicked ?? 0)}
          />
          <FunnelStat
            label={platformStageFunnelLabel('claimed')}
            value={loading ? '—' : String(summary?.claimed ?? 0)}
          />
          <FunnelStat label={platformStageFunnelLabel('onboarded')} value={loading ? '—' : String(onboarded)} />
          <FunnelStat label={platformStageFunnelLabel('expired')} value={loading ? '—' : String(summary?.expired ?? 0)} />
          <FunnelStat label={platformStageFunnelLabel('revoked')} value={loading ? '—' : String(summary?.revoked ?? 0)} />
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
            <table className="w-full min-w-[1100px] text-left text-sm">
              <thead className="sticky top-0 z-10 bg-white text-[11px] font-semibold uppercase tracking-wider text-stone-500 shadow-[0_1px_0_0_rgb(245_245_244)]">
                <tr>
                  <th className="px-4 py-3 font-semibold sm:px-5">Gym</th>
                  <th className="px-4 py-3 font-semibold">Copy for sheet</th>
                  <th className="px-4 py-3 font-semibold">Issued</th>
                  <th className="px-4 py-3 font-semibold">Owner opened</th>
                  <th className="px-4 py-3 font-semibold">Outreach sent</th>
                  <th className="px-4 py-3 font-semibold">Password</th>
                  <th className="px-4 py-3 font-semibold">Stripe</th>
                  <th className="w-[8.5rem] px-4 py-3 font-semibold sm:px-5">Sheet status</th>
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
                      {row.sent_to ? (
                        <p className="mt-0.5 text-[10px] text-stone-400">
                          {row.sent_to_is_placeholder ? 'Placeholder' : 'Sent to'}:{' '}
                          <code className="rounded bg-stone-100 px-0.5">{row.sent_to}</code>
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <RosterActions row={row} onLinkCached={bumpCache} onRefresh={onRefresh} />
                    </td>
                    <td className="px-4 py-3 text-xs text-stone-600">
                      {formatDateTime(row.issued_at)}
                      {row.issued_by_name ? (
                        <p className="mt-0.5 text-[10px] text-stone-400">by {row.issued_by_name}</p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-xs text-stone-600">
                      {formatDateTime(row.owner_opened_at)}
                      {row.first_opened_at && row.first_opened_by === 'admin' && !row.owner_opened_at ? (
                        <p className="mt-0.5 text-[10px] text-stone-400">Admin test only</p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-xs text-stone-600">
                      {formatDateTime(row.outreach_sent_at)}
                    </td>
                    <td className="px-4 py-3 text-xs text-stone-700">{yesNo(row.password_set)}</td>
                    <td className="px-4 py-3 text-xs text-stone-700">
                      {yesNo(row.stripe_connected)}
                    </td>
                    <td className="px-4 py-3 sm:px-5">
                      <StatusBadge stage={row.stage} label={row.stage_label} />
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
