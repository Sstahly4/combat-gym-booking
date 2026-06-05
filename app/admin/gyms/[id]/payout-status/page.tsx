/**
 * Admin → Payout status for a single gym.
 *
 * Read-only. Shows Stripe verification state, currently-due steps, last sync
 * timestamp, and pending captured earnings. No bank account details are shown
 * or accessible — Stripe Dashboard is the right place for those.
 *
 * Access is admin-gated (checked server-side). Every page view is audit-logged.
 */
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Clock,
  CircleDollarSign,
  ShieldCheck,
  Banknote,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getRequirementLabel, getRequirementLabels } from '@/lib/manage/stripe-requirements-labels'
import { computePendingCapturedEarnings } from '@/lib/manage/pending-captured-earnings'
import { AdminGymStripeSync } from '@/components/admin/admin-gym-stripe-sync'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: { id: string }
}): Promise<Metadata> {
  return { title: `Payout status · ${params.id.slice(0, 8)} | Admin` }
}

function relativeTime(iso: string | null): string {
  if (!iso) return 'Never'
  try {
    const diffMs = Date.now() - new Date(iso).getTime()
    const mins = Math.floor(diffMs / 60_000)
    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    const days = Math.floor(hrs / 24)
    return `${days}d ago`
  } catch {
    return iso
  }
}

function absoluteTime(iso: string | null): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString('en-GB', {
      dateStyle: 'short',
      timeStyle: 'short',
    })
  } catch {
    return iso
  }
}

function formatCurrency(amount: number, currency: string | null): string {
  const cur = (currency || 'USD').toUpperCase()
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: cur,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  } catch {
    return `${cur} ${amount.toFixed(0)}`
  }
}

export default async function AdminGymPayoutStatusPage({
  params,
}: {
  params: { id: string }
}) {
  // — Auth check (server-side) ————————————————————————————————————————————
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'admin') redirect('/')

  // — Fetch gym ——————————————————————————————————————————————————————————
  const admin = createAdminClient()
  const { data: gym, error: gymErr } = await admin
    .from('gyms')
    .select(
      `id, name, city, country, currency, payout_rail,
       stripe_account_id, stripe_connect_verified,
       stripe_charges_enabled, stripe_payouts_enabled, stripe_details_submitted,
       stripe_disabled_reason,
       stripe_requirements_currently_due, stripe_requirements_pending_verification,
       last_stripe_account_sync_at, owner_id`
    )
    .eq('id', params.id)
    .maybeSingle()

  if (gymErr || !gym) redirect('/admin/gyms')

  // — Fetch bookings for pending earnings ————————————————————————————————
  const { data: bookings } = await admin
    .from('bookings')
    .select('gym_id, status, total_price, platform_fee, payment_captured_at')
    .eq('gym_id', params.id)
    .in('status', ['paid', 'confirmed', 'completed'])
    .not('payment_captured_at', 'is', null)

  const pendingEarnings = gym.stripe_connect_verified
    ? 0
    : computePendingCapturedEarnings(bookings ?? [], params.id)

  // — Audit log (durable DB write) ——————————————————————————————————————
  // Uses service-role client to bypass RLS — the INSERT policy only allows
  // the admin SDK, never a user session. Fire-and-forget; don't block render.
  admin
    .from('admin_audit_log')
    .insert({
      event: 'admin_viewed_payout_status',
      admin_user_id: user.id,
      gym_id: params.id,
      metadata: { gym_name: gym.name },
    })
    .then(({ error }) => {
      if (error) {
        console.error('[audit] failed to write admin_audit_log', error.message)
      }
    })

  // — Derived data ——————————————————————————————————————————————————————
  const currentlyDue = (gym.stripe_requirements_currently_due as string[] | null) ?? []
  const pendingVerification =
    (gym.stripe_requirements_pending_verification as string[] | null) ?? []
  const humanStepsEn = getRequirementLabels(currentlyDue, 'en')
  const humanStepsTh = getRequirementLabels(currentlyDue, 'th')
  const verified = Boolean(gym.stripe_connect_verified)
  const hasStripeAccount = Boolean(gym.stripe_account_id)

  // — Pill helpers ———————————————————————————————————————————————————————
  const verifiedPill = verified
    ? { label: 'Verified', cls: 'bg-emerald-100 text-emerald-800', icon: CheckCircle2 }
    : { label: 'Not verified', cls: 'bg-amber-100 text-amber-800', icon: AlertCircle }

  const chargesPill = gym.stripe_charges_enabled
    ? { label: 'Charges on', cls: 'bg-emerald-50 text-emerald-700' }
    : { label: 'Charges off', cls: 'bg-rose-50 text-rose-700' }

  const payoutsPill = gym.stripe_payouts_enabled
    ? { label: 'Payouts on', cls: 'bg-emerald-50 text-emerald-700' }
    : { label: 'Payouts off', cls: 'bg-rose-50 text-rose-700' }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-stone-500">
        <Link
          href="/admin/gyms"
          className="inline-flex items-center gap-1 rounded-md px-1 py-0.5 hover:text-stone-800"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          All gyms
        </Link>
        <span aria-hidden>/</span>
        <span className="truncate max-w-[12rem] text-stone-800">{gym.name}</span>
        <span aria-hidden>/</span>
        <span className="text-stone-800">Payout status</span>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">
          Admin · Read-only
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-stone-900">{gym.name}</h1>
        <p className="mt-0.5 text-sm text-stone-500">
          {gym.city}, {gym.country}
        </p>
      </div>

      <div className="space-y-6">
        {/* ── Stripe connection status ──────────────────────────────────── */}
        <section className="rounded-xl border border-stone-200 bg-white">
          <header className="border-b border-stone-100 px-5 py-4">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-stone-900">
              <ShieldCheck className="h-4 w-4 text-stone-400" aria-hidden />
              Stripe account status
            </h2>
          </header>
          <div className="px-5 py-4 space-y-4">
            {!hasStripeAccount ? (
              <p className="text-sm text-stone-500">
                No Stripe account linked. The partner has not started payout setup.
              </p>
            ) : (
              <>
                {/* Status pills */}
                <div className="flex flex-wrap gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${
                      verified
                        ? 'bg-emerald-50 text-emerald-800 ring-emerald-200/60'
                        : 'bg-amber-50 text-amber-800 ring-amber-200/60'
                    }`}
                  >
                    {verified ? (
                      <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                    ) : (
                      <AlertCircle className="h-3.5 w-3.5" aria-hidden />
                    )}
                    {verifiedPill.label}
                  </span>
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset ${chargesPill.cls} ring-current/20`}
                  >
                    {chargesPill.label}
                  </span>
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset ${payoutsPill.cls} ring-current/20`}
                  >
                    {payoutsPill.label}
                  </span>
                  {gym.stripe_details_submitted ? (
                    <span className="inline-flex items-center rounded-full bg-stone-50 px-3 py-1 text-xs font-medium text-stone-600 ring-1 ring-inset ring-stone-200/60">
                      Details submitted
                    </span>
                  ) : null}
                </div>

                {/* Disabled reason */}
                {gym.stripe_disabled_reason ? (
                  <div className="rounded-lg bg-rose-50 px-4 py-3 text-sm">
                    <p className="font-medium text-rose-800">Disabled reason</p>
                    <p className="mt-0.5 font-mono text-xs text-rose-700">
                      {gym.stripe_disabled_reason}
                    </p>
                  </div>
                ) : null}

                {/* Stripe account ID */}
                <p className="text-[11px] text-stone-400">
                  Account:{' '}
                  <span className="font-mono">{gym.stripe_account_id}</span>
                </p>
              </>
            )}
          </div>
        </section>

        {/* ── Currently due steps ───────────────────────────────────────── */}
        {hasStripeAccount ? (
          <section className="rounded-xl border border-stone-200 bg-white">
            <header className="border-b border-stone-100 px-5 py-4">
              <h2 className="text-sm font-semibold text-stone-900">
                Outstanding requirements
              </h2>
              <p className="mt-0.5 text-xs text-stone-500">
                From{' '}
                <code className="rounded bg-stone-100 px-1 py-0.5 text-[10px]">
                  stripe_requirements_currently_due
                </code>
                {' '}— what the partner needs to complete
              </p>
            </header>
            <div className="px-5 py-4">
              {currentlyDue.length === 0 ? (
                <p className="text-sm text-stone-500">
                  {verified
                    ? 'No outstanding requirements — account is fully verified.'
                    : 'No currently_due items. Run Sync Stripe below to refresh, or the partner may need to re-enter the Stripe flow to trigger new requirements.'}
                </p>
              ) : (
                <div className="space-y-3">
                  {/* Human-readable steps */}
                  <div className="space-y-1.5">
                    {humanStepsEn.map((step, i) => (
                      <div
                        key={step}
                        className="flex items-start gap-2.5 rounded-lg border border-stone-100 bg-stone-50/60 px-3 py-2.5"
                      >
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-100 text-[11px] font-semibold text-amber-800">
                          {i + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm text-stone-800">{step}</p>
                          <p className="text-[11px] text-stone-400">{humanStepsTh[i]}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Raw keys — for debugging */}
                  <details className="group">
                    <summary className="cursor-pointer text-[11px] font-medium text-stone-400 hover:text-stone-600 list-none flex items-center gap-1">
                      <span className="group-open:rotate-90 transition-transform inline-block">▶</span>
                      Raw keys ({currentlyDue.length})
                    </summary>
                    <div className="mt-2 rounded-lg bg-stone-50 px-3 py-2.5">
                      <ul className="space-y-0.5">
                        {currentlyDue.map((key) => {
                          const label = getRequirementLabel(key)
                          return (
                            <li key={key} className="flex items-baseline gap-2">
                              <code className="text-[10px] font-mono text-stone-500">{key}</code>
                              <span className="text-[10px] text-stone-400">→ {label.en}</span>
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  </details>
                </div>
              )}

              {/* Pending verification */}
              {pendingVerification.length > 0 ? (
                <div className="mt-4 rounded-lg border border-sky-100 bg-sky-50/60 px-4 py-3">
                  <p className="text-xs font-semibold text-sky-800">
                    Pending verification ({pendingVerification.length} item
                    {pendingVerification.length === 1 ? '' : 's'})
                  </p>
                  <p className="mt-0.5 text-[11px] text-sky-700">
                    These are submitted and awaiting Stripe review — no partner action needed.
                  </p>
                  <ul className="mt-2 space-y-0.5">
                    {pendingVerification.map((key) => (
                      <li key={key}>
                        <code className="text-[10px] font-mono text-sky-600">{key}</code>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </section>
        ) : null}

        {/* ── Last sync + sync button ────────────────────────────────────── */}
        <section className="rounded-xl border border-stone-200 bg-white">
          <header className="border-b border-stone-100 px-5 py-4">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-stone-900">
              <Clock className="h-4 w-4 text-stone-400" aria-hidden />
              Sync
            </h2>
          </header>
          <div className="px-5 py-4 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-stone-700">
                  Last synced from Stripe:{' '}
                  <span className="font-medium text-stone-900">
                    {relativeTime(gym.last_stripe_account_sync_at)}
                  </span>
                </p>
                {gym.last_stripe_account_sync_at ? (
                  <p className="text-[11px] text-stone-400">
                    {absoluteTime(gym.last_stripe_account_sync_at)}
                  </p>
                ) : (
                  <p className="text-[11px] text-stone-400">
                    Sync fires on partner onExit or when you click below.
                  </p>
                )}
              </div>
            </div>

            {hasStripeAccount ? (
              <AdminGymStripeSync
                gymId={gym.id}
                stripeAccountId={gym.stripe_account_id}
                stripeConnectVerified={gym.stripe_connect_verified ?? null}
                currentlyDue={currentlyDue}
                lastSyncAt={gym.last_stripe_account_sync_at ?? null}
              />
            ) : (
              <p className="text-sm text-stone-400">
                No Stripe account — nothing to sync.
              </p>
            )}
          </div>
        </section>

        {/* ── Pending earnings ──────────────────────────────────────────── */}
        {!verified ? (
          <section className="rounded-xl border border-stone-200 bg-white">
            <header className="border-b border-stone-100 px-5 py-4">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-stone-900">
                <CircleDollarSign className="h-4 w-4 text-stone-400" aria-hidden />
                Pending captured earnings
              </h2>
              <p className="mt-0.5 text-xs text-stone-500">
                Bookings with a captured payment while Stripe is unverified — funds sit on the
                platform account, not in the gym's Stripe balance.
              </p>
            </header>
            <div className="px-5 py-4">
              {pendingEarnings > 0 ? (
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-light tabular-nums text-amber-800">
                    {formatCurrency(pendingEarnings, gym.currency)}
                  </span>
                  <span className="text-xs text-stone-500">
                    net of platform fee · {(bookings ?? []).length} booking
                    {(bookings ?? []).length === 1 ? '' : 's'}
                  </span>
                </div>
              ) : (
                <p className="text-sm text-stone-500">
                  No captured earnings pending — either no completed bookings yet, or payout is verified.
                </p>
              )}
            </div>
          </section>
        ) : null}

        {/* ── Compliance notice ─────────────────────────────────────────── */}
        <div className="rounded-lg border border-stone-100 bg-stone-50/60 px-4 py-3 text-[11px] text-stone-400 leading-relaxed">
          <Banknote className="mb-0.5 inline h-3.5 w-3.5 text-stone-400" aria-hidden />{' '}
          Bank account details, routing numbers, and Stripe financial data are not shown here.
          Use the{' '}
          <a
            href={`https://dashboard.stripe.com/connect/accounts/${gym.stripe_account_id ?? ''}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium underline underline-offset-2 hover:text-stone-700"
          >
            Stripe Dashboard
          </a>{' '}
          for financial details.
        </div>
      </div>
    </main>
  )
}
