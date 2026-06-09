'use client'

import { formatCheckoutPriceWithCode } from '@/components/booking/checkout-ui'

export type PayWhenChoice = 'now' | 'klarna'

function PayWhenRadio({ selected }: { selected: boolean }) {
  return (
    <span
      className={`relative inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 bg-white ${
        selected ? 'border-gray-900' : 'border-gray-300'
      }`}
      aria-hidden
    >
      {selected && <span className="h-3.5 w-3.5 rounded-full bg-gray-900" />}
    </span>
  )
}

export function formatKlarnaInstallmentSummary(totalPrice: number, currency: string): string {
  const installment = totalPrice / 4
  return `4 payments of ${formatCheckoutPriceWithCode(installment, currency)}. Interest-free.`
}

export function formatPayWhenSummaryLine(
  choice: PayWhenChoice,
  totalPrice: number,
  currency: string
): string {
  if (choice === 'klarna') {
    return 'Pay in 4 payments with Klarna'
  }
  return `Pay ${formatCheckoutPriceWithCode(totalPrice, currency)} now`
}

export function PayWhenOptions({
  value,
  onChange,
  totalPrice,
  selectedCurrency,
  hasDates,
  onOpenKlarnaInfo,
}: {
  value: PayWhenChoice
  onChange: (choice: PayWhenChoice) => void
  totalPrice: number | null
  selectedCurrency: string
  hasDates: boolean
  onOpenKlarnaInfo: () => void
}) {
  const showKlarna = totalPrice != null

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
      <label className="flex items-center justify-between gap-4 px-4 py-3.5 cursor-pointer hover:bg-gray-50/80 transition-colors">
        <span className="text-[15px] font-medium text-gray-900">
          {totalPrice != null ? (
            <>Pay {formatCheckoutPriceWithCode(totalPrice, selectedCurrency)} now</>
          ) : hasDates ? (
            'Pay now'
          ) : (
            'Select dates to see price'
          )}
        </span>
        <PayWhenRadio selected={value === 'now'} />
        <input
          type="radio"
          name="pay-when"
          value="now"
          checked={value === 'now'}
          onChange={() => onChange('now')}
          className="sr-only"
          aria-label="Pay now"
        />
      </label>

      {showKlarna && (
        <label className="flex items-start justify-between gap-4 px-4 py-3.5 cursor-pointer hover:bg-gray-50/80 transition-colors">
          <div className="min-w-0 flex-1">
            <div className="text-[15px] font-medium text-gray-900">
              Pay in 4 payments with Klarna
            </div>
            <p className="mt-1 text-sm text-gray-600 leading-snug">
              {formatKlarnaInstallmentSummary(totalPrice, selectedCurrency)}
            </p>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onOpenKlarnaInfo()
              }}
              className="mt-1.5 text-sm text-gray-900 underline font-medium hover:text-gray-700 transition-colors"
            >
              More info
            </button>
          </div>
          <PayWhenRadio selected={value === 'klarna'} />
          <input
            type="radio"
            name="pay-when"
            value="klarna"
            checked={value === 'klarna'}
            onChange={() => onChange('klarna')}
            className="sr-only"
            aria-label="Pay in 4 payments with Klarna"
          />
        </label>
      )}
    </div>
  )
}

export function ChooseWhenToPaySection({
  value,
  onChange,
  totalPrice,
  selectedCurrency,
  hasDates,
  onOpenKlarnaInfo,
}: {
  value: PayWhenChoice
  onChange: (choice: PayWhenChoice) => void
  totalPrice: number | null
  selectedCurrency: string
  hasDates: boolean
  onOpenKlarnaInfo: () => void
}) {
  return (
    <div className="mt-6">
      <h2 className="text-lg font-bold text-gray-900 mb-4">Choose when to pay</h2>
      <PayWhenOptions
        value={value}
        onChange={onChange}
        totalPrice={totalPrice}
        selectedCurrency={selectedCurrency}
        hasDates={hasDates}
        onOpenKlarnaInfo={onOpenKlarnaInfo}
      />
    </div>
  )
}
