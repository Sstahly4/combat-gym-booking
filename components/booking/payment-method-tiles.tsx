'use client'

import { Check, CreditCard, Plus } from 'lucide-react'
import { ApplePayMark, GooglePayMark } from '@/components/booking/payment-brand-logos'
import type { PaymentMethodChoice } from '@/components/booking/payment-method-picker'

function PaymentMethodTile({
  selected,
  onSelect,
  label,
  icon,
  ariaLabel,
}: {
  selected: boolean
  onSelect: () => void
  label: string
  icon: React.ReactNode
  ariaLabel: string
}) {
  return (
    <div className="flex flex-col items-center gap-2 min-w-0">
      <button
        type="button"
        role="radio"
        aria-checked={selected}
        aria-label={ariaLabel}
        onClick={onSelect}
        className={`relative w-full aspect-[5/4] rounded-xl border-2 bg-white flex items-center justify-center touch-manipulation transition-colors ${
          selected ? 'border-blue-600' : 'border-gray-200 hover:border-gray-300'
        }`}
      >
        {selected && (
          <span
            className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded bg-blue-600"
            aria-hidden
          >
            <Check className="h-3 w-3 text-white stroke-[3]" />
          </span>
        )}
        {icon}
      </button>
      <span className="text-xs text-gray-900 text-center leading-tight">{label}</span>
    </div>
  )
}

export function PaymentMethodTiles({
  value,
  onChange,
}: {
  value: PaymentMethodChoice
  onChange: (method: PaymentMethodChoice) => void
}) {
  return (
    <div className="grid grid-cols-3 gap-3" role="radiogroup" aria-label="How would you like to pay?">
      <PaymentMethodTile
        selected={value === 'card'}
        onSelect={() => onChange('card')}
        label="New card"
        icon={
          <span className="inline-flex items-center gap-0.5 text-gray-900">
            <CreditCard className="h-7 w-7" strokeWidth={1.5} />
            <Plus className="h-4 w-4 -ml-1" strokeWidth={2} />
          </span>
        }
        ariaLabel="Pay with a new card"
      />
      <PaymentMethodTile
        selected={value === 'apple_pay'}
        onSelect={() => onChange('apple_pay')}
        label="Apple Pay"
        icon={<ApplePayMark size="list" className="scale-125" />}
        ariaLabel="Pay with Apple Pay"
      />
      <PaymentMethodTile
        selected={value === 'google_pay'}
        onSelect={() => onChange('google_pay')}
        label="Google Pay"
        icon={<GooglePayMark size="list" className="scale-125" />}
        ariaLabel="Pay with Google Pay"
      />
    </div>
  )
}
