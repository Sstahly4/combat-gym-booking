import type { ReactNode } from 'react'

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

export function CheckoutSummaryRow({
  label,
  value,
  onEdit,
  editLabel = 'Change',
}: {
  label: string
  value: ReactNode
  onEdit?: () => void
  editLabel?: string
}) {
  return (
    <div className="flex items-start justify-between py-4">
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold text-gray-900 mb-0.5">{label}</div>
        <div className="text-sm text-gray-700">{value}</div>
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

export function formatCheckoutPriceWithCode(amount: number, currency: string): string {
  const formatted = amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  const symbol = CURRENCY_SYMBOLS[currency] ?? ''
  return symbol ? `${symbol}${formatted} ${currency}` : `${currency} ${formatted}`
}
