'use client'

import { useState } from 'react'
import { RefreshCw, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react'
import { StripePayoutRecoveryCard } from '@/components/manage/stripe-payout-recovery-card'

type SyncResult = {
  verified: boolean
  currently_due: string[]
  synced_at: string
}

type SyncState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; result: SyncResult }
  | { status: 'error'; message: string }

type Props = {
  gymId: string
  stripeAccountId: string | null
  /** Current value from DB — used for the initial status pill. */
  stripeConnectVerified: boolean | null
  /** stripe_requirements_currently_due from DB — populated after first sync. */
  currentlyDue?: string[] | null
  /** last_stripe_account_sync_at from DB. */
  lastSyncAt?: string | null
}

function formatSyncTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: 'short',
      timeStyle: 'short',
    })
  } catch {
    return iso
  }
}

export function AdminGymStripeSync({
  gymId,
  stripeAccountId,
  stripeConnectVerified,
  currentlyDue: initialCurrentlyDue,
  lastSyncAt: initialLastSyncAt,
}: Props) {
  const [state, setState] = useState<SyncState>({ status: 'idle' })
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewLang, setPreviewLang] = useState<'en' | 'th'>('th')

  if (!stripeAccountId) return null

  const verified =
    state.status === 'success' ? state.result.verified : stripeConnectVerified

  async function handleSync() {
    setState({ status: 'loading' })
    try {
      const res = await fetch(
        `/api/admin/gyms/${encodeURIComponent(gymId)}/sync-stripe-requirements`,
        { method: 'POST' },
      )
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setState({ status: 'error', message: data.error || `HTTP ${res.status}` })
        return
      }
      setState({
        status: 'success',
        result: {
          verified: Boolean(data.verified),
          currently_due: Array.isArray(data.currently_due) ? data.currently_due : [],
          synced_at: data.synced_at ?? new Date().toISOString(),
        },
      })
    } catch (err: any) {
      setState({ status: 'error', message: err?.message || 'Network error' })
    }
  }

  return (
    <div className="w-full space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        {/* Stripe status pill */}
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
            verified
              ? 'bg-emerald-100 text-emerald-800'
              : 'bg-amber-100 text-amber-800'
          }`}
        >
          {verified ? (
            <CheckCircle2 className="h-3 w-3" aria-hidden />
          ) : (
            <AlertCircle className="h-3 w-3" aria-hidden />
          )}
          Stripe {verified ? 'verified' : 'not verified'}
        </span>

        {/* Sync button */}
        <button
          onClick={() => void handleSync()}
          disabled={state.status === 'loading'}
          className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3 py-1 text-[11px] font-medium text-stone-700 transition-colors hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw
            className={`h-3 w-3 ${state.status === 'loading' ? 'animate-spin' : ''}`}
            aria-hidden
          />
          {state.status === 'loading' ? 'Syncing…' : 'Sync Stripe'}
        </button>
      </div>

      {/* Result feedback */}
      {state.status === 'success' && (
        <p className="text-[11px] text-stone-500">
          Synced {formatSyncTime(state.result.synced_at)}{' '}
          {state.result.currently_due.length > 0
            ? `· ${state.result.currently_due.length} step${state.result.currently_due.length === 1 ? '' : 's'} still due`
            : state.result.verified
              ? '· account verified'
              : '· no items in currently_due'}
        </p>
      )}
      {state.status === 'error' && (
        <p className="text-[11px] text-rose-600">{state.message}</p>
      )}

      {/* Preview partner recovery card — uses latest synced data or DB value */}
      {!verified && (() => {
        const previewDue =
          state.status === 'success'
            ? state.result.currently_due
            : (initialCurrentlyDue ?? [])
        const previewSyncAt =
          state.status === 'success'
            ? state.result.synced_at
            : (initialLastSyncAt ?? null)

        if (previewDue.length === 0 && state.status !== 'success') return null

        return (
          <div className="border-t border-stone-100 pt-2">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setPreviewOpen((v) => !v)}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-stone-500 hover:text-stone-800"
              >
                {previewOpen ? (
                  <EyeOff className="h-3 w-3" aria-hidden />
                ) : (
                  <Eye className="h-3 w-3" aria-hidden />
                )}
                {previewOpen ? 'Hide' : 'Preview'} partner view
              </button>
              {previewOpen && (
                <div className="inline-flex rounded-full border border-stone-200 bg-white p-0.5 text-[10px]">
                  {(['th', 'en'] as const).map((l) => (
                    <button
                      key={l}
                      onClick={() => setPreviewLang(l)}
                      className={`rounded-full px-2 py-0.5 transition-colors ${
                        previewLang === l
                          ? 'bg-stone-900 text-white'
                          : 'text-stone-500 hover:text-stone-800'
                      }`}
                    >
                      {l.toUpperCase()}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {previewOpen && (
              <div className="mt-2 rounded-lg border border-stone-200/80 bg-white p-3">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-stone-400">
                  What the partner sees in Settings → Payouts
                </p>
                <StripePayoutRecoveryCard
                  preferredLanguage={previewLang === 'th' ? 'th-TH' : null}
                  currentlyDue={previewDue}
                  lastSyncAt={previewSyncAt}
                />
              </div>
            )}
          </div>
        )
      })()}
    </div>
  )
}
