import type { ReactNode } from 'react'
import { AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  BOOKING_DATES_EXPIRED_DESCRIPTION,
  BOOKING_DATES_EXPIRED_HEADING,
  BOOKING_DATES_EXPIRED_LISTING_LINK,
} from '@/lib/booking/validate-booking-dates'

/** Primary checkout CTA — card confirm, step 2 continue, etc. */
export const CHECKOUT_PAY_BUTTON_CLASS =
  'w-full h-11 bg-[#003580] hover:bg-[#003580]/90 text-white font-semibold text-base rounded-xl'

/** Match Stripe Express Checkout buttonHeight to CHECKOUT_PAY_BUTTON_CLASS (h-11 = 44px) */
export const CHECKOUT_WALLET_BUTTON_HEIGHT = 44

/** Mobile + desktop checkout step titles (steps 2–3: Your details, Confirm and pay) */
export function CheckoutStepTitle({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <h1 className={cn('text-2xl font-bold leading-tight text-gray-900', className)}>
      {children}
    </h1>
  )
}

export function StepProgressBar({ step }: { step: 1 | 2 | 3 }) {
  return (
    <div className="flex gap-1.5 px-5 pb-1">
      {([1, 2, 3] as const).map((s) => (
        <div
          key={s}
          className="h-1 flex-1 rounded-full transition-colors"
          style={{ backgroundColor: s <= step ? '#003580' : '#e5e7eb' }}
        />
      ))}
    </div>
  )
}

export function CheckoutSummaryFieldError({ children }: { children: ReactNode }) {
  return (
    <div className="mt-1.5 flex items-center gap-1.5 text-sm text-[#c13515]">
      <AlertCircle className="h-4 w-4 shrink-0" strokeWidth={2.25} aria-hidden />
      <span>{children}</span>
    </div>
  )
}

export function CheckoutSummaryRow({
  label,
  value,
  onEdit,
  editLabel = 'Change',
  fieldError,
}: {
  label: string
  value: ReactNode
  onEdit?: () => void
  editLabel?: string
  fieldError?: string
}) {
  return (
    <div className="flex items-start justify-between py-4">
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold text-gray-900 mb-0.5">{label}</div>
        <div className="text-sm text-gray-700">{value}</div>
        {fieldError ? <CheckoutSummaryFieldError>{fieldError}</CheckoutSummaryFieldError> : null}
      </div>
      {onEdit && (
        <button
          type="button"
          onClick={onEdit}
          className="ml-4 inline-flex shrink-0 items-center justify-center rounded-lg bg-gray-100 px-3.5 py-1.5 text-sm font-medium text-gray-900 can-hover:hover:bg-gray-200 active:bg-gray-200 transition-colors touch-manipulation"
        >
          {editLabel}
        </button>
      )}
    </div>
  )
}

export function CheckoutDatesUnavailableAlert({
  onGoToListing,
  className,
}: {
  onGoToListing: () => void
  className?: string
}) {
  return (
    <div className={cn('border border-gray-200 rounded-xl px-4 py-4', className)}>
      <div className="flex gap-3.5">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#c13515]"
          aria-hidden
        >
          <span className="text-[1.35rem] font-semibold leading-none text-white">!</span>
        </div>
        <div className="min-w-0 flex-1 pt-0.5">
          <p className="font-semibold text-[15px] text-gray-900 leading-snug">
            {BOOKING_DATES_EXPIRED_HEADING}
          </p>
          <p className="mt-1 text-sm text-gray-700 leading-snug">
            {BOOKING_DATES_EXPIRED_DESCRIPTION}
          </p>
          <button
            type="button"
            onClick={onGoToListing}
            className="mt-3 text-sm font-medium text-gray-900 underline underline-offset-2 can-hover:hover:text-gray-700"
          >
            {BOOKING_DATES_EXPIRED_LISTING_LINK}
          </button>
        </div>
      </div>
    </div>
  )
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  AUD: 'A$',
  THB: '฿',
  IDR: 'Rp',
  JPY: '¥',
  CNY: '¥',
  SGD: 'S$',
  MYR: 'RM',
  NZD: 'NZ$',
  CAD: 'C$',
  HKD: 'HK$',
  INR: '₹',
  KRW: '₩',
  PHP: '₱',
  VND: '₫',
}

export function formatCheckoutDateRange(from: string, to: string) {
  if (!from || !to) return 'No dates selected'
  const a = new Date(from + 'T00:00:00')
  const b = new Date(to + 'T00:00:00')
  const sameMonth = a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear()
  if (sameMonth) {
    const month = a.toLocaleDateString('en-GB', { month: 'long' })
    return `${a.getDate()}–${b.getDate()} ${month} ${a.getFullYear()}`
  }
  return `${a.getDate()} ${a.toLocaleDateString('en-GB', { month: 'long' })} – ${b.getDate()} ${b.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}`
}

export function formatCheckoutAmountOnly(amount: number, currency: string): string {
  const formatted = amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  const symbol = CURRENCY_SYMBOLS[currency] ?? ''
  return symbol ? `${symbol}${formatted}` : formatted
}

export function formatCheckoutSummaryValue(value: string | null | undefined): string {
  const trimmed = value?.trim()
  return trimmed ? trimmed : '—'
}

export function formatCheckoutPriceWithCode(amount: number, currency: string): string {
  const formatted = amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  const symbol = CURRENCY_SYMBOLS[currency] ?? ''
  return symbol ? `${symbol}${formatted} ${currency}` : `${currency} ${formatted}`
}
