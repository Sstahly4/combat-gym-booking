'use client'

import type { ReactNode } from 'react'
import { CreditCard } from 'lucide-react'
import { ApplePayMark, CardBrandLogosRow, GooglePayMark } from '@/components/booking/payment-brand-logos'

export type PaymentMethodChoice = 'card' | 'apple_pay' | 'google_pay'

function PaymentMethodRadio({ selected }: { selected: boolean }) {
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

function PaymentMethodOption({
  selected,
  onSelect,
  label,
  icon,
  children,
  ariaLabel,
}: {
  selected: boolean
  onSelect: () => void
  label: string
  icon: ReactNode
  children?: ReactNode
  ariaLabel: string
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="w-full text-left px-4 py-3.5 flex items-center gap-3 transition-colors hover:bg-gray-50/80"
      aria-pressed={selected}
      aria-label={ariaLabel}
    >
      <div className="flex w-11 shrink-0 items-center justify-start text-gray-900">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[15px] font-medium text-gray-900">{label}</div>
        {children}
      </div>
      <PaymentMethodRadio selected={selected} />
    </button>
  )
}

export function PaymentMethodPicker({
  value,
  onChange,
}: {
  value: PaymentMethodChoice
  onChange: (method: PaymentMethodChoice) => void
}) {
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
      <PaymentMethodOption
        selected={value === 'card'}
        onSelect={() => onChange('card')}
        label="Credit or debit card"
        icon={<CreditCard className="h-5 w-5 shrink-0 text-gray-900" strokeWidth={1.75} />}
        ariaLabel="Pay with credit or debit card"
      >
        <CardBrandLogosRow size="subtext" className="mt-1.5" />
      </PaymentMethodOption>
      <PaymentMethodOption
        selected={value === 'google_pay'}
        onSelect={() => onChange('google_pay')}
        label="Google Pay"
        icon={<GooglePayMark size="list" />}
        ariaLabel="Pay with Google Pay"
      />
      <PaymentMethodOption
        selected={value === 'apple_pay'}
        onSelect={() => onChange('apple_pay')}
        label="Apple Pay"
        icon={<ApplePayMark size="list" />}
        ariaLabel="Pay with Apple Pay"
      />
    </div>
  )
}
