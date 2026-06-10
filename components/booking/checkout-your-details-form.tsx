'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export type CheckoutYourDetailsFields = {
  firstName: string
  lastName: string
  email: string
  phone: string
}

export function CheckoutYourDetailsForm({
  values,
  onChange,
  idPrefix = 'checkout-details',
}: {
  values: CheckoutYourDetailsFields
  onChange: (patch: Partial<CheckoutYourDetailsFields>) => void
  idPrefix?: string
}) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-firstName`} className="text-sm font-medium">
            First name <span className="text-red-600">*</span>
          </Label>
          <Input
            id={`${idPrefix}-firstName`}
            value={values.firstName}
            onChange={(e) => onChange({ firstName: e.target.value })}
            className="h-11"
            autoComplete="given-name"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-lastName`} className="text-sm font-medium">
            Last name <span className="text-red-600">*</span>
          </Label>
          <Input
            id={`${idPrefix}-lastName`}
            value={values.lastName}
            onChange={(e) => onChange({ lastName: e.target.value })}
            className="h-11"
            autoComplete="family-name"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-email`} className="text-sm font-medium">
          Email address <span className="text-red-600">*</span>
        </Label>
        <Input
          id={`${idPrefix}-email`}
          type="email"
          value={values.email}
          onChange={(e) => onChange({ email: e.target.value })}
          className="h-11"
          autoComplete="email"
          required
        />
        <p className="text-xs text-gray-500">Confirmation email goes to this address</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-phone`} className="text-sm font-medium">
          Phone number <span className="text-red-600">*</span>
        </Label>
        <Input
          id={`${idPrefix}-phone`}
          type="tel"
          value={values.phone}
          onChange={(e) => onChange({ phone: e.target.value })}
          className="h-11"
          autoComplete="tel"
          required
        />
      </div>
    </div>
  )
}
