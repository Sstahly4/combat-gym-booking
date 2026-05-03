import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'

export type PayoutsHoldBannerProps = {
  active: boolean
  reason: string | null
  setAt: string | null
  /** Full-width strip on Balances; tighter block inside settings cards */
  variant?: 'balances' | 'settings'
  className?: string
}

const BRAND = '#003580'

function formatWhen(iso: string | null): string {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  } catch {
    return iso
  }
}

export function PayoutsHoldBanner({
  active,
  reason,
  setAt,
  variant = 'balances',
  className = '',
}: PayoutsHoldBannerProps) {
  if (!active) return null

  const when = formatWhen(setAt)
  const detail = reason?.trim() || 'Your payout bank details were recently updated.'

  if (variant === 'settings') {
    return (
      <div
        role="status"
        className={`flex gap-3 rounded-lg border border-amber-200 bg-amber-50/90 p-3 text-left ${className}`}
      >
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" strokeWidth={2} aria-hidden />
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-semibold text-amber-950">Payouts on hold</p>
          <p className="text-xs text-amber-900/90">{detail}</p>
          {when ? <p className="text-[11px] text-amber-800/80">Since {when}</p> : null}
          <p className="text-xs text-amber-900/90">
            Payouts may pause until bank details are verified. Check{' '}
            <Link href="/manage/balances/payouts" className="font-medium underline underline-offset-2" style={{ color: BRAND }}>
              Payouts
            </Link>{' '}
            or{' '}
            <Link href="/manage/balances" className="font-medium underline underline-offset-2" style={{ color: BRAND }}>
              Balances
            </Link>
            .
          </p>
        </div>
      </div>
    )
  }

  return (
    <div
      role="status"
      className={`flex flex-col gap-3 rounded-xl border border-amber-200/90 bg-gradient-to-r from-amber-50 to-amber-50/40 px-4 py-3 sm:flex-row sm:items-start sm:justify-between ${className}`}
    >
      <div className="flex gap-3 min-w-0">
        <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100/80 ring-1 ring-amber-200/80">
          <AlertTriangle className="h-4 w-4 text-amber-800" strokeWidth={2} aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-amber-950">Payouts on hold</p>
          <p className="mt-0.5 text-sm text-amber-900/95">{detail}</p>
          {when ? (
            <p className="mt-1 text-xs text-amber-800/85">Flagged {when}. We may have emailed you if payout alerts are on.</p>
          ) : null}
        </div>
      </div>
      <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
        <Link
          href="/manage/balances/payouts"
          className="inline-flex h-8 items-center rounded-md border border-amber-300/80 bg-white px-3 text-xs font-medium text-amber-950 shadow-sm hover:bg-amber-50"
        >
          Review payouts
        </Link>
        <Link
          href="/manage/settings?tab=payouts"
          className="inline-flex h-8 items-center rounded-md px-3 text-xs font-medium text-[#003580] underline-offset-2 hover:underline"
          style={{ color: BRAND }}
        >
          Payout settings
        </Link>
      </div>
    </div>
  )
}
