import Link from 'next/link'
import { Banknote } from 'lucide-react'
import { manageSettingsPayoutsHref } from '@/lib/manage/settings-payouts-href'

export type PendingPayoutEarningsCardProps = {
  gymId: string
  /** Gym-net total (total_price − platform_fee) in the gym's display currency. */
  pendingAmount: number
  currency: string
  /** BCP-47 locale for copy and number formatting. */
  preferredLanguage?: string | null
  className?: string
}

function formatAmount(amount: number, currency: string, lang: string | null | undefined): string {
  try {
    return new Intl.NumberFormat(lang ?? 'en', {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  } catch {
    return `${currency.toUpperCase()} ${Math.round(amount).toLocaleString()}`
  }
}

const COPY = {
  en: {
    heading: (amount: string) => `${amount} in earnings awaiting payout setup`,
    body: 'These bookings have been captured and are tracked on the platform — they are not yet in your Stripe balance. Complete payout setup to receive them.',
    cta: 'Complete payout setup →',
  },
  th: {
    heading: (amount: string) => `คุณมีรายได้ ${amount} จากการจองที่รอการตั้งค่าการรับเงิน`,
    body: 'การจองเหล่านี้ได้รับการบันทึกบนแพลตฟอร์มแล้ว — ยังไม่ได้อยู่ในบัญชี Stripe ของคุณ กรุณาตั้งค่าการรับเงินเพื่อรับเงิน',
    cta: 'ตั้งค่าการรับเงิน →',
  },
} as const

export function PendingPayoutEarningsCard({
  gymId,
  pendingAmount,
  currency,
  preferredLanguage,
  className = '',
}: PendingPayoutEarningsCardProps) {
  if (pendingAmount <= 0) return null

  const isThai = preferredLanguage === 'th-TH'
  const copy = isThai ? COPY.th : COPY.en
  const formatted = formatAmount(pendingAmount, currency, preferredLanguage)
  const href = manageSettingsPayoutsHref(gymId)

  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex flex-col gap-3 rounded-xl border border-amber-200/90 bg-gradient-to-r from-amber-50 to-amber-50/40 px-4 py-4 sm:flex-row sm:items-start sm:justify-between ${className}`}
    >
      <div className="flex min-w-0 gap-3">
        <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100/80 ring-1 ring-amber-200/80">
          <Banknote className="h-4 w-4 text-amber-800" strokeWidth={2} aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-amber-950">{copy.heading(formatted)}</p>
          <p className="mt-1 text-[13px] leading-relaxed text-amber-900/90">{copy.body}</p>
        </div>
      </div>
      <div className="shrink-0 pl-12 sm:pl-0">
        <Link
          href={href}
          className="inline-flex h-9 items-center rounded-md bg-[#003580] px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#002a5c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#003580] focus-visible:ring-offset-2"
        >
          {copy.cta}
        </Link>
      </div>
    </div>
  )
}
